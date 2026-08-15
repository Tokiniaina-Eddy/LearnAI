import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts
import AuthLayout from './components/layout/AuthLayout';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Landing
import LandingPage from './pages/landing/LandingPage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Onboarding
import OnboardingPage from './pages/onboarding/OnboardingPage';

// Evaluation
import EvaluationPage from './pages/evaluation/EvaluationPage';

// App pages
import DashboardPage from './pages/dashboard/DashboardPage';
import ProgressPage from './pages/dashboard/ProgressPage';
import LearningIndexPage from './pages/learning/LearningIndexPage';
import LearningPathPage from './pages/learning/LearningPathPage';
import LessonPage from './pages/learning/LessonPage';
import TutorPage from './pages/learning/TutorPage';
import QuizPage from './pages/quiz/QuizPage';
import SkillMapPage from './pages/skillmap/SkillMapPage';
import SettingsPage from './pages/settings/SettingsPage';

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <Routes>
          {/* Landing page publique — accessible sans auth */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Onboarding (protected, no sidebar) */}
          <Route
            path="/onboarding/*"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Evaluation (protected, full screen) */}
          <Route
            path="/evaluation/:goalId"
            element={
              <ProtectedRoute>
                <EvaluationPage />
              </ProtectedRoute>
            }
          />

          {/* Main app (with sidebar) */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/learning" element={<LearningIndexPage />} />
            <Route path="/learning/:goalId" element={<LearningPathPage />} />
            <Route path="/lesson/:lessonId" element={<LessonPage />} />
            <Route path="/tutor" element={<TutorPage />} />
            <Route path="/quiz/:quizId" element={<QuizPage />} />
            <Route path="/quiz/module/:moduleId" element={<QuizPage />} />
            <Route path="/skillmap" element={<SkillMapPage />} />
            <Route path="/skillmap/:goalId" element={<SkillMapPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Catch-all inside app */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
