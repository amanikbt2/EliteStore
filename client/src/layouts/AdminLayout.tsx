import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-surface-dark flex flex-col">
      <header className="bg-background-darker p-4 shadow-md">
        <h1 className="text-xl font-bold text-primary">EliteStore Admin</h1>
      </header>
      <main className="flex-grow p-6">
        <Outlet />
      </main>
    </div>
  );
}
