-- ============================================================================
-- Performance App — Migración Inicial
-- Planta de Envasado Cervecero — Control de Producción Hora a Hora
-- ============================================================================

-- ============================================================================
-- 1. TABLAS PRINCIPALES
-- ============================================================================

-- 1.1 Perfil de usuarios (extiende auth.users de Supabase)
CREATE TABLE public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'operador'
                CHECK (role IN ('operador', 'supervisor', 'admin')),
    line_id     UUID,  -- línea asignada por defecto (FK se agrega después)
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Perfiles de usuario: operadores, supervisores, admins';

-- 1.2 Líneas de envasado
CREATE TABLE public.lines (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  TEXT NOT NULL UNIQUE,          -- "Línea 1", "Línea 3"
    nominal_speed_bph     INTEGER NOT NULL DEFAULT 60000, -- botellas por hora nominal
    bottle_volume_liters  NUMERIC(6,4) NOT NULL DEFAULT 0.6300, -- volumen en litros
    target_hl_per_hour    NUMERIC(8,2) NOT NULL DEFAULT 378.00, -- meta HL/hora
    target_hl_per_day     NUMERIC(10,2) NOT NULL DEFAULT 9072.00, -- meta HL/día
    is_active             BOOLEAN NOT NULL DEFAULT true,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lines IS 'Líneas de envasado con velocidad nominal y metas';

-- Agregar FK de profiles.line_id
ALTER TABLE public.profiles
    ADD CONSTRAINT fk_profiles_line
    FOREIGN KEY (line_id) REFERENCES public.lines(id) ON DELETE SET NULL;

-- 1.3 SKUs (formatos de producto)
CREATE TABLE public.skus (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                  TEXT NOT NULL UNIQUE,          -- "CR650RT", "PT620RT"
    description           TEXT NOT NULL,                 -- "Cristal 650ml Retornable"
    bottle_volume_liters  NUMERIC(6,4) NOT NULL DEFAULT 0.6300,
    brand                 TEXT,                          -- "Cristal", "Pilsen Trujillo"
    is_active             BOOLEAN NOT NULL DEFAULT true,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.skus IS 'Productos/formatos de cerveza con código y volumen';

-- 1.4 Registros de producción hora a hora
CREATE TABLE public.hourly_logs (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_id           UUID NOT NULL REFERENCES public.lines(id),
    sku_id            UUID REFERENCES public.skus(id),
    user_id           UUID NOT NULL REFERENCES auth.users(id),
    production_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    shift_number      SMALLINT NOT NULL CHECK (shift_number IN (1, 2, 3)),
    hour_start        TIME NOT NULL,                    -- "07:00", "08:00"
    hour_end          TIME NOT NULL,                    -- "08:00", "09:00"
    bottles_produced  INTEGER NOT NULL DEFAULT 0 CHECK (bottles_produced >= 0),
    cases_produced    INTEGER DEFAULT 0,
    planned_hl        NUMERIC(10,3),                    -- HL programados para este bloque
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Evitar duplicados: una línea no puede tener dos registros para la misma hora del mismo día
    CONSTRAINT uq_hourly_log_slot
        UNIQUE (line_id, production_date, shift_number, hour_start)
);

COMMENT ON TABLE public.hourly_logs IS 'Producción registrada hora a hora por línea y turno';

-- 1.5 Incidencias / fallas asociadas a un bloque horario
CREATE TABLE public.incidents (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hourly_log_id     UUID NOT NULL REFERENCES public.hourly_logs(id) ON DELETE CASCADE,
    reported_by       UUID NOT NULL REFERENCES auth.users(id),
    category          TEXT NOT NULL DEFAULT 'operativa'
                      CHECK (category IN (
                          'mecanica', 'electrica', 'insumos',
                          'operativa', 'servicios', 'calidad', 'otra'
                      )),
    downtime_minutes  INTEGER NOT NULL DEFAULT 0 CHECK (downtime_minutes >= 0),
    description       TEXT NOT NULL,
    root_cause        TEXT,
    corrective_action TEXT,
    priority          TEXT NOT NULL DEFAULT 'media'
                      CHECK (priority IN ('baja', 'media', 'alta', 'critica')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.incidents IS 'Fallas, paros e incidencias técnicas por bloque horario';


-- ============================================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX idx_hourly_logs_date_line
    ON public.hourly_logs (production_date, line_id);

CREATE INDEX idx_hourly_logs_shift
    ON public.hourly_logs (production_date, line_id, shift_number);

CREATE INDEX idx_hourly_logs_user
    ON public.hourly_logs (user_id, production_date);

CREATE INDEX idx_incidents_log
    ON public.incidents (hourly_log_id);

CREATE INDEX idx_incidents_category
    ON public.incidents (category, created_at);

CREATE INDEX idx_profiles_role
    ON public.profiles (role);


-- ============================================================================
-- 3. VISTAS CALCULADAS (Métricas de negocio)
-- ============================================================================

-- 3.1 Performance horaria con HL y GLY calculados
CREATE OR REPLACE VIEW public.v_hourly_performance AS
SELECT
    hl.id,
    hl.line_id,
    l.name                          AS line_name,
    hl.sku_id,
    s.code                          AS sku_code,
    s.description                   AS sku_description,
    hl.user_id,
    p.full_name                     AS operator_name,
    hl.production_date,
    hl.shift_number,
    hl.hour_start,
    hl.hour_end,
    hl.bottles_produced,
    hl.cases_produced,
    l.nominal_speed_bph,

    -- Volumen Real (HL) = (botellas × volumen_botella_litros) / 100
    ROUND(
        (hl.bottles_produced * COALESCE(s.bottle_volume_liters, l.bottle_volume_liters)) / 100,
        3
    )                               AS real_hl,

    -- HL Programados para la hora
    COALESCE(hl.planned_hl, l.target_hl_per_hour) AS planned_hl,

    -- GLY % = (botellas_producidas / velocidad_nominal) × 100
    CASE
        WHEN l.nominal_speed_bph > 0 THEN
            ROUND((hl.bottles_produced::NUMERIC / l.nominal_speed_bph) * 100, 2)
        ELSE 0
    END                             AS gly_pct,

    -- Conteo de incidencias y minutos de paro
    COALESCE(inc.incident_count, 0) AS incident_count,
    COALESCE(inc.total_downtime, 0) AS total_downtime_minutes,

    hl.notes,
    hl.created_at

FROM public.hourly_logs hl
JOIN public.lines l      ON l.id = hl.line_id
LEFT JOIN public.skus s  ON s.id = hl.sku_id
LEFT JOIN public.profiles p ON p.id = hl.user_id
LEFT JOIN LATERAL (
    SELECT
        COUNT(*)::INTEGER           AS incident_count,
        COALESCE(SUM(downtime_minutes), 0)::INTEGER AS total_downtime
    FROM public.incidents i
    WHERE i.hourly_log_id = hl.id
) inc ON true;

COMMENT ON VIEW public.v_hourly_performance IS 'Producción horaria con HL real, GLY% y downtime calculados';


-- 3.2 Resumen por turno
CREATE OR REPLACE VIEW public.v_shift_summary AS
SELECT
    hp.line_id,
    hp.line_name,
    hp.production_date,
    hp.shift_number,
    COUNT(*)::INTEGER                              AS hours_logged,
    SUM(hp.bottles_produced)::INTEGER              AS total_bottles,
    SUM(hp.real_hl)                                AS total_hl_real,
    SUM(hp.planned_hl)                             AS total_hl_planned,
    ROUND(AVG(hp.gly_pct), 2)                      AS avg_gly_pct,
    SUM(hp.total_downtime_minutes)::INTEGER        AS total_downtime_minutes,
    SUM(hp.incident_count)::INTEGER                AS total_incidents
FROM public.v_hourly_performance hp
GROUP BY hp.line_id, hp.line_name, hp.production_date, hp.shift_number;

COMMENT ON VIEW public.v_shift_summary IS 'Resumen acumulado por turno: HL, GLY promedio, downtime';


-- 3.3 Resumen diario
CREATE OR REPLACE VIEW public.v_daily_summary AS
SELECT
    ss.line_id,
    ss.line_name,
    ss.production_date,
    SUM(ss.hours_logged)::INTEGER                  AS total_hours_logged,
    SUM(ss.total_bottles)::INTEGER                 AS total_bottles,
    SUM(ss.total_hl_real)                          AS total_hl_real,
    SUM(ss.total_hl_planned)                       AS total_hl_planned,
    ROUND(AVG(ss.avg_gly_pct), 2)                  AS daily_gly_pct,
    SUM(ss.total_downtime_minutes)::INTEGER        AS total_downtime_minutes,
    SUM(ss.total_incidents)::INTEGER               AS total_incidents
FROM public.v_shift_summary ss
GROUP BY ss.line_id, ss.line_name, ss.production_date;

COMMENT ON VIEW public.v_daily_summary IS 'Resumen diario consolidado por línea';


-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lines       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skus        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hourly_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents   ENABLE ROW LEVEL SECURITY;

-- 4.1 profiles: cualquiera autenticado puede leer; solo el propio usuario o admin puede editar
CREATE POLICY "profiles_select_authenticated"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "profiles_update_own_or_admin"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- 4.2 lines: lectura para todos; escritura solo para admin
CREATE POLICY "lines_select_authenticated"
    ON public.lines FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "lines_manage_admin"
    ON public.lines FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4.3 skus: lectura para todos; escritura solo para admin
CREATE POLICY "skus_select_authenticated"
    ON public.skus FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "skus_manage_admin"
    ON public.skus FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4.4 hourly_logs: lectura autenticada; insert si eres el user; update si eres el user o supervisor/admin
CREATE POLICY "hourly_logs_select_authenticated"
    ON public.hourly_logs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "hourly_logs_insert_own"
    ON public.hourly_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hourly_logs_update_own_or_supervisor"
    ON public.hourly_logs FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
        )
    );

-- 4.5 incidents: lectura autenticada; insert/update autenticado
CREATE POLICY "incidents_select_authenticated"
    ON public.incidents FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "incidents_insert_authenticated"
    ON public.incidents FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "incidents_update_reporter_or_supervisor"
    ON public.incidents FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = reported_by
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
        )
    );


-- ============================================================================
-- 5. TRIGGER: Crear perfil automáticamente al registrar usuario
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'operador')
    );
    RETURN NEW;
END;
$$;

-- Trigger que se ejecuta cuando se crea un nuevo usuario en auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- 6. TRIGGER: Actualizar updated_at automáticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_hourly_logs_updated_at
    BEFORE UPDATE ON public.hourly_logs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- 7. DATOS SEMILLA (SEED)
-- ============================================================================

-- Líneas de envasado (del Excel: Línea 1 y Línea 3)
INSERT INTO public.lines (name, nominal_speed_bph, bottle_volume_liters, target_hl_per_hour, target_hl_per_day)
VALUES
    ('Línea 1', 60000, 0.6300, 378.00, 9072.00),
    ('Línea 3', 60000, 0.6300, 378.00, 9072.00)
ON CONFLICT (name) DO NOTHING;

-- SKUs principales (extraídos del Excel)
INSERT INTO public.skus (code, description, bottle_volume_liters, brand)
VALUES
    ('CR650RT',      'Cristal 650ml Retornable',          0.6500, 'Cristal'),
    ('PT620RT',      'Pilsen Trujillo 620ml Retornable',  0.6200, 'Pilsen Trujillo'),
    ('CB620RT',      'Cusqueña Blanca 620ml Retornable',  0.6200, 'Cusqueña'),
    ('CM620RT',      'Cusqueña Malta 620ml Retornable',   0.6200, 'Cusqueña'),
    ('PC650RT',      'Pilsen Callao 650ml Retornable',    0.6500, 'Pilsen Callao'),
    ('CR650RTCOPA',  'Cristal 650ml Copa Retornable',     0.6500, 'Cristal')
ON CONFLICT (code) DO NOTHING;
