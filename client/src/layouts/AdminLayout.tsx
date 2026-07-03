import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function AdminLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-surface-dark flex flex-col">
      <header className="bg-background-darker p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="EliteStore Logo" className="w-8 h-8 rounded-md" />
          <h1 className="text-xl font-bold text-primary">EliteStore Admin</h1>
        </div>
        <button 
          onClick={handleLogout}
          className="text-sm font-medium text-gray-400 hover:text-red-400 transition-colors"
        >
          Logout
        </button>
      </header>
      <main className="flex-grow p-6">
        <Outlet />
      </main>
    </div>
  );
}
