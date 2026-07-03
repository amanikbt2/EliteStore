import { Link } from 'react-router-dom';
import { Search, Menu, Bell } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-background-darker/90 backdrop-blur-md z-50 border-b border-surface-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2">
              <span className="bg-primary text-white p-1 rounded-md text-sm">E</span>
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
            <button className="hover:text-text-dark transition-colors"><Bell className="h-6 w-6" /></button>
            <button className="md:hidden hover:text-text-dark transition-colors"><Search className="h-6 w-6" /></button>
            <button className="md:hidden hover:text-text-dark transition-colors"><Menu className="h-6 w-6" /></button>
          </div>
        </div>
      </div>
    </nav>
  );
}
