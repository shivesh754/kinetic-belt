import { useState, useEffect } from 'react';
import { format, subYears } from 'date-fns';
import { DollarSign, TrendingUp, TrendingDown, Activity, RefreshCw, Search, Heart, Star, ChevronRight } from 'lucide-react';
import { stockService } from '../services/api';
import StockChart from '../components/StockChart';
import MetricsCard from '../components/MetricsCard';
import DateRangePicker from '../components/DateRangePicker';
import LoadingSpinner from '../components/LoadingSpinner';
import WatchlistSidebar from '../components/WatchlistSidebar';
import { useWatchlist } from '../context/WatchlistContext';
import companiesData from '../data/companies.json';
import { motion, AnimatePresence } from 'framer-motion';

const POPULAR_STOCKS = companiesData.slice(0, 1000);

const Dashboard = () => {
  const [symbol, setSymbol] = useState(POPULAR_STOCKS[0]?.symbol || 'AAPL');
  const [displayName, setDisplayName] = useState(`${POPULAR_STOCKS[0]?.name} (${POPULAR_STOCKS[0]?.symbol})` || 'Apple Inc. (AAPL)');
  
  // Default to 1 year back
  const today = new Date();
  const defaultStart = format(subYears(today, 1), 'yyyy-MM-dd');
  const defaultEnd = format(today, 'yyyy-MM-dd');

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);

  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await stockService.getHistoricalData(symbol, startDate, endDate);
      setData(result);
      calculateStats(result);
    } catch (err) {
      setError('Failed to fetch historical data. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      fetchData();
      try {
        const info = await stockService.getStockInfo(symbol);
        setStockInfo(info);
      } catch (err) {
        console.error('Info fetch failed', err);
      }
    };
    fetchAll();
  }, [symbol, startDate, endDate]);

  const calculateStats = (result) => {
    if (!result || !result.close || result.close.length === 0) return;

    const closes = result.close;
    const highs = result.high;
    const lows = result.low;
    const volumes = result.volume;
    
    const currentPrice = closes[closes.length - 1];
    const prevPrice = closes.length > 1 ? closes[closes.length - 2] : currentPrice;
    
    // Last 7 days slice
    const sevenDaysHigh = Math.max(...highs.slice(-7));
    const sevenDaysLow = Math.min(...lows.slice(-7));
    const avgVol = volumes.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, volumes.length);

    const priceChange = ((currentPrice - prevPrice) / prevPrice) * 100;

    setStats({
      currentPrice,
      priceChange,
      sevenDaysHigh,
      sevenDaysLow,
      avgVol
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Market Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Real-time historical data and insights</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <input
              type="text"
              list="dash-companies"
              value={displayName}
              onChange={(e) => {
                const val = e.target.value;
                setDisplayName(val);
                const found = companiesData.find(c => `${c.name} (${c.symbol})` === val || c.symbol === val);
                if (found) {
                  setSymbol(found.symbol);
                } else {
                  setSymbol(val.toUpperCase());
                }
              }}
              placeholder="Search symbol..."
              className="input-field pr-10"
            />
            <datalist id="dash-companies">
              {POPULAR_STOCKS.map(c => (
                <option key={c.symbol} value={`${c.name} (${c.symbol})`} />
              ))}
            </datalist>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
              <Search className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => isInWatchlist(symbol) ? removeFromWatchlist(symbol) : addToWatchlist(symbol)}
              className={`p-2.5 rounded-lg transition-all duration-300 border ${
                isInWatchlist(symbol) 
                  ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title={isInWatchlist(symbol) ? "Remove from watchlist" : "Add to watchlist"}
            >
              <Heart className={`w-5 h-5 ${isInWatchlist(symbol) ? 'fill-red-500' : ''}`} />
            </button>

            <button 
              onClick={fetchData} 
              className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/10"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className={`hidden lg:flex p-2.5 rounded-lg transition-all duration-300 border ${
                showSidebar 
                  ? 'bg-accent-green/10 border-accent-green/30 text-accent-green hover:bg-accent-green/20' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title={showSidebar ? "Hide Sidebar" : "Show Sidebar"}
            >
              <Star className={`w-5 h-5 ${showSidebar ? 'fill-accent-green' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel p-4 mb-8 flex flex-wrap gap-4 items-center !bg-dark-card/50">
        <DateRangePicker 
          startDate={startDate} 
          endDate={endDate} 
          onStartChange={setStartDate} 
          onEndChange={setEndDate} 
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricsCard 
          title="Current Price" 
          value={stats ? stats.currentPrice : '-.--'} 
          icon={<DollarSign className="w-5 h-5" />} 
          trend={stats ? Number(stats.priceChange.toFixed(2)) : undefined}
          highlight={true}
          suffix=" USD"
        />
        <MetricsCard 
          title="7-Day High" 
          value={stats ? stats.sevenDaysHigh : '-.--'} 
          icon={<TrendingUp className="w-5 h-5" />} 
        />
        <MetricsCard 
          title="7-Day Low" 
          value={stats ? stats.sevenDaysLow : '-.--'} 
          icon={<TrendingDown className="w-5 h-5" />} 
        />
        <MetricsCard 
          title="Avg Volume (7d)" 
          value={stats ? (stats.avgVol / 1000000).toFixed(2) : '-.--'} 
          icon={<Activity className="w-5 h-5" />} 
          suffix="M"
        />
      </div>

      {/* Main Content Grid */}
      <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
        {/* Main Chart Area */}
        <div className={`transition-all duration-500 ease-in-out ${showSidebar ? 'lg:w-[75%]' : 'w-full'} glass-panel p-6 relative h-full overflow-hidden`}>
          {loading ? (
            <LoadingSpinner message="Fetching market data from yfinance..." />
          ) : error ? (
            <div className="h-full flex items-center justify-center text-stock-down flex-col bg-red-500/5 rounded-xl border border-red-500/10">
              <TrendingDown className="w-8 h-8 mb-2 opacity-50" />
              <p>{error}</p>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-accent-green rounded-full" />
                  <h3 className="text-lg font-bold text-gray-200">Price Action - {symbol}</h3>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs bg-accent-green/10 text-accent-green px-2 py-1 rounded border border-accent-green/20">Live Historical</span>
                  <span className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded border border-white/10 font-mono italic">5y Period</span>
                </div>
              </div>
              <div className="flex-grow min-h-0">
                <StockChart data={data} />
              </div>
            </div>
          )}
        </div>

        {/* Info & Watchlist Sidebar Container */}
        <div className="flex flex-col gap-6 lg:w-[25%] h-full overflow-hidden">
          <AnimatePresence mode="wait">
            {showSidebar && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col gap-6 h-full"
              >
                {/* Fundamentals Card */}
                <div className="glass-panel p-4 flex flex-col gap-3 min-h-[220px]">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                    Fundamentals
                  </h3>
                  {stockInfo ? (
                    <div className="grid grid-cols-2 gap-y-3 pt-2">
                      <div>
                        <p className="text-[10px] text-gray-500">Market Cap</p>
                        <p className="text-sm font-semibold text-gray-200">
                          ${stockInfo.marketCap ? (stockInfo.marketCap / 1e12).toFixed(2) : '--'}T
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">P/E Ratio</p>
                        <p className="text-sm font-semibold text-gray-200">{stockInfo.peRatio !== undefined ? stockInfo.peRatio.toFixed(2) : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">Div. Yield</p>
                        <p className="text-sm font-semibold text-gray-200">{stockInfo.dividendYield !== undefined ? (stockInfo.dividendYield * 100).toFixed(2) : '0.00'}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">Sector</p>
                        <p className="text-sm font-semibold text-gray-200 truncate pr-2">{stockInfo.sector || 'N/A'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center opacity-20">
                      <p className="text-xs italic">Loading info...</p>
                    </div>
                  )}
                </div>

                {/* News Sentiment Section */}
                <div className="glass-panel p-4 flex flex-col gap-3 flex-1 overflow-hidden min-h-[300px]">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-accent-green" />
                    Recent News & Sentiment
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-3 mt-2 pr-1 custom-scrollbar">
                    {stockInfo?.news?.map((n, idx) => (
                      <a 
                        key={idx} 
                        href={n.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors line-clamp-2 leading-relaxed">
                            {n.title}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[9px] text-gray-500">{n.publisher}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                            idx % 3 === 0 ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                          }`}>
                            {idx % 3 === 0 ? 'Positive' : 'Neutral'}
                          </span>
                        </div>
                      </a>
                    ))}
                    {!stockInfo?.news?.length && (
                      <p className="text-[10px] text-gray-600 italic text-center py-10">No recent news found for this ticker.</p>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-h-[200px]">
                  <WatchlistSidebar onSelect={(sym) => {
                    const found = companiesData.find(c => c.symbol === sym);
                    if (found) {
                      setDisplayName(`${found.name} (${found.symbol})`);
                      setSymbol(found.symbol);
                    } else {
                      setSymbol(sym);
                    }
                  }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
