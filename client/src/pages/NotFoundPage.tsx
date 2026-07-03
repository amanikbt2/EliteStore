import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-text-muted mb-8">The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-full font-semibold transition-colors">
        Go Home
      </Link>
    </div>
  );
}
