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

  completeOnboarding: (formData) => fetch(`${BASE_URL}/students/onboarding`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(), // Do NOT set Content-Type for FormData
    },
    body: formData,
  }).then(handleResponse),

  generateSkillAssessment: (skills) => fetch(`${BASE_URL}/students/assessment/generate`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ skills }),
  }).then(handleResponse),

  evaluateSkillAssessment: (answers, infractions = 0) => fetch(`${BASE_URL}/students/assessment/evaluate`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ answers, infractions }),
  }).then(handleResponse),

  getJobs: () => fetch(`${BASE_URL}/jobs`, {
    headers: { ...getAuthHeader() }
  }).then(handleResponse),

  getTopCandidates: (jobId) => fetch(`${BASE_URL}/jobs/${jobId}/top-candidates`, {
    headers: { ...getAuthHeader() }
  }).then(handleResponse),

  shortlistTopCandidate: (jobId, studentId) => fetch(`${BASE_URL}/jobs/${jobId}/shortlist-student`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ studentId }),
  }).then(handleResponse),

  parseJD: (data) => {
    const isFormData = data instanceof FormData;
    const headers = { ...getAuthHeader() };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    return fetch(`${BASE_URL}/jobs/parse-jd`, {
      method: 'POST',
      headers,
      body: isFormData ? data : JSON.stringify(data),
    }).then(handleResponse);
  },

  createJob: (data) => {
    const isFormData = data instanceof FormData;
    const headers = { ...getAuthHeader() };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    return fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers,
      body: isFormData ? data : JSON.stringify(data),
    }).then(handleResponse);
  },

  getJobApplicants: (jobId) => fetch(`${BASE_URL}/jobs/${jobId}/applicants`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  getAllApplicants: () => fetch(`${BASE_URL}/jobs/applicants/all`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  getStudentApplications: () => fetch(`${BASE_URL}/applications`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  applyToJob: (data) => fetch(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

  updateApplicationStatus: (id, data) => fetch(`${BASE_URL}/applications/${id}/status`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

  getApplicationQuestions: (id) => fetch(`${BASE_URL}/applications/${id}/questions`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  evaluateApplicationAI: (id, data) => fetch(`${BASE_URL}/applications/${id}/evaluate`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

  getStudents: () => fetch(`${BASE_URL}/admin/students`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  verifyStudent: (studentId, isVerified) =>
    fetch(`${BASE_URL}/admin/verify-student/${studentId}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ isVerified }),
    }).then(handleResponse),

  getInternships: () => fetch(`${BASE_URL}/internships`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  createInternship: (data) => fetch(`${BASE_URL}/internships`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

  createKRA: (internshipId, data) => fetch(`${BASE_URL}/internships/${internshipId}/kras`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

  updateKRAStatus: (internshipId, kraId, data) => fetch(`${BASE_URL}/internships/${internshipId}/kras/${kraId}/status`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

  submitKRAEvidence: (internshipId, kraId, data) => fetch(`${BASE_URL}/internships/${internshipId}/kras/${kraId}/submissions`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

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

  getCompanies: () => fetch(`${BASE_URL}/companies`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  createCompany: (data) => fetch(`${BASE_URL}/companies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data),
  }).then(handleResponse),

  getMyCompany: () => fetch(`${BASE_URL}/companies/me`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  deleteCompany: (id) => fetch(`${BASE_URL}/companies/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  }).then(handleResponse),

  getCompanyById: (id) => fetch(`${BASE_URL}/companies/${id}`, {
    headers: getAuthHeader(),
  }).then(handleResponse),

  updateMyCompany: (data) => fetch(`${BASE_URL}/companies/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data),
  }).then(handleResponse),
};

export default api;
