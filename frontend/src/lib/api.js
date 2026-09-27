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

  acceptOfficerInvitation: (data) => fetch(`${BASE_URL}/auth/accept-invite`, {
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

  searchWorkers: (params = {}) => {
    const query = new URLSearchParams(params);
    return fetch(`${BASE_URL}/workers/search?${query.toString()}`, {
      headers: getAuthHeader(),
    }).then(handleResponse);
  },
  
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

  getTopNearbyITIs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.lat !== undefined) query.set('lat', params.lat);
    if (params.lng !== undefined) query.set('lng', params.lng);
    if (params.radiusKm) query.set('radiusKm', params.radiusKm);
    if (params.trade) query.set('trade', params.trade);
    if (params.limit) query.set('limit', params.limit);
    return fetch(`${BASE_URL}/itis/top-nearby?${query.toString()}`, {
      headers: getAuthHeader(),
    }).then(handleResponse);
  },

  matchRequirementToITIs: (id, locationParams = {}) => fetch(`${BASE_URL}/requirements/${id}/match-itis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(locationParams),
  }).then(handleResponse),

  getRequirementITIs: (id) => fetch(`${BASE_URL}/requirements/${id}/itis`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  getITIWorkers: (id, trade = '', requirementId = '') => {
    const query = new URLSearchParams();
    if (trade) query.set('trade', trade);
    if (requirementId) query.set('requirementId', requirementId);
    return fetch(`${BASE_URL}/itis/${id}/workers${query.size ? `?${query.toString()}` : ''}`, {
      headers: getAuthHeader(),
    }).then(handleResponse);
  },

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

  // ==========================================
  // PMIS Opportunity Radar Endpoints
  // ==========================================
  getRadarDistricts: () => fetch(`${BASE_URL}/radar/districts`, {
    headers: getAuthHeader()
  }).then(handleResponse),

  getRadarDashboard: (districtCode) => {
    const q = districtCode ? `?districtCode=${encodeURIComponent(districtCode)}` : '';
    return fetch(`${BASE_URL}/radar/dashboard/summary${q}`, {
      headers: getAuthHeader()
    }).then(handleResponse);
  },

  getRadarMap: (districtCode) => {
    const q = districtCode ? `?districtCode=${encodeURIComponent(districtCode)}` : '';
    return fetch(`${BASE_URL}/radar/map${q}`, {
      headers: getAuthHeader()
    }).then(handleResponse);
  },

  getRadarOpportunities: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/radar/opportunities${query ? `?${query}` : ''}`, {
      headers: getAuthHeader()
    }).then(handleResponse);
  },

  getRadarOpportunityDetail: (id, catchmentMinutes = 60) => {
    return fetch(`${BASE_URL}/radar/opportunities/${id}?catchmentMinutes=${catchmentMinutes}`, {
      headers: getAuthHeader()
    }).then(handleResponse);
  },

  getRadarInstitutions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/radar/institutions${query ? `?${query}` : ''}`, {
      headers: getAuthHeader()
    }).then(handleResponse);
  },

  getRadarInstitutionDetail: (id) => {
    return fetch(`${BASE_URL}/radar/institutions/${id}`, {
      headers: getAuthHeader()
    }).then(handleResponse);
  },

  generateRadarBulletin: (data) => fetch(`${BASE_URL}/radar/bulletins/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data)
  }).then(handleResponse),

  planRadarCamp: (data) => fetch(`${BASE_URL}/radar/camps/plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data)
  }).then(handleResponse),

  getRadarActionPlan: (districtCode, weekIdentifier) => {
    const params = new URLSearchParams();
    if (districtCode) params.append('districtCode', districtCode);
    if (weekIdentifier) params.append('weekIdentifier', weekIdentifier);
    return fetch(`${BASE_URL}/radar/action-plan?${params.toString()}`, {
      headers: getAuthHeader()
    }).then(handleResponse);
  },

  toggleRadarActionPlanItem: (id) => fetch(`${BASE_URL}/radar/action-plan/${id}/toggle`, {
    method: 'PATCH',
    headers: getAuthHeader()
  }).then(handleResponse),

  addRadarActionPlanNote: (id, noteText) => fetch(`${BASE_URL}/radar/action-plan/${id}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ noteText })
  }).then(handleResponse),

  getRadarOutcomes: (districtCode) => {
    const q = districtCode ? `?districtCode=${encodeURIComponent(districtCode)}` : '';
    return fetch(`${BASE_URL}/radar/outcomes${q}`, {
      headers: getAuthHeader()
    }).then(handleResponse);
  },
};

export default api;
