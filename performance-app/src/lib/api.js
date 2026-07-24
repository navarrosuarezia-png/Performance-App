const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de red' }));
    throw new Error(error.message || `Error ${response.status}`);
  }
  return response.json();
}

// --- Lines ---
export const linesApi = {
  getAll: () => request('/lines'),
  getById: (id) => request(`/lines/${id}`),
};

// --- SKUs ---
export const skusApi = {
  getAll: () => request('/skus'),
};

// --- Profiles ---
export const profilesApi = {
  getAll: () => request('/profiles'),
  getById: (id) => request(`/profiles/${id}`),
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
};

// --- Hourly Logs ---
export const hourlyLogsApi = {
  getByDateAndLine: (date, lineId) =>
    request(`/hourly-logs?date=${date}&line_id=${lineId}`),
  getByShift: (date, lineId, shift) =>
    request(`/hourly-logs?date=${date}&line_id=${lineId}&shift=${shift}`),
  create: (data) => request('/hourly-logs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/hourly-logs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// --- Incidents ---
export const incidentsApi = {
  getByLog: (logId) => request(`/incidents?hourly_log_id=${logId}`),
  getByFilters: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/incidents?${query}`);
  },
  create: (data) => request('/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/incidents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// --- Dashboard Views ---
export const dashboardApi = {
  getHourlyPerformance: (date, lineId) =>
    request(`/dashboard/hourly?date=${date}&line_id=${lineId}`),
  getShiftSummary: (date, lineId) =>
    request(`/dashboard/shift-summary?date=${date}&line_id=${lineId}`),
  getDailySummary: (date, lineId) =>
    request(`/dashboard/daily-summary?date=${date}&line_id=${lineId}`),
};
