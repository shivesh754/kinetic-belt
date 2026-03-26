import { Star, TrendingUp, TrendingDown, X } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import { motion, AnimatePresence } from 'framer-motion';

const WatchlistSidebar = ({ onSelect }) => {
  const { watchlist, removeFromWatchlist, isLoading } = useWatchlist();

  return (
    <div className="glass-panel flex flex-col h-full !bg-dark-card/30 border-white/5">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <h3 className="font-bold flex items-center gap-2 text-sm text-gray-300">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
          My Watchlist
        </h3>
        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-gray-400">
          {watchlist.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-5 h-5 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : watchlist.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs">Your watchlist is empty. Search for symbols to add them.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {watchlist.map((item) => (
              <motion.div
                key={item.symbol}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="group relative"
              >
                <button
                  onClick={() => onSelect(item.symbol)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-accent-green/30 transition-all duration-300 pr-10 text-left"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-200 text-sm group-hover:text-accent-green transition-colors">
                      {item.symbol}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Quick Track</span>
                  </div>
                  <TrendingUp className="w-4 h-4 text-accent-green opacity-40" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWatchlist(item.symbol);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove from watchlist"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="p-3 border-t border-white/5 bg-white/[0.02]">
        <p className="text-[10px] text-gray-600 text-center italic">
          Click a symbol to load historical data
        </p>
      </div>
    </div>
  );
};

export default WatchlistSidebar;
