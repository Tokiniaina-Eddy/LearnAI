import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Attach JWT token to every request ──────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('learnai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Handle 401 globally ────────────────────────────────────────────────────
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

// ── Auth ───────────────────────────────────────────────────────────────────
// POST /api/v1/auth/register  → TokenOut { access_token, user }
// POST /api/v1/auth/login     → TokenOut { access_token, user }
// GET  /api/v1/auth/me        → UserOut
// PUT  /api/v1/auth/me        → UserOut
// POST /api/v1/auth/forgot-password
// POST /api/v1/auth/reset-password
export const authService = {
  register:       (data)  => api.post('/auth/register', data),
  login:          (data)  => api.post('/auth/login', data),
  me:             ()      => api.get('/auth/me'),
  updateMe:       (data)  => api.put('/auth/me', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword:  (data)  => api.post('/auth/reset-password', data),
};

// ── Profile ────────────────────────────────────────────────────────────────
// GET  /api/v1/profile
// POST /api/v1/profile
// PUT  /api/v1/profile
export const profileService = {
  get:    ()     => api.get('/profile'),
  create: (data) => api.post('/profile', data),
  update: (data) => api.put('/profile', data),
};

// ── Learning Goals ─────────────────────────────────────────────────────────
// GET    /api/v1/goals
// POST   /api/v1/goals
// GET    /api/v1/goals/:id
// PUT    /api/v1/goals/:id
// DELETE /api/v1/goals/:id
export const goalService = {
  list:   ()          => api.get('/goals'),
  create: (data)      => api.post('/goals', data),
  get:    (id)        => api.get(`/goals/${id}`),
  update: (id, data)  => api.put(`/goals/${id}`, data),
  delete: (id)        => api.delete(`/goals/${id}`),
};

// ── Evaluation ─────────────────────────────────────────────────────────────
// POST /api/v1/goals/:goalId/evaluation/generate
// POST /api/v1/goals/:goalId/evaluation/submit
export const evaluationService = {
  generate: (goalId)          => api.post(`/goals/${goalId}/evaluation/generate`),
  submit:   (goalId, answers) => api.post(`/goals/${goalId}/evaluation/submit`, { answers }),
};

// ── Courses ────────────────────────────────────────────────────────────────
// POST /api/v1/goals/:goalId/course/generate
// GET  /api/v1/goals/:goalId/course
// GET  /api/v1/modules/:moduleId
// GET  /api/v1/lessons/:lessonId
export const courseService = {
  generate:  (goalId)   => api.post(`/goals/${goalId}/course/generate`),
  get:       (goalId)   => api.get(`/goals/${goalId}/course`),
  getModule: (moduleId) => api.get(`/modules/${moduleId}`),
  getLesson: (lessonId) => api.get(`/lessons/${lessonId}`),
};

// ── Quizzes ────────────────────────────────────────────────────────────────
// GET  /api/v1/lessons/:lessonId/quiz
// GET  /api/v1/quizzes/:quizId
// GET  /api/v1/quizzes/module/:moduleId
// POST /api/v1/quizzes/:quizId/submit
export const quizService = {
  getByLesson: (lessonId)          => api.get(`/lessons/${lessonId}/quiz`),
  getByModule: (moduleId)          => api.get(`/quizzes/module/${moduleId}`),
  get:         (quizId)            => api.get(`/quizzes/${quizId}`),
  submit:      (quizId, answers)   => api.post(`/quizzes/${quizId}/submit`, { answers }),
};

// ── Exercises ──────────────────────────────────────────────────────────────
// GET  /api/v1/lessons/:lessonId/exercises
// POST /api/v1/exercises/:exerciseId/submit
export const exerciseService = {
  getByLesson: (lessonId)         => api.get(`/lessons/${lessonId}/exercises`),
  submit:      (exerciseId, code) => api.post(`/exercises/${exerciseId}/submit`, { code }),
};

// ── Progress ───────────────────────────────────────────────────────────────
// GET  /api/v1/progress
// POST /api/v1/progress/lessons/:lessonId/complete
export const progressService = {
  get:        ()         => api.get('/progress'),
  markLesson: (lessonId) => api.post(`/progress/lessons/${lessonId}/complete`),
};

// ── Skills ─────────────────────────────────────────────────────────────────
// GET /api/v1/goals/:goalId/skills
export const skillService = {
  getByGoal: (goalId) => api.get(`/goals/${goalId}/skills`),
};

// ── AI Tutor ───────────────────────────────────────────────────────────────
// POST /api/v1/tutor/chat
// GET  /api/v1/tutor/history/:lessonId
export const tutorService = {
  sendMessage: (data)      => api.post('/tutor/chat', data),
  getHistory:  (lessonId)  => api.get(`/tutor/history/${lessonId}`),
};

// ── Dashboard ──────────────────────────────────────────────────────────────
// GET /api/v1/dashboard
export const dashboardService = {
  getSummary: () => api.get('/dashboard'),
};
