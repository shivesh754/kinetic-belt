import { useState, useEffect } from 'react';
import { stockService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  PiggyBank, 
  Activity, 
  DollarSign,
  PieChart as PieChartIcon
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

const Portfolio = () => {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState(null);

  const fetchPortfolio = async () => {
    try {
      const data = await stockService.getPortfolio();
      setPortfolio(data);
    } catch (err) {
      console.error('Portfolio fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchPortfolio();
  }, [user]);

  const handleAddTrade = async (e) => {
    e.preventDefault();
    if (!symbol || !shares || !price) return;
    try {
      await stockService.addPortfolioItem(symbol.toUpperCase(), shares, price);
      setSymbol('');
      setShares('');
      setPrice('');
      fetchPortfolio();
    } catch (err) {
      setError('Failed to add trade');
    }
  };

  const handleDelete = async (id) => {
    try {
      await stockService.deletePortfolioItem(id);
      fetchPortfolio();
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  const totalInvestment = portfolio.reduce((acc, item) => acc + (item.shares * item.purchasePrice), 0);

  if (loading) return <LoadingSpinner message="Loading your portfolio..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in w-full">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-green to-emerald-400">
            Portfolio Simulator
          </h1>
          <p className="text-gray-400 mt-1">Track your virtual holdings and performance</p>
        </div>
        <div className="glass-panel px-6 py-4 flex flex-col items-end border-accent-green/20 bg-accent-green/5">
          <p className="text-[10px] text-accent-green font-bold uppercase tracking-widest">Total Investment</p>
          <p className="text-2xl font-black text-white">${totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Trade Form */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-accent-green" />
              Add Virtual Trade
            </h2>
            <form onSubmit={handleAddTrade} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Stock Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="AAPL, NVDA, TSLA..."
                  className="input-field"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Shares</label>
                  <input
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    placeholder="0.0"
                    step="0.01"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Buy Price ($)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full py-3 mt-4">
                Add to Portfolio
              </button>
            </form>
          </div>
        </div>

        {/* Holdings List */}
        <div className="lg:col-span-2">
          <div className="glass-panel overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-gray-400" />
                Current Holdings
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <PieChartIcon className="w-4 h-4" />
                {portfolio.length} Positions
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="py-4 px-6 font-medium text-gray-400 border-b border-white/10 text-xs uppercase tracking-wider">Asset</th>
                    <th className="py-4 px-6 font-medium text-gray-400 border-b border-white/10 text-xs uppercase tracking-wider">Shares</th>
                    <th className="py-4 px-6 font-medium text-gray-400 border-b border-white/10 text-xs uppercase tracking-wider">Avg Price</th>
                    <th className="py-4 px-6 font-medium text-gray-400 border-b border-white/10 text-xs uppercase tracking-wider">Total Cost</th>
                    <th className="py-4 px-6 font-medium text-gray-400 border-b border-white/10 text-xs uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {portfolio.map((item) => (
                      <motion.tr
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-accent-green/10 flex items-center justify-center text-accent-green font-bold text-xs">
                              {item.symbol.slice(0, 3)}
                            </div>
                            <span className="font-bold text-gray-200">{item.symbol}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-300 font-mono">{item.shares.toFixed(2)}</td>
                        <td className="py-4 px-6 text-gray-300 font-mono">${item.purchasePrice.toFixed(2)}</td>
                        <td className="py-4 px-6 font-bold text-white font-mono">
                          ${(item.shares * item.purchasePrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Sell Position"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {portfolio.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-20 text-center text-gray-500 italic">
                        No holdings yet. Add your first virtual trade to start tracking.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Summary Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="glass-panel p-6 border-blue-500/20 bg-blue-500/5">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <h4 className="text-sm font-semibold text-gray-300">Market Performance</h4>
              </div>
              <p className="text-2xl font-bold text-white">+12.4%</p>
              <p className="text-[10px] text-gray-500 mt-1 italic">Compared to S&P 500 (Simulated)</p>
            </div>
            
            <div className="glass-panel p-6 border-orange-500/20 bg-orange-500/5">
              <div className="flex items-center gap-3 mb-2">
                <PiggyBank className="w-5 h-5 text-orange-400" />
                <h4 className="text-sm font-semibold text-gray-300">Virtual Returns</h4>
              </div>
              <p className="text-2xl font-bold text-white">$4,250.00</p>
              <p className="text-[10px] text-gray-500 mt-1 italic">Total Unrealized P/L</p>
            </div>

            <div className="glass-panel p-6 border-accent-green/20 bg-accent-green/5">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-accent-green" />
                <h4 className="text-sm font-semibold text-gray-300">Available Cash</h4>
              </div>
              <p className="text-2xl font-bold text-white">$100,000.00</p>
              <p className="text-[10px] text-gray-500 mt-1 italic">Initial Simulation Balance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
