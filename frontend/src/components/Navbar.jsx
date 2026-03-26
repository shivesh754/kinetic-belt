import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LineChart, Home, LayoutDashboard, TrendingUp, Info, LogIn, LogOut, User, Menu, X, Search, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CommandPalette from './CommandPalette';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navLinks = [
    { name: 'Home', path: '/', icon: <Home className="w-4 h-4" /> },
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Portfolio', path: '/portfolio', icon: <Briefcase className="w-4 h-4" /> },
    { name: 'Predict', path: '/predict', icon: <TrendingUp className="w-4 h-4" /> },
    { name: 'About', path: '/about', icon: <Info className="w-4 h-4" /> },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="fixed w-full top-0 z-50 bg-dark-navy/80 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <LineChart className="h-8 w-8 text-accent-green" />
            <span className="font-bold text-xl tracking-wide">
              Stock<span className="text-accent-green">Sight</span>
            </span>
          </div>

          {/* Desktop Search Trigger */}
          <div className="hidden md:flex flex-1 max-w-sm mx-10">
            <button 
              onClick={() => setIsPaletteOpen(true)}
              className="w-full flex items-center justify-between px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 group-hover:text-accent-green transition-colors" />
                <span className="text-sm">Search stocks...</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                <span className="opacity-60">Ctrl</span>
                <span className="opacity-60">K</span>
              </div>
            </button>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all ${
                      isActive
                        ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {link.icon}
                  {link.name}
                </NavLink>
              ))}
            </div>

            {/* Auth Section */}
            <div className="ml-6 flex items-center">
              {user ? (
                /* User Avatar & Dropdown */
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 
                      hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-green to-emerald-600 
                      flex items-center justify-center text-sm font-bold text-white shadow-md shadow-accent-green/20">
                      {user.avatar}
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors max-w-[100px] truncate">
                      {user.name}
                    </span>
                    <svg 
                      className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} 
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-dark-card/95 backdrop-blur-xl border border-white/10 
                      shadow-2xl shadow-black/40 py-1.5 animate-fade-in overflow-hidden">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      {/* Menu items */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            navigate('/dashboard');
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white 
                            flex items-center gap-2.5 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          My Dashboard
                        </button>
                      </div>
                      <div className="border-t border-white/5 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 
                            flex items-center gap-2.5 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Sign In Button */
                <NavLink
                  to="/auth"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-green hover:bg-accent-green-hover 
                    text-white font-medium text-sm transition-all duration-300 hover:scale-[1.02] 
                    shadow-md shadow-accent-green/20 hover:shadow-accent-green/40"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </NavLink>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {user && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-green to-emerald-600 
                flex items-center justify-center text-sm font-bold text-white">
                {user.avatar}
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <CommandPalette isOpen={isPaletteOpen} onClose={setIsPaletteOpen} />

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        } bg-dark-navy/95 backdrop-blur-xl border-b border-white/5`}
      >
        <div className="px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {link.icon}
              {link.name}
            </NavLink>
          ))}

          <div className="border-t border-white/5 pt-2 mt-2">
            {user ? (
              <>
                <div className="px-4 py-2 text-xs text-gray-500">
                  Signed in as <span className="text-gray-400">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 
                    hover:bg-red-500/10 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <NavLink
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-accent-green hover:bg-accent-green-hover 
                  text-white font-medium transition-all"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
