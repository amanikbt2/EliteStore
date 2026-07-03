import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['apps'],
    queryFn: async () => {
      const res = await fetch('http://127.0.0.1:5000/api/apps');
      if (!res.ok) throw new Error('Failed to fetch apps');
      return res.json();
    }
  });

  const apps = data?.data?.apps || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="mb-12">
        <div className="bg-gradient-to-r from-primary-dark to-primary rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between text-white shadow-xl shadow-primary/20">
          <div>
            <h1 className="text-4xl font-bold mb-4">Discover the Best Apps</h1>
            <p className="text-lg opacity-90 max-w-md">Premium apps for your Android device, carefully curated for excellence.</p>
          </div>
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-6">Featured Apps</h2>
        {isLoading && <p>Loading apps...</p>}
        {error && <p className="text-red-500">Error loading apps.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {apps.map((app: any) => (
            <Link to={`/app/${app.packageName}`} key={app.packageName} className="block bg-surface-dark p-4 rounded-xl hover:ring-2 hover:ring-primary transition-all cursor-pointer shadow-lg shadow-black/5">
              <div className="flex gap-4 items-center">
                <img src={app.iconUrl} alt={app.name} className="w-16 h-16 bg-gray-200 rounded-2xl object-cover" />
                <div>
                  <h3 className="font-semibold text-text-dark">{app.name}</h3>
                  <p className="text-sm text-text-muted">{app.developer}</p>
                  <div className="flex gap-1 text-green-500 text-xs mt-1">★ {app.rating}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
