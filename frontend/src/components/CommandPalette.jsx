import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, History, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import companiesData from '../data/companies.json';
import { useWatchlist } from '../context/WatchlistContext';

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { watchlist, isInWatchlist } = useWatchlist();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose(!isOpen);
      } else if (e.key === 'Escape') {
        onClose(false);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(watchlist.slice(0, 5).map(w => {
        const company = companiesData.find(c => c.symbol === w.symbol);
        return company || { symbol: w.symbol, name: 'Watchlist Stock', category: 'Watchlist' };
      }));
      return;
    }

    const filtered = companiesData
      .filter(c => 
        c.symbol.toLowerCase().includes(query.toLowerCase()) || 
        c.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 10);
    setResults(filtered);
  }, [query, watchlist]);

  const handleSelect = (symbol) => {
    navigate(`/predict?s=${symbol}`);
    onClose(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 md:px-0 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl bg-dark-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center px-4 py-4 border-b border-white/5 bg-white/5">
              <Search className="w-5 h-5 text-gray-500 mr-3" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stocks, indices, and companies... (Esc to close)"
                className="flex-1 bg-transparent border-none text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-0 text-lg"
              />
              <button 
                onClick={() => onClose(false)}
                className="p-1 px-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors text-xs"
              >
                ESC
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                {query ? 'Search Results' : 'Recently Viewed / Favorites'}
              </div>
              
              <div className="grid gap-1">
                {results.length > 0 ? (
                  results.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelect(stock.symbol)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all duration-200 group border border-transparent hover:border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-accent-green/10 flex items-center justify-center text-accent-green font-bold text-xs ring-1 ring-accent-green/20">
                          {stock.symbol.slice(0, 3)}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-200 text-sm group-hover:text-accent-green transition-colors">
                            {stock.symbol}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-[300px]">
                            {stock.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isInWatchlist(stock.symbol) && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500 flex items-center gap-1">
                          Jump to <TrendingUp className="w-3 h-3" />
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <History className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No stocks found matching "{query}"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
              <div className="flex gap-4">
                <span className="flex items-center gap-1 underline underline-offset-2">Select <TrendingUp className="w-2 h-2" /></span>
                <span className="flex items-center gap-1 underline underline-offset-2">Search companies</span>
              </div>
              <p>Powered by StockSight AI</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
