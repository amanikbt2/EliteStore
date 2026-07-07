import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Download, LayoutGrid, X, ChevronLeft, ChevronRight, Loader2, Send, User, Copy, Check } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

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

const ReviewComment = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 150;
  
  return (
    <p className="text-text-muted text-sm whitespace-pre-wrap">
      {expanded || !isLong ? text : `${text.substring(0, 150)}...`}
      {isLong && (
        <button onClick={() => setExpanded(!expanded)} className="text-primary hover:underline ml-2 font-medium">
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </p>
  );
};

export default function AppDetailsPage() {
  const { packageName } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['app', packageName],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/apps/${packageName}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      // 410 = admin disabled downloads; still return full app data
      if (res.status === 410) return res.json();
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [installState, setInstallState] = useState<'idle' | 'downloading' | 'installing' | 'installed'>('idle');
  const [downloadPercent, setDownloadPercent] = useState<number>(0);

  const handleInstallClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!latestVersion?.apkUrl) return;

    if (installState === 'installed') {
      window.location.href = `intent://launch#Intent;scheme=android-app;package=${packageName};end`;
      return;
    }

    if (installState !== 'idle') return;

    setInstallState('downloading');
    setDownloadPercent(0);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
    const downloadProxyUrl = `${apiUrl}/api/apps/${packageName}/download-file`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', downloadProxyUrl, true);
    xhr.responseType = 'blob';
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = xhr.response;
        const blobUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${appName}.apk`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setInstallState('installing');
        setTimeout(() => {
          setInstallState('installed');
        }, 8000);
      } else {
        window.location.href = downloadProxyUrl;
        setInstallState('installing');
        setTimeout(() => {
          setInstallState('installed');
        }, 8000);
      }
    };

    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setDownloadPercent(percent);
      }
    };

    xhr.onerror = () => {
      window.location.href = downloadProxyUrl;
      setInstallState('installing');
      setTimeout(() => {
        setInstallState('installed');
      }, 8000);
    };

    xhr.send();

    trackEvent('install_app');
    fetch(`${apiUrl}/api/apps/${packageName}/download`, { method: 'POST' }).catch(() => {});
  };



  const trackEvent = useCallback(async (action: string, metadata: any = {}) => {
    if (!packageName) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      await fetch(`${apiUrl}/api/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          packageName,
          metadata: {
            ...metadata,
            referrer: document.referrer || 'Direct'
          }
        })
      });
    } catch {
      // Ignore tracking errors
    }
  }, [packageName]);

  useEffect(() => {
    trackEvent('view_app');
  }, [trackEvent]);

  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['reviews', packageName],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const res = await fetch(`${apiUrl}/api/apps/${packageName}/reviews`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    },
    enabled: !!packageName
  });

  const reviews = reviewsData?.data?.reviews || [];

  const [reviewForm, setReviewForm] = useState({ username: '', stars: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const submitReview = useMutation({
    mutationFn: async (newReview: any) => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const res = await fetch(`${apiUrl}/api/apps/${packageName}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      });
      if (!res.ok) throw new Error('Failed to submit review');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', packageName] });
      queryClient.invalidateQueries({ queryKey: ['app', packageName] });
      setReviewForm({ username: '', stars: 5, comment: '' });
      setIsSubmittingReview(false);
    }
  });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) return;
    setIsSubmittingReview(true);
    trackEvent('submit_review', { rating: reviewForm.stars });
    submitReview.mutate(reviewForm);
  };

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

  if (isLoading || isRefetching) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <h2 className="text-xl font-semibold text-text">Loading app details...</h2>
        <p className="text-text-muted">Please wait while we fetch the latest information</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-8 max-w-md w-full text-center flex flex-col items-center">
          <h2 className="text-xl font-bold text-red-500 mb-3">Network Error</h2>
          <p className="text-red-400/80 mb-6">We couldn't load the app details. Please check your connection and try again.</p>
          <button 
            onClick={() => refetch()}
            disabled={isRefetching}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold transition-all disabled:opacity-50"
          >
            {isRefetching ? 'Retrying...' : 'Reload App'}
          </button>
        </div>
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
            <div className="flex items-center gap-3 mt-1">
              <p className="text-primary text-sm sm:text-base font-semibold truncate">{app?.developer || 'Developer'}</p>
              <button 
                onClick={() => {
                  trackEvent('copy_link');
                  const url = window.location.href;
                  navigator.clipboard.writeText(url);
                  setCopiedLink(true);
                  toast.success('App link copied!');
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="flex items-center gap-1.5 px-2 py-1 bg-surface-dark border border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-text rounded-md transition-all text-xs cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
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
          {app?.downloadEnabled === false ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-full bg-gray-700/40 text-gray-500 px-10 py-3 rounded-full font-bold text-base flex items-center justify-center cursor-not-allowed select-none opacity-60"
                aria-disabled="true"
              >
                Install
              </div>
              <p className="text-red-400 text-sm font-medium text-center animate-pulse">
                You cannot install the app at the moment.{' '}
                <a
                  href="mailto:support@elitehub.app"
                  className="underline underline-offset-2 hover:text-red-300 transition-colors"
                >
                  Sign up for more info
                </a>
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 w-full">
              <button 
                onClick={handleInstallClick}
                disabled={installState === 'downloading'}
                className={`w-full text-white px-10 py-3 rounded-full font-bold text-base transition-all shadow-lg active:scale-[0.98] flex items-center justify-center cursor-pointer ${
                  installState === 'downloading'
                    ? 'bg-primary-dark/80 cursor-wait'
                    : installState === 'installing'
                    ? 'bg-yellow-600 hover:bg-yellow-700 shadow-yellow-500/20'
                    : installState === 'installed'
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20'
                    : 'bg-primary hover:bg-blue-600 hover:shadow-primary/30'
                }`}
              >
                {installState === 'idle' && 'Install'}
                {installState === 'downloading' && `Downloading (${downloadPercent}%)...`}
                {installState === 'installing' && 'Installing...'}
                {installState === 'installed' && 'Open App'}
              </button>
              {installState === 'installing' && (
                <p className="text-yellow-400 text-xs font-medium text-center animate-pulse mt-1">
                  Please open the downloaded APK file from your notifications/downloads folder to complete installation.
                </p>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Screenshots Section */}
      {(app?.screenshots && app.screenshots.length > 0) ? (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text">Preview</h2>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {app.screenshots.map((url: string, index: number) => (
              <div 
                key={index}
                onClick={() => setFullscreenIndex(index)}
                className="w-44 h-72 sm:w-64 sm:h-[400px] shrink-0 snap-center shadow-lg rounded-2xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              >
                <img src={url} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text">Preview</h2>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {[0, 1, 2, 3, 4].map((index) => (
              <div 
                key={index}
                className="w-44 h-72 sm:w-64 sm:h-[400px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shrink-0 snap-center shadow-lg border border-gray-700/50 relative overflow-hidden"
              >
                <div className="absolute top-4 left-4 right-4 h-6 bg-gray-700/50 rounded-full"></div>
                <div className="absolute top-14 left-4 right-4 bottom-4 bg-gray-700/30 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* About Section */}
      <div className="mt-8 bg-surface-dark p-6 rounded-3xl shadow-xl border border-gray-100/5 mb-10">
        <h2 className="text-xl font-bold text-text mb-4">About this app</h2>
        <p className="text-text-muted leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
          {app?.description || 'Experience the ultimate app tailored just for you. This application brings you unparalleled features, a sleek design, and top-tier performance to enhance your daily life. Explore new possibilities today!'}
        </p>
      </div>

      {/* Reviews Section */}
      <div className="mt-8 bg-surface-dark p-6 rounded-3xl shadow-xl border border-gray-100/5 mb-10">
        <h2 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
          Ratings and reviews
        </h2>

        {/* Review Form */}
        <form onSubmit={handleReviewSubmit} className="mb-8 bg-background-dark p-5 rounded-2xl border border-border shadow-sm">
          <h3 className="text-base font-semibold text-text-dark mb-4">Rate this app</h3>
          
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setReviewForm({ ...reviewForm, stars: star })}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star 
                  strokeWidth={2}
                  className={`w-8 h-8 ${star <= reviewForm.stars ? 'fill-yellow-400 text-yellow-400' : 'fill-white text-yellow-400'}`} 
                />
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={reviewForm.username}
              onChange={(e) => setReviewForm({ ...reviewForm, username: e.target.value })}
              className="w-full bg-background-darker border border-border rounded-xl px-4 py-3 text-text-dark placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
            />
            <textarea
              placeholder="Describe your experience (optional)"
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              rows={3}
              className="w-full bg-background-darker border border-border rounded-xl px-4 py-3 text-text-dark placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none shadow-inner"
            ></textarea>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingReview || !reviewForm.comment.trim()}
                className="bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
              >
                {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Post
              </button>
            </div>
          </div>
        </form>

        {/* Reviews List */}
        {isLoadingReviews ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review: any) => (
              <div key={review._id} className="border-b border-gray-700/50 pb-6 last:border-0 last:pb-0">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-text-dark">{review.username}</h4>
                      <span className="text-xs text-text-muted">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center mt-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          strokeWidth={2}
                          className={`w-3.5 h-3.5 ${star <= review.stars ? 'fill-yellow-400 text-yellow-400' : 'fill-white text-yellow-400'}`} 
                        />
                      ))}
                    </div>
                    <ReviewComment text={review.comment} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No reviews yet. Be the first to review this app!
          </div>
        )}
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
              {(app?.screenshots && app.screenshots.length > 0) ? (
                app.screenshots.map((url: string, index: number) => (
                  <div 
                    key={index} 
                    className="w-full h-[70vh] sm:h-[80vh] shrink-0 snap-center flex justify-center items-center p-6"
                  >
                    <div className="w-full max-w-[320px] sm:max-w-md h-full shadow-2xl rounded-3xl overflow-hidden bg-black/50">
                      <img src={url} alt={`Screenshot ${index + 1}`} className="w-full h-full object-contain" />
                    </div>
                  </div>
                ))
              ) : (
                [0, 1, 2, 3, 4].map((index) => (
                  <div 
                    key={index} 
                    className="w-full h-[70vh] sm:h-[80vh] shrink-0 snap-center flex justify-center items-center p-6"
                  >
                    <div className="w-full max-w-[320px] sm:max-w-md h-full bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700/50 relative overflow-hidden">
                      <div className="absolute top-6 left-6 right-6 h-8 bg-gray-700/50 rounded-full"></div>
                      <div className="absolute top-20 left-6 right-6 bottom-6 bg-gray-700/30 rounded-2xl"></div>
                    </div>
                  </div>
                ))
              )}
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
