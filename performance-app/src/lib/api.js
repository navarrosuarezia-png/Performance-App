import { supabase } from './supabase';

// --- Lines ---
export const linesApi = {
  getAll: async () => {
    const { data, error } = await supabase.from('lines').select('*').order('name');
    if (error) throw error;
    return data;
  },
  getById: async (id) => {
    const { data, error } = await supabase.from('lines').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
};

// --- SKUs ---
export const skusApi = {
  getAll: async () => {
    const { data, error } = await supabase.from('skus').select('*').order('code');
    if (error) throw error;
    return data;
  },
};

// --- Profiles ---
export const profilesApi = {
  getAll: async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data;
  },
  getById: async (id) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  login: async (email, password) => {
    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) throw authError;
    
    // Fetch profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
      
    if (profileError) throw profileError;
    return { ...authData.user, ...profileData };
  },
};

// --- Hourly Logs ---
export const hourlyLogsApi = {
  getByDateAndLine: async (date, lineId) => {
    const { data, error } = await supabase
      .from('hourly_logs')
      .select('*')
      .eq('production_date', date)
      .eq('line_id', lineId)
      .order('hour_start');
    if (error) throw error;
    return data;
  },
  getByShift: async (date, lineId, shift) => {
    const { data, error } = await supabase
      .from('hourly_logs')
      .select('*')
      .eq('production_date', date)
      .eq('line_id', lineId)
      .eq('shift_number', shift)
      .order('hour_start');
    if (error) throw error;
    return data;
  },
  create: async (logData) => {
    const { data, error } = await supabase.from('hourly_logs').insert(logData).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id, logData) => {
    const { data, error } = await supabase.from('hourly_logs').update(logData).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
};

// --- Incidents ---
export const incidentsApi = {
  getByLog: async (logId) => {
    const { data, error } = await supabase.from('incidents').select('*').eq('hourly_log_id', logId);
    if (error) throw error;
    return data;
  },
  getByFilters: async (params = {}) => {
    let query = supabase.from('incidents').select('*, hourly_logs!inner(*)');
    if (params.date) query = query.eq('hourly_logs.production_date', params.date);
    if (params.line_id) query = query.eq('hourly_logs.line_id', params.line_id);
    if (params.shift) query = query.eq('hourly_logs.shift_number', params.shift);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  create: async (incData) => {
    const { data, error } = await supabase.from('incidents').insert(incData).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id, incData) => {
    const { data, error } = await supabase.from('incidents').update(incData).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
};

// --- Dashboard Views ---
export const dashboardApi = {
  getHourlyPerformance: async (date, lineId) => {
    const { data, error } = await supabase.from('v_hourly_performance')
      .select('*')
      .eq('production_date', date)
      .eq('line_id', lineId)
      .order('hour_start');
    if (error) throw error;
    return data;
  },
  getShiftSummary: async (date, lineId) => {
    const { data, error } = await supabase.from('v_shift_summary')
      .select('*')
      .eq('production_date', date)
      .eq('line_id', lineId);
    if (error) throw error;
    return data;
  },
  getDailySummary: async (date, lineId) => {
    const { data, error } = await supabase.from('v_daily_summary')
      .select('*')
      .eq('production_date', date)
      .eq('line_id', lineId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};
