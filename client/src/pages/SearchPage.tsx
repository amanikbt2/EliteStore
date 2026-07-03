import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['apps', query],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const url = query ? `${apiUrl}/api/apps?search=${encodeURIComponent(query)}` : `${apiUrl}/api/apps`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch apps');
      return res.json();
    },
    enabled: true
  });

  const apps = data?.data?.apps || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
      <h1 className="text-2xl font-bold mb-2">Search Results</h1>
      <p className="text-text-muted mb-6">
        {query ? `Showing results for "${query}"` : 'Type in the search bar to find apps.'}
      </p>

      {isLoading && <p>Loading apps...</p>}
      {error && <p className="text-red-500">Error loading search results.</p>}

      {!isLoading && !error && apps.length === 0 && (
        <div className="text-center py-12 bg-surface-dark rounded-xl border border-gray-100/5">
          <p className="text-lg text-text-muted">No apps found matching your search.</p>
        </div>
      )}

      {!isLoading && !error && apps.length > 0 && (
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
      )}
    </div>
  );
}
