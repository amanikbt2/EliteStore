import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder login logic
    navigate('/admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-surface-dark p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-800">
        <h1 className="text-3xl font-bold text-center mb-8 text-primary">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-background-darker border border-gray-700 rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background-darker border border-gray-700 rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              required
            />
          </div>
          <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-semibold transition-colors mt-4">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
