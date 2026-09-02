import React, { useState, useEffect } from 'react';
import { getDashboard, getLiveFlow } from '../services/api';
import StatCard from '../components/StatCard';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Percent, 
  CheckCircle2, 
  PieChart as PieIcon, 
  BarChart2, 
  ArrowRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [lastLiveFlow, setLastLiveFlow] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isLive) {
      interval = setInterval(async () => {
        try {
          const res = await getLiveFlow();
          if (res.success) {
            setLastLiveFlow(res);
            fetchDashboardData();
          }
        } catch (e) {
          console.error("Live stream error", e);
        }
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await getDashboard();
      if (res.success) {
        setStats(res.data);
      } else {
        setError(res.error || 'Failed to load dashboard statistics.');
      }
    } catch (err) {
      setError('Could not connect to backend server. Make sure Flask API is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading cybersecurity dashboard metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ borderLeft: '4px solid var(--status-danger)', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <AlertTriangle color="var(--status-danger)" size={28} />
          <h2 style={{ fontSize: '1.2rem', color: 'var(--status-danger)' }}>Dashboard Error</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchDashboardData}>
          Retry Connection
        </button>
      </div>
    );
  }

  const {
    total_analyzed = 0,
    normal_count = 0,
    malicious_count = 0,
    threat_detection_rate = 0,
    active_model_accuracy = 0,
    active_model_name = 'Random Forest',
    class_breakdown = {},
    recent_predictions = []
  } = stats || {};

  // Chart Data Setup
  const pieData = [
    { name: 'Normal Traffic', value: normal_count, color: '#10b981' },
    { name: 'Malicious Traffic', value: malicious_count, color: '#ef4444' }
  ];

  const attackBarData = Object.keys(class_breakdown).map((key) => ({
    category: key,
    count: class_breakdown[key],
    color: key === 'BENIGN' ? '#10b981' : '#f59e0b'
  }));

  return (
    <div>
      {/* Title Header Banner */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(6,182,212,0.18))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              AI-Based Detection of Cyber Threats in Unidirectional IP Traffic
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '900px' }}>
              An AI-powered system for detecting malicious network traffic using machine learning algorithms. 
              Real-time flow feature analysis, confidence scoring, threat level classification, and actionable mitigation guidance.
            </p>
          </div>

          <div>
            <button
              className={`btn ${isLive ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => setIsLive(!isLive)}
              style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem' }}
            >
              <span className={`status-dot ${isLive ? '' : 'offline'}`} style={{ marginRight: '0.3rem' }}></span>
              {isLive ? 'STOP LIVE STREAM' : 'START LIVE TRAFFIC STREAM'}
            </button>
          </div>
        </div>

        {/* Live Packet Telemetry Banner */}
        {isLive && lastLiveFlow && (
          <div style={{ marginTop: '1.25rem', background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--accent-cyan)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🔴 LIVE NETWORK TRAFFIC STREAM TELEMETRY
              </span>
              <span className="badge badge-cyan font-mono">Sampling Rate: 2.5s</span>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
              <div><strong>Flow:</strong> <span className="font-mono">{lastLiveFlow.live_flow.source_ip}:{lastLiveFlow.live_flow.src_port} ➔ {lastLiveFlow.live_flow.dest_ip}:{lastLiveFlow.live_flow.dst_port} ({lastLiveFlow.live_flow.protocol})</span></div>
              <div><strong>Rate:</strong> <span className="font-mono">{lastLiveFlow.live_flow.packet_rate} pkts/s</span></div>
              <div><strong>Status:</strong> 
                <span className={`badge ${lastLiveFlow.prediction_result.is_malicious ? 'badge-danger' : 'badge-normal'}`} style={{ marginLeft: '0.4rem' }}>
                  {lastLiveFlow.prediction_result.prediction} ({lastLiveFlow.prediction_result.confidence}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="stat-grid">
        <StatCard
          title="Total Traffic Analyzed"
          value={total_analyzed}
          subtext="Unidirectional flow records"
          icon={Activity}
          type="normal"
        />

        <StatCard
          title="Normal Traffic"
          value={normal_count}
          subtext="Benign network baseline"
          icon={ShieldCheck}
          type="normal"
        />

        <StatCard
          title="Malicious Traffic"
          value={malicious_count}
          subtext="Detected threats & attacks"
          icon={AlertTriangle}
          type="danger"
        />

        <StatCard
          title="Threat Detection Rate"
          value={`${threat_detection_rate}%`}
          subtext="Malicious / Total flows"
          icon={Percent}
          type="warning"
        />

        <StatCard
          title="Model Accuracy"
          value={`${(active_model_accuracy * 100).toFixed(1)}%`}
          subtext={`Active: ${active_model_name}`}
          icon={CheckCircle2}
          type="purple"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Normal vs Malicious Doughnut Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <PieIcon size={18} />
              Traffic Classification Ratio
            </span>
            <span className="badge badge-cyan">Real-time DB</span>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            {total_analyzed === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No predictions recorded yet. Run a traffic prediction to generate live charts.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Attack Category Breakdown Bar Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <BarChart2 size={18} />
              Threat & Attack Type Breakdown
            </span>
            <span className="badge badge-cyan">Subclass</span>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            {attackBarData.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No attack distribution data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attackBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="category" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Predictions Quick Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Traffic Predictions</span>
          <Link to="/history" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            View Full History <ArrowRight size={14} />
          </Link>
        </div>

        {recent_predictions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>
            No recent traffic predictions found. Navigate to <strong>Traffic Prediction</strong> to analyze a flow.
          </p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Source IP</th>
                  <th>Destination IP</th>
                  <th>Protocol</th>
                  <th>Prediction</th>
                  <th>Confidence</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {recent_predictions.map((item) => {
                  const isNormal = item.prediction === 'NORMAL TRAFFIC' || item.prediction === 'NORMAL';
                  return (
                    <tr key={item.id}>
                      <td className="font-mono">{item.timestamp}</td>
                      <td className="font-mono">{item.source_ip}:{item.src_port}</td>
                      <td className="font-mono">{item.dest_ip}:{item.dst_port}</td>
                      <td><span className="badge badge-cyan">{item.protocol}</span></td>
                      <td>
                        <span className={`badge ${isNormal ? 'badge-normal' : 'badge-danger'}`}>
                          {item.prediction}
                        </span>
                      </td>
                      <td className="font-mono">{item.confidence}%</td>
                      <td>
                        <span className={`badge ${
                          item.risk_level === 'CRITICAL' ? 'badge-danger' :
                          item.risk_level === 'HIGH' ? 'badge-danger' :
                          item.risk_level === 'MEDIUM' ? 'badge-warning' : 'badge-normal'
                        }`}>
                          {item.risk_level}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
