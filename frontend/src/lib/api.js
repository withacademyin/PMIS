const BASE_URL = '/api/v1';

const getAuthHeader = () => {
  const token = localStorage.getItem('hiring_portal_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw {
      status: res.status,
      message: data.message || 'API Error',
      data
    };
  }
  return data;
};

export const api = {
  checkHealth: () => fetch(`${BASE_URL}/health`).then(handleResponse),

  register: (data) => fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),

  login: (credentials) => fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  }).then(handleResponse),

  // ITI Endpoints
  getITIs: () => fetch(`${BASE_URL}/itis`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  createITI: (data) => fetch(`${BASE_URL}/itis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

  inviteOfficer: (district, email) => fetch(`${BASE_URL}/officers/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ district, email }),
  }).then(handleResponse),

  deleteITI: (id) => fetch(`${BASE_URL}/itis/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  }).then(handleResponse),

  // Worker Endpoints
  getWorkers: (query = '') => fetch(`${BASE_URL}/workers${query}`, {
    headers: getAuthHeader(),
  }).then(handleResponse),
  
  verifyWorker: (id, isVerified) => fetch(`${BASE_URL}/workers/${id}/verify`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ isVerified }),
  }).then(handleResponse),
  
  getWorkerProfile: () => fetch(`${BASE_URL}/workers/me`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  updateWorkerProfile: (id, data) => fetch(`${BASE_URL}/workers/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

  // Officer Endpoints
  getOfficerProfile: () => fetch(`${BASE_URL}/officers/me`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  updateOfficerProfile: (data) => fetch(`${BASE_URL}/officers/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

  // Work Requirements
  getRequirements: () => fetch(`${BASE_URL}/requirements`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  createRequirement: (data) => fetch(`${BASE_URL}/requirements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

  updateRequirement: (id, data) => fetch(`${BASE_URL}/requirements/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

  deleteRequirement: (id) => fetch(`${BASE_URL}/requirements/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  }).then(handleResponse),

  matchRequirementToITIs: (id) => fetch(`${BASE_URL}/requirements/${id}/match-itis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  }).then(handleResponse),

  getRequirementITIs: (id) => fetch(`${BASE_URL}/requirements/${id}/itis`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  getITIWorkers: (id, trade = '') => fetch(`${BASE_URL}/itis/${id}/workers${trade ? `?trade=${encodeURIComponent(trade)}` : ''}`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  // Shortlists
  getShortlists: () => fetch(`${BASE_URL}/shortlists`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  addToShortlist: (data) => fetch(`${BASE_URL}/shortlists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

  updateShortlistStatus: (id, status, notes) => fetch(`${BASE_URL}/shortlists/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ status, notes }),
  }).then(handleResponse),

  removeFromShortlist: (id) => fetch(`${BASE_URL}/shortlists/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  }).then(handleResponse),

  // Settings
  getSystemSettings: () => fetch(`${BASE_URL}/settings`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  updateSystemSettings: (data) => fetch(`${BASE_URL}/settings`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data),
  }).then(handleResponse),
};

export default api;
