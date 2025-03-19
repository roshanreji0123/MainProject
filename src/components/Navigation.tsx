import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, User, FileText, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface NavigationProps {
  children: React.ReactNode;
  activeSection: 'notes' | 'profile';
  onSectionChange: (section: 'notes' | 'profile') => void;
}

export function Navigation({ children, activeSection, onSectionChange }: NavigationProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, setUser } = useUser();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="hidden sm:flex flex-col w-64 bg-white dark:bg-gray-900 shadow-lg">
        {/* Logo section */}
        <div className="p-6">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-[#FF7A59] to-[#FF9B7B] p-2 rounded-lg hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md group">
              <svg className="w-6 h-6 text-white transform group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-[#FF7A59] via-[#FF9B7B] to-[#FF7A59] bg-clip-text text-transparent tracking-tight hover:scale-105 transition-all duration-200">OneNote</span>
          </Link>
        </div>

        {/* Navigation links */}
        <div className="flex-1 px-4 py-2">
          <button
            onClick={() => onSectionChange('notes')}
            className={cn(
              "flex items-center w-full text-gray-700 dark:text-gray-300 hover:text-[#FF7A59] px-3 py-2 rounded-md text-sm font-medium",
              activeSection === 'notes' && "bg-[#FF7A59]/10 text-[#FF7A59]"
            )}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Notes
          </button>
          <button
            onClick={() => onSectionChange('profile')}
            className={cn(
              "flex items-center w-full text-gray-700 dark:text-gray-300 hover:text-[#FF7A59] px-3 py-2 rounded-md text-sm font-medium mt-2",
              activeSection === 'profile' && "bg-[#FF7A59]/10 text-[#FF7A59]"
            )}
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </button>
        </div>

        {/* User info and theme toggle at bottom */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center text-gray-700 dark:text-gray-300 text-sm">
              <User className="h-4 w-4 mr-2" />
              <span>{user?.name}</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 pl-6">
              {user?.email}
            </div>
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-[#FF7A59] px-3 py-2 rounded-md text-sm font-medium"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-[#FF7A59] rounded-md transition-colors"
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top navigation for mobile */}
        <nav className="bg-white dark:bg-gray-900 shadow-lg sm:hidden">
          <div className="px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-[#FF7A59] focus:outline-none"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-[#FF7A59] rounded-md transition-colors"
              >
                {theme === 'light' ? (
                  <Moon className="h-6 w-6" />
                ) : (
                  <Sun className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="sm:hidden">
              <div className="pt-2 pb-3 space-y-1">
                <button
                  onClick={() => {
                    onSectionChange('notes');
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left flex items-center px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-[#FF7A59]",
                    activeSection === 'notes' && "bg-[#FF7A59]/10 text-[#FF7A59]"
                  )}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Notes
                </button>
                <button
                  onClick={() => {
                    onSectionChange('profile');
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left flex items-center px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-[#FF7A59]",
                    activeSection === 'profile' && "bg-[#FF7A59]/10 text-[#FF7A59]"
                  )}
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </button>
                <div className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300">
                  <User className="h-4 w-4 inline mr-2" />
                  {user?.name}
                </div>
                <div className="block px-3 py-2 text-xs text-gray-500 dark:text-gray-400 pl-8">
                  {user?.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-[#FF7A59]"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-800">
          {children}
        </main>
      </div>
    </div>
  );
}