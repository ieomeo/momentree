import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import GlobalStyles from './styles/GlobalStyles';
import RequireAuth from './components/RequireAuth';
import LandingPage from './pages/LandingPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AuthSessionSync from './components/AuthSessionSync';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import FeedPage from './pages/FeedPage';
import WritePage from './pages/WritePage';
import PostDetailPage from './pages/PostDetailPage';
import GardenPage from './pages/GardenPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 0, refetchOnWindowFocus: false } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionSync />
      <BrowserRouter>
        <GlobalStyles />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/write" element={<WritePage />} />
            <Route path="/post/:id" element={<PostDetailPage />} />
            <Route path="/me" element={<GardenPage />} />
          </Route>
          <Route element={<RequireAuth admin />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <ToastContainer position="bottom-right" autoClose={3000} theme="light" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
