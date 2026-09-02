import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Activity, 
  Database, 
  Cpu, 
  BarChart3, 
  History, 
  Info 
} from 'lucide-react';

const Sidebar = ({ healthStatus }) => {
  const isOnline = healthStatus && healthStatus.status === 'online';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <ShieldAlert size={22} />
        </div>
        <div>
          <h1 className="sidebar-title">CYBER THREAT AI</h1>
          <div className="sidebar-subtitle">Unidirectional Flow Detection</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/predict" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Activity />
          <span>Traffic Prediction</span>
        </NavLink>

        <NavLink to="/dataset" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Database />
          <span>Dataset</span>
        </NavLink>

        <NavLink to="/train" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Cpu />
          <span>Train Model</span>
        </NavLink>

        <NavLink to="/performance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BarChart3 />
          <span>Model Performance</span>
        </NavLink>

        <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <History />
          <span>Prediction History</span>
        </NavLink>

        <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Info />
          <span>About Project</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="system-status-indicator">
          <span className={`status-dot ${isOnline ? '' : 'offline'}`}></span>
          <span>Backend API: {isOnline ? 'ONLINE (Port 5000)' : 'OFFLINE'}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
