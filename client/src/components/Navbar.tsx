import { Link } from 'react-router-dom';
import { Search, Menu, Bell, BellOff } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 w-full bg-background-darker/90 backdrop-blur-md z-50 border-b border-surface-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2">
              <img src="/logo.png" alt="EliteStore Logo" className="w-8 h-8 rounded-md" />
              EliteStore
            </Link>
          </div>
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <input 
              type="text" 
              placeholder="Search apps..." 
              className="w-full bg-surface-dark text-text-dark border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary"
            />
            <Search className="absolute left-3 top-2.5 text-text-muted h-5 w-5" />
          </div>
          <div className="flex items-center gap-4 text-text-muted">
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`transition-colors p-2 rounded-full hover:bg-surface-dark ${showNotifications ? 'text-primary bg-surface-dark' : 'hover:text-text-dark'}`}
              >
                <Bell className="h-6 w-6" />
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-surface-dark border border-gray-700/50 rounded-2xl shadow-2xl py-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 pb-3 border-b border-gray-700/50 mb-3 flex items-center justify-between">
                    <h3 className="font-bold text-text">Notifications</h3>
                  </div>
                  <div className="px-4 py-8 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-gray-800/50 rounded-full flex items-center justify-center mb-3">
                      <BellOff className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="text-text font-medium">No new notifications</p>
                    <p className="text-text-muted text-sm mt-1">You're all caught up!</p>
                  </div>
                </div>
              )}
            </div>
            <button className="md:hidden p-2 rounded-full hover:bg-surface-dark hover:text-text-dark transition-colors"><Search className="h-6 w-6" /></button>
            <button className="md:hidden hover:text-text-dark transition-colors"><Menu className="h-6 w-6" /></button>
          </div>
        </div>
      </div>
    </nav>
  );
}
