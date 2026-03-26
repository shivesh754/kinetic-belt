import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { stockService } from '../services/api';
import { useAuth } from './AuthContext';

const WatchlistContext = createContext(null);

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};

export const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchWatchlist = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await stockService.getWatchlist();
      setWatchlist(data);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const addToWatchlist = async (symbol) => {
    try {
      const data = await stockService.addToWatchlist(symbol);
      setWatchlist((prev) => [...prev.filter(item => item.symbol !== symbol), data]);
      return true;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      return false;
    }
  };

  const removeFromWatchlist = async (symbol) => {
    try {
      await stockService.removeFromWatchlist(symbol);
      setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));
      return true;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      return false;
    }
  };

  const isInWatchlist = (symbol) => {
    return watchlist.some((item) => item.symbol === symbol.toUpperCase());
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        isLoading,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        refreshWatchlist: fetchWatchlist
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export default WatchlistContext;
