import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Predict from './pages/Predict';
import Dataset from './pages/Dataset';
import TrainModel from './pages/TrainModel';
import ModelPerformance from './pages/ModelPerformance';
import PredictionHistory from './pages/PredictionHistory';
import About from './pages/About';
import { checkHealth, getModelPerformance, getDatasetInfo } from './services/api';

const MainLayout = () => {
  const location = useLocation();
  const [healthStatus, setHealthStatus] = useState(null);
  const [activeModel, setActiveModel] = useState('Random Forest');
  const [datasetName, setDatasetName] = useState('Synthetic Flows');

  useEffect(() => {
    fetchMeta();
    const interval = setInterval(fetchMeta, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchMeta = async () => {
    try {
      const health = await checkHealth();
      setHealthStatus(health);
      if (health.active_algorithm && health.active_algorithm !== 'None') {
        setActiveModel(health.active_algorithm);
      }
    } catch (e) {
      setHealthStatus({ status: 'offline' });
    }

    try {
      const ds = await getDatasetInfo();
      if (ds.meta && ds.meta.filename) {
        setDatasetName(ds.meta.filename);
      }
    } catch (e) {}
  };

  const getPageTitle = (path) => {
    switch (path) {
      case '/': return 'Cybersecurity Analytics Dashboard';
      case '/predict': return 'Traffic Threat Prediction';
      case '/dataset': return 'Dataset Management & Preprocessing';
      case '/train': return 'Train & Compare ML Models';
      case '/performance': return 'Model Performance Evaluation';
      case '/history': return 'Prediction Audit History';
      case '/about': return 'About Project';
      default: return 'Cyber Threat Detection';
    }
  };

  return (
    <div className="app-container">
      <Sidebar healthStatus={healthStatus} />

      <div className="main-wrapper">
        <Header 
          title={getPageTitle(location.pathname)} 
          activeModel={activeModel} 
          datasetName={datasetName} 
        />

        <main className="content-area">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/dataset" element={<Dataset />} />
            <Route path="/train" element={<TrainModel />} />
            <Route path="/performance" element={<ModelPerformance />} />
            <Route path="/history" element={<PredictionHistory />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

export default App;
