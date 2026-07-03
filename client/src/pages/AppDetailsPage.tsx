import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Download, LayoutGrid, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

function formatAppName(packageName: string | undefined) {
  if (!packageName) return 'App Name';
  const parts = packageName.split('.');
  const namePart = parts.length > 1 ? parts[parts.length - 2] : parts[0];
  const formatted = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  if (parts.length > 2 && parts[parts.length - 1] === 'app') {
    return `${formatted} App`;
  }
  return formatted;
}

export default function AppDetailsPage() {
  const { packageName } = useParams();
  const navigate = useNavigate();
  
  const { data, isLoading } = useQuery({
    queryKey: ['app', packageName],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const res = await fetch(`${apiUrl}/api/apps/${packageName}`);
      if (!res.ok) throw new Error('Failed to fetch app');
      return res.json();
    },
    enabled: !!packageName
  });
  
  const appResponse = data?.data;
  const app = appResponse?.app;
  const latestVersion = appResponse?.latestVersion;
  const appName = app?.name || formatAppName(packageName);
  
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    }
  }, []);

  useEffect(() => {
    if (fullscreenIndex !== null && scrollRef.current) {
      // Small timeout to allow modal to render before scrolling
      setTimeout(() => {
        if (scrollRef.current) {
          const child = scrollRef.current.children[fullscreenIndex] as HTMLElement;
          if (child) {
            scrollRef.current.scrollTo({ left: child.offsetLeft, behavior: 'instant' });
            checkScroll();
          }
        }
      }, 50);
    }
  }, [fullscreenIndex, checkScroll]);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <h2 className="text-xl font-semibold text-text">Loading app details...</h2>
        <p className="text-text-muted">Please wait while we fetch the latest information</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Top Bar with Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="mb-6 p-2 rounded-full hover:bg-surface-dark transition-colors flex items-center justify-center text-text"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Main App Header */}
      <div className="bg-surface-dark p-6 rounded-3xl shadow-xl border border-gray-100/5">
        <div className="flex flex-row gap-5 items-center">
          {/* App Icon */}
          <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-tr from-primary via-blue-500 to-accent rounded-3xl shadow-lg shrink-0 flex items-center justify-center relative overflow-hidden group">
            {app?.iconUrl ? (
              <img src={app.iconUrl} alt="App Icon" className="w-full h-full object-cover" />
            ) : (
              <>
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <LayoutGrid className="w-10 h-10 sm:w-14 sm:h-14 text-white opacity-90" />
              </>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-text truncate">{appName}</h1>
            <p className="text-primary mt-1 text-sm sm:text-base font-semibold truncate">{app?.developer || 'Developer'}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-12 mt-8 pb-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center font-bold text-lg sm:text-xl text-text">
              {app?.rating || '4.8'} <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 fill-text text-text" />
            </div>
            <div className="text-[10px] sm:text-xs text-text-muted mt-1">Rating</div>
          </div>
          <div className="w-px h-8 bg-gray-700/50"></div>
          <div className="flex flex-col items-center">
            <div className="flex items-center font-bold text-lg sm:text-xl text-text">
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-1" /> {app?.downloads || '0'}
            </div>
            <div className="text-[10px] sm:text-xs text-text-muted mt-1">Downloads</div>
          </div>
          <div className="w-px h-8 bg-gray-700/50"></div>
          <div className="flex flex-col items-center">
            <div className="flex items-center font-bold text-lg sm:text-xl text-text">
              {latestVersion?.fileSize ? (latestVersion.fileSize / (1024 * 1024)).toFixed(1) + ' MB' : 'N/A'}
            </div>
            <div className="text-[10px] sm:text-xs text-text-muted mt-1">Size</div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <a 
            href={latestVersion?.apkUrl || '#'}
            download
            className="w-full bg-primary hover:bg-blue-600 text-white px-10 py-3 rounded-full font-bold text-base transition-all shadow-lg hover:shadow-primary/30 active:scale-[0.98] flex items-center justify-center cursor-pointer"
          >
            Install
          </a>
        </div>
      </div>

      {/* Screenshots Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text">Preview</h2>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {[0, 1, 2, 3, 4].map((index) => (
            <div 
              key={index}
              onClick={() => setFullscreenIndex(index)}
              className="w-44 h-72 sm:w-64 sm:h-[400px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shrink-0 snap-center shadow-lg border border-gray-700/50 relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            >
              <div className="absolute top-4 left-4 right-4 h-6 bg-gray-700/50 rounded-full"></div>
              <div className="absolute top-14 left-4 right-4 bottom-4 bg-gray-700/30 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* About Section */}
      <div className="mt-8 bg-surface-dark p-6 rounded-3xl shadow-xl border border-gray-100/5 mb-10">
        <h2 className="text-xl font-bold text-text mb-4">About this app</h2>
        <p className="text-text-muted leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
          {app?.description || 'Experience the ultimate app tailored just for you. This application brings you unparalleled features, a sleek design, and top-tier performance to enhance your daily life. Explore new possibilities today!'}
        </p>
      </div>

      {/* Fullscreen Preview Modal */}
      {fullscreenIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-in fade-in duration-200">
          <div className="p-4 flex justify-end">
            <button 
              onClick={() => setFullscreenIndex(null)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 relative flex items-center justify-center">
            {/* Left Navigation Arrow */}
            {canScrollLeft && (
              <button 
                onClick={() => {
                  if (scrollRef.current) {
                    scrollRef.current.scrollBy({ left: -window.innerWidth, behavior: 'smooth' });
                  }
                }}
                className="absolute left-4 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-sm flex items-center justify-center shadow-xl"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            <div 
              ref={scrollRef}
              onScroll={checkScroll}
              className="w-full flex overflow-x-auto snap-x snap-mandatory items-center pb-8 h-full" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {[0, 1, 2, 3, 4].map((index) => (
                <div 
                  key={index} 
                  className="w-full h-[70vh] sm:h-[80vh] shrink-0 snap-center flex justify-center items-center p-6"
                >
                  <div className="w-full max-w-[320px] sm:max-w-md h-full bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700/50 relative overflow-hidden">
                    <div className="absolute top-6 left-6 right-6 h-8 bg-gray-700/50 rounded-full"></div>
                    <div className="absolute top-20 left-6 right-6 bottom-6 bg-gray-700/30 rounded-2xl"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Navigation Arrow */}
            {canScrollRight && (
              <button 
                onClick={() => {
                  if (scrollRef.current) {
                    scrollRef.current.scrollBy({ left: window.innerWidth, behavior: 'smooth' });
                  }
                }}
                className="absolute right-4 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-sm flex items-center justify-center shadow-xl"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
