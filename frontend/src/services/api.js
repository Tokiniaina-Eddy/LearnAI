import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('learnai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('learnai_token');
      localStorage.removeItem('learnai_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ────────────────────────────────────────────────────────────────────
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  me: () => api.get('/auth/me'),
};

// ── Profile ──────────────────────────────────────────────────────────────────
export const profileService = {
  get: () => api.get('/profile'),
  create: (data) => api.post('/profile', data),
  update: (data) => api.put('/profile', data),
};

// ── Learning Goals ────────────────────────────────────────────────────────────
export const goalService = {
  list: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  get: (id) => api.get(`/goals/${id}`),
  update: (id, data) => api.put(`/goals/${id}`, data),
};

// ── Evaluation ────────────────────────────────────────────────────────────────
export const evaluationService = {
  generate: (goalId) => api.post(`/goals/${goalId}/evaluation/generate`),
  submit: (goalId, answers) => api.post(`/goals/${goalId}/evaluation/submit`, { answers }),
};

// ── Courses & Modules & Lessons ───────────────────────────────────────────────
export const courseService = {
  generate: (goalId) => api.post(`/goals/${goalId}/course/generate`),
  get: (goalId) => api.get(`/goals/${goalId}/course`),
  getModule: (moduleId) => api.get(`/modules/${moduleId}`),
  getLesson: (lessonId) => api.get(`/lessons/${lessonId}`),
};

// ── Quiz ──────────────────────────────────────────────────────────────────────
export const quizService = {
  get: (lessonId) => api.get(`/lessons/${lessonId}/quiz`),
  submit: (quizId, answers) => api.post(`/quizzes/${quizId}/submit`, { answers }),
};

// ── Exercises ─────────────────────────────────────────────────────────────────
export const exerciseService = {
  get: (lessonId) => api.get(`/lessons/${lessonId}/exercises`),
  submit: (exerciseId, code) => api.post(`/exercises/${exerciseId}/submit`, { code }),
};

// ── Progress ──────────────────────────────────────────────────────────────────
export const progressService = {
  get: () => api.get('/progress'),
  markLesson: (lessonId) => api.post(`/progress/lessons/${lessonId}/complete`),
};

// ── Skills ────────────────────────────────────────────────────────────────────
export const skillService = {
  getByGoal: (goalId) => api.get(`/goals/${goalId}/skills`),
};

// ── AI Tutor ──────────────────────────────────────────────────────────────────
export const tutorService = {
  sendMessage: (data) => api.post('/tutor/chat', data),
  getHistory: (lessonId) => api.get(`/tutor/history/${lessonId}`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardService = {
  getSummary: () => api.get('/dashboard'),
};
