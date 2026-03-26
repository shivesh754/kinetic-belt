import { useState, useEffect } from 'react';
import { stockService } from '../services/api';
import PredictionChart from '../components/PredictionChart';
import MetricsCard from '../components/MetricsCard';
import ModelSelector from '../components/ModelSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import { AlertCircle, Target, ArrowRight, Table as TableIcon, Calendar, Zap, Activity, Search } from 'lucide-react';
import companiesData from '../data/companies.json';

const Predict = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [displayName, setDisplayName] = useState('Apple Inc. (US)');
  const [days, setDays] = useState('7');
  const [model, setModel] = useState('LSTM');
  const [models, setModels] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [resultsMap, setResultsMap] = useState({});

  useEffect(() => {
    // Fetch available models
    const fetchModels = async () => {
      try {
        const availableModels = await stockService.getModels();
        setModels(availableModels.models || ['Linear Regression', 'Random Forest', 'LSTM']);
      } catch (err) {
        setModels(['Linear Regression', 'Random Forest', 'LSTM']);
      }
    };
    fetchModels();
  }, []);

  const handlePredict = async (e, compareAll = false) => {
    e?.preventDefault();
    if (!symbol || !days) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setIsComparing(compareAll);
    setError(null);
    setResult(null);
    setResultsMap({});
    
    try {
      if (compareAll) {
        const comparisons = {};
        for (const m of models) {
          try {
            const data = await stockService.predictStock(symbol.toUpperCase(), days, m);
            comparisons[m] = data;
          } catch (err) {
            console.error(`Model ${m} failed`, err);
          }
        }
        setResultsMap(comparisons);
        // Default to the first successful model for the main display
        const firstModel = Object.keys(comparisons)[0];
        if (firstModel) setResult(comparisons[firstModel]);
      } else {
        const data = await stockService.predictStock(symbol.toUpperCase(), days, model);
        setResult(data);
        setResultsMap({ [model]: data });
      }
    } catch (err) {
      setError('Prediction failed. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-green to-blue-400">
          Stock AI Predictor
        </h1>
        <p className="text-gray-400 mt-1">Generate future price forecasts using machine learning</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form Column */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-accent-green" />
              Configure Model
            </h2>
            
            <form onSubmit={handlePredict} className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Stock Symbol</label>
                <div className="relative">
                  <input
                    type="text"
                    list="companies"
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
                    placeholder="Search or type symbol..."
                    className="input-field pr-10"
                  />
                  <datalist id="companies">
                    {companiesData.slice(0, 1000).map(c => (
                      <option key={c.symbol} value={`${c.name} (${c.symbol})`} />
                    ))}
                  </datalist>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <Search className="w-4 h-4" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Forecast Horizon</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 7, 14, 30].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDays(d.toString())}
                      className={`py-2 text-sm font-medium rounded-lg transition-colors border ${
                        days === d.toString() 
                          ? 'bg-accent-green/20 border-accent-green text-accent-green' 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              <ModelSelector 
                selected={model} 
                onChange={setModel} 
                availableModels={models} 
              />
              
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-3"
              >
                {loading && !isComparing ? 'Running model inference...' : 'Generate Prediction'}
                {!loading && <Zap className="w-4 h-4" />}
              </button>

              <button 
                type="button"
                onClick={(e) => handlePredict(e, true)}
                disabled={loading}
                className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-lg border border-accent-green/30 bg-accent-green/5 text-accent-green hover:bg-accent-green/10 transition-all font-medium text-sm"
              >
                {loading && isComparing ? 'Comparing all models...' : 'Benchmark All Models'}
                {!loading && <Activity className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {error && (
            <div className="glass-panel p-4 bg-red-500/10 border-red-500/20 text-red-400 flex items-start gap-3 animate-slide-up">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-300">Prediction Error</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="glass-panel flex-1 flex items-center justify-center border-dashed border-white/20 min-h-[400px]">
              <LoadingSpinner message="Running model inference... This might take a few seconds." />
            </div>
          )}

          {!loading && !result && !error && (
            <div className="glass-panel flex-1 flex flex-col items-center justify-center border-dashed border-white/20 min-h-[400px] text-gray-500 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Target className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Ready to Predict</h3>
              <p>Configure the model settings and click Generate Prediction to see future trends.</p>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
                <MetricsCard title="RMSE" value={result.metrics?.RMSE || 0} icon={<Activity className="w-4 h-4" />} />
                <MetricsCard title="MAE" value={result.metrics?.MAE || 0} icon={<Activity className="w-4 h-4" />} />
                <MetricsCard title="MSE" value={result.metrics?.MSE || 0} icon={<Activity className="w-4 h-4" />} />
                <MetricsCard title="R² Score" value={result.metrics?.R2 || 0} icon={<Target className="w-4 h-4 text-accent-green" />} highlight />
              </div>

              {/* Chart */}
              <div className="glass-panel p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    Actual vs Predicted Prices
                  </h3>
                  {isComparing && (
                    <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                      {Object.keys(resultsMap).map(m => (
                        <button
                          key={m}
                          onClick={() => setResult(resultsMap[m])}
                          className={`px-3 py-1 text-xs rounded-md transition-all ${
                            result === resultsMap[m] ? 'bg-accent-green text-white shadow-lg' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <PredictionChart actualData={result.actual_prices} predictedData={result.predicted_prices} />
              </div>

              {/* Data Table */}
              <div className="glass-panel overflow-hidden animate-slide-up" style={{ animationDelay: '200ms' }}>
                <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TableIcon className="w-5 h-5 text-gray-400" />
                    Forecasted Prices ({model})
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    Next {days} days
                  </div>
                </div>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-dark-card/95 backdrop-blur shadow-sm">
                      <tr>
                        <th className="py-3 px-6 font-medium text-gray-400 border-b border-white/10">Date</th>
                        <th className="py-3 px-6 font-medium text-gray-400 border-b border-white/10">Predicted Price</th>
                        <th className="py-3 px-6 font-medium text-gray-400 border-b border-white/10">Confidence / Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.future_forecast?.map((item, i) => {
                        const prevPrice = i === 0 
                          ? result.actual_prices[result.actual_prices.length - 1]?.price 
                          : result.future_forecast[i - 1]?.price;
                        
                        const isUp = item.price >= prevPrice;
                        
                        return (
                          <tr key={item.date} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                            <td className="py-3 px-6 whitespace-nowrap text-gray-300 font-mono text-sm">{item.date}</td>
                            <td className="py-3 px-6 font-bold text-white">${item.price.toFixed(2)}</td>
                            <td className="py-3 px-6">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                isUp ? 'bg-green-500/10 text-stock-up border border-green-500/20' : 'bg-red-500/10 text-stock-down border border-red-500/20'
                              }`}>
                                {isUp ? 'Bullish' : 'Bearish'}
                                <ArrowRight className={`w-3 h-3 ${isUp ? 'rotate-[-45deg]' : 'rotate-[45deg]'}`} />
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Predict;
