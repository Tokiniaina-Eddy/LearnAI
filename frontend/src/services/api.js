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
// POST /api/v1/auth/register             → RegisterPendingResponse { message, email }
// POST /api/v1/auth/verify-email         → TokenOut { access_token, user }
// POST /api/v1/auth/resend-verification  → MessageResponse { message }
// POST /api/v1/auth/login                → TokenOut { access_token, user }
// GET  /api/v1/auth/me                   → UserOut
// PUT  /api/v1/auth/me                   → UserOut
// POST /api/v1/auth/forgot-password      → MessageResponse { message }
// POST /api/v1/auth/verify-reset-otp     → MessageResponse { message }
// POST /api/v1/auth/reset-password       → MessageResponse { message }
// GET  /api/v1/auth/google               → Redirect Google OAuth
// GET  /api/v1/auth/google/callback      → Redirect frontend with JWT
export const authService = {
  register:           (data)        => api.post('/auth/register', data),
  verifyEmail:        (data)        => api.post('/auth/verify-email', data),
  resendVerification: (email)       => api.post('/auth/resend-verification', { email }),
  login:              (data)        => api.post('/auth/login', data),
  me:                 ()            => api.get('/auth/me'),
  updateMe:           (data)        => api.put('/auth/me', data),
  forgotPassword:     (email)       => api.post('/auth/forgot-password', { email }),
  verifyResetOtp:     (data)        => api.post('/auth/verify-reset-otp', data),
  resetPassword:      (data)        => api.post('/auth/reset-password', data),
};

// ── Profile ────────────────────────────────────────────────────────────────
export const profileService = {
  get:    ()     => api.get('/profile'),
  create: (data) => api.post('/profile', data),
  update: (data) => api.put('/profile', data),
};

// ── Learning Goals ─────────────────────────────────────────────────────────
export const goalService = {
  list:   ()          => api.get('/goals'),
  create: (data)      => api.post('/goals', data),
  get:    (id)        => api.get(`/goals/${id}`),
  update: (id, data)  => api.put(`/goals/${id}`, data),
  delete: (id)        => api.delete(`/goals/${id}`),
};

// ── Evaluation ─────────────────────────────────────────────────────────────
export const evaluationService = {
  generate: (goalId)          => api.post(`/goals/${goalId}/evaluation/generate`),
  submit:   (goalId, answers) => api.post(`/goals/${goalId}/evaluation/submit`, { answers }),
};

// ── Courses ────────────────────────────────────────────────────────────────
export const courseService = {
  generate:  (goalId)   => api.post(`/goals/${goalId}/course/generate`),
  get:       (goalId)   => api.get(`/goals/${goalId}/course`),
  getModule: (moduleId) => api.get(`/modules/${moduleId}`),
  getLesson: (lessonId) => api.get(`/lessons/${lessonId}`),
};

// ── Quizzes ────────────────────────────────────────────────────────────────
export const quizService = {
  getByLesson: (lessonId)        => api.get(`/lessons/${lessonId}/quiz`),
  getByModule: (moduleId)        => api.get(`/quizzes/module/${moduleId}`),
  get:         (quizId)          => api.get(`/quizzes/${quizId}`),
  submit:      (quizId, answers) => api.post(`/quizzes/${quizId}/submit`, { answers }),
};

// ── Exercises ──────────────────────────────────────────────────────────────
export const exerciseService = {
  getByLesson: (lessonId)        => api.get(`/lessons/${lessonId}/exercises`),
  submit:      (exerciseId, sol) => api.post(`/exercises/${exerciseId}/submit`, { solution: sol }),
};

// ── Progress ───────────────────────────────────────────────────────────────
export const progressService = {
  list:   ()              => api.get('/progress'),
  update: (lessonId, data) => api.put(`/progress/${lessonId}`, data),
};

// ── Skills ─────────────────────────────────────────────────────────────────
export const skillService = {
  list: (goalId) => api.get(`/goals/${goalId}/skills`),
};

// ── Dashboard ──────────────────────────────────────────────────────────────
export const dashboardService = {
  get: () => api.get('/dashboard'),
};

// ── Tutor ──────────────────────────────────────────────────────────────────
export const tutorService = {
  chat: (data) => api.post('/tutor/chat', data),
};
