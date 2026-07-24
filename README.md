# 🍺 Performance App — Control de Producción de Envasado

Aplicación web progresiva (PWA) e industrial para el registro, seguimiento y análisis en tiempo real del control de producción hora a hora y gestión de incidencias en plantas de envasado cervecero.

---

## 🚀 Características Principales

- **Registro Horario Intuitivo ("Mobile-First"):** Captura de botellas producidas por bloque de hora en turnos rotativos de 8 horas (24h continuas).
- **Cálculo Automático de Métricas KPI:**
  - **HL Real:** Hectolitros producidos basados en el volumen del SKU.
  - **GLY% (Gross Line Yield):** Eficiencia bruta de línea calculada en tiempo real sobre la velocidad nominal.
  - **HL Acumulados:** Seguimiento progresivo real vs programado a lo largo del turno y día.
- **Gráfico Interactivo de Productividad:** Réplica digital del formato "HORA HORA" del Excel de control de producción con soporte de comparativa acumulada.
- **Historial & Filtrado Avanzado de Incidencias:** Registro y consulta de fallas por fecha (específica o histórica completa), turno, hora, categoría y nivel de prioridad.
- **Generador de Reportes:** Creación de capturas y reportes descargables consolidados por hora, turno o día.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React, Vite, Tailwind CSS v4, Recharts, Lucide Icons, Context API.
- **Backend API:** Node.js, Express, PostgreSQL / Supabase, Dotenv.
- **Despliegue recomendando:** Netlify (Frontend) + Supabase (Database/Auth).

---

## 📁 Estructura del Proyecto

```
Performance App/
├── api/                    # Backend API en Node.js + Express + PostgreSQL
├── performance-app/        # Frontend React + Vite + Tailwind CSS
├── supabase/               # Esquemas SQL y migraciones de base de datos
├── netlify.toml            # Configuración de despliegue automático en Netlify
└── README.md
```

---

## 💻 Despliegue en Netlify

El proyecto incluye la configuración preconfigurada en `netlify.toml`. Al conectar este repositorio en Netlify:
- **Base Directory:** `performance-app`
- **Build Command:** `npm run build`
- **Publish Directory:** `performance-app/dist`
