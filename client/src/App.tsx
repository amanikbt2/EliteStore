import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import AppDetailsPage from './pages/AppDetailsPage';
import SearchPage from './pages/SearchPage';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import NotFoundPage from './pages/NotFoundPage';
import { useTheme } from './hooks/useTheme';

const queryClient = new QueryClient();

function App() {
  useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="app/:packageName" element={<AppDetailsPage />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            {/* Other admin routes */}
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}

export default App;
