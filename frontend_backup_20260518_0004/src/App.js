import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LandingPage from './pages/LandingPage';
import ParentDashboard from './pages/ParentDashboard';
import ExamList from './pages/ExamList';
import ExamSimulator from './pages/ExamSimulator';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Recommendations from './pages/Recommendations';
import TeacherPanel from './pages/TeacherPanel';
import QuestionManager from './pages/QuestionManager';
import ExamResult from './pages/ExamResult';
import Profile from './pages/Profile';
import StudentDetail from './pages/StudentDetail';
import Courses from './pages/Courses';
import LessonViewer from './pages/LessonViewer';
import SmartExam from './pages/SmartExam';
import SmartExamResult from './pages/SmartExamResult';
import TodayReview from './pages/TodayReview';
import CourseManager from './pages/CourseManager';
import TeacherList from './pages/TeacherList';
import TeacherProfile from './pages/TeacherProfile';

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/courses" element={<PrivateRoute><Courses /></PrivateRoute>} />
          <Route path="/lesson/:topicId" element={<PrivateRoute><LessonViewer /></PrivateRoute>} />
          <Route path="/smart-exam/:topicId" element={<PrivateRoute><SmartExam /></PrivateRoute>} />
          <Route path="/smart-exam-result" element={<PrivateRoute><SmartExamResult /></PrivateRoute>} />
          <Route path="/today-review" element={<PrivateRoute><TodayReview /></PrivateRoute>} />
          <Route path="/course-manager" element={<PrivateRoute requiredRole="ROLE_TEACHER"><CourseManager /></PrivateRoute>} />
          <Route path="/teachers" element={<PrivateRoute><TeacherList /></PrivateRoute>} />
          <Route path="/teachers/:id" element={<PrivateRoute><TeacherProfile /></PrivateRoute>} />
          <Route path="/exam" element={<Navigate to="/courses" replace />} />
          <Route path="/exam-result" element={<PrivateRoute><ExamResult /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
          <Route path="/recommendations" element={<PrivateRoute><Recommendations /></PrivateRoute>} />
          <Route path="/teacher" element={<PrivateRoute requiredRole="ROLE_TEACHER"><TeacherPanel /></PrivateRoute>} />
          <Route path="/questions" element={<PrivateRoute requiredRole="ROLE_TEACHER"><QuestionManager /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/student/:userId" element={<PrivateRoute requiredRole="ROLE_TEACHER"><StudentDetail /></PrivateRoute>} />
          <Route path="/parent-dashboard" element={<PrivateRoute><ParentDashboard /></PrivateRoute>} />
          <Route path="/practice-exams" element={<PrivateRoute><ExamList /></PrivateRoute>} />
          <Route path="/practice-exam/:examId" element={<PrivateRoute><ExamSimulator /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
