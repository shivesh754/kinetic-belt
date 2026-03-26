import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WatchlistProvider } from './context/WatchlistContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Predict from './pages/Predict';
import About from './pages/About';
import Auth from './pages/Auth';

function App() {
  return (
    <Router>
      <AuthProvider>
        <WatchlistProvider>
          <div className="min-h-screen flex flex-col relative overflow-hidden bg-dark-navy text-white">
          {/* Abstract background blobs for premium feel */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-green/20 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <Navbar />
          
          <main className="flex-grow z-10 w-full mt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/predict" element={<Predict />} />

              <Route path="/about" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/signup" element={<Auth />} />
            </Routes>
          </main>
        </div>
        </WatchlistProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
