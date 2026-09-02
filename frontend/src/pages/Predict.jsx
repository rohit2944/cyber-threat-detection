import React, { useState } from 'react';
import { predictThreat } from '../services/api';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Sliders, 
  Send, 
  Info, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Lock 
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Preset traffic patterns for instant testing
const PRESETS = {
  normal: {
    name: 'Normal HTTP Web Flow',
    source_ip: '192.168.1.105',
    dest_ip: '10.0.0.8',
    src_port: 54320,
    dst_port: 443,
    protocol: 'TCP',
    flow_duration: 1850,
    total_pkts: 24,
    total_bytes: 18450,
    packet_rate: 12.97,
    byte_rate: 9972.97,
    fwd_pkts: 12,
    fwd_bytes: 9200,
    avg_pkt_size: 768.75,
    min_pkt_size: 54,
    max_pkt_size: 1460,
    tcp_flags: 24,
    iat_mean: 77.08
  },
  ddos: {
    name: 'DDoS SYN Flood Attack',
    source_ip: '185.220.101.5',
    dest_ip: '10.0.0.1',
    src_port: 61200,
    dst_port: 80,
    protocol: 'TCP',
    flow_duration: 3500,
    total_pkts: 3800,
    total_bytes: 228000,
    packet_rate: 1085.71,
    byte_rate: 65142.85,
    fwd_pkts: 3800,
    fwd_bytes: 228000,
    avg_pkt_size: 60.0,
    min_pkt_size: 40,
    max_pkt_size: 80,
    tcp_flags: 2,
    iat_mean: 0.92
  },
  portscan: {
    name: 'Port Scanning Reconnaissance',
    source_ip: '45.142.214.8',
    dest_ip: '10.0.0.1',
    src_port: 50110,
    dst_port: 8080,
    protocol: 'TCP',
    flow_duration: 25,
    total_pkts: 2,
    total_bytes: 108,
    packet_rate: 80.0,
    byte_rate: 4320.0,
    fwd_pkts: 2,
    fwd_bytes: 108,
    avg_pkt_size: 54.0,
    min_pkt_size: 54,
    max_pkt_size: 54,
    tcp_flags: 2,
    iat_mean: 12.5
  },
  bruteforce: {
    name: 'SSH Brute Force Attack',
    source_ip: '198.51.100.42',
    dest_ip: '10.0.0.1',
    src_port: 58900,
    dst_port: 22,
    protocol: 'TCP',
    flow_duration: 950,
    total_pkts: 65,
    total_bytes: 19500,
    packet_rate: 68.42,
    byte_rate: 20526.31,
    fwd_pkts: 35,
    fwd_bytes: 10500,
    avg_pkt_size: 300.0,
    min_pkt_size: 60,
    max_pkt_size: 500,
    tcp_flags: 24,
    iat_mean: 14.61
  }
};

const Predict = () => {
  const [formData, setFormData] = useState(PRESETS.normal);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const applyPreset = (presetKey) => {
    setFormData(PRESETS[presetKey]);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await predictThreat(formData);
      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.error || 'Threat prediction failed.');
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 
        'Error communicating with ML backend API. Ensure Flask server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header Banner */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.3rem' }}>
              Unidirectional IP Flow Threat Detection
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Enter unidirectional IP network flow parameters below to perform real-time machine learning threat analysis.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => applyPreset('normal')}>
              <Zap size={14} color="var(--status-normal)" /> Preset: Normal
            </button>
            <button className="btn btn-secondary" onClick={() => applyPreset('ddos')}>
              <Zap size={14} color="var(--status-danger)" /> Preset: DDoS
            </button>
            <button className="btn btn-secondary" onClick={() => applyPreset('portscan')}>
              <Zap size={14} color="var(--status-warning)" /> Preset: Port Scan
            </button>
            <button className="btn btn-secondary" onClick={() => applyPreset('bruteforce')}>
              <Zap size={14} color="var(--status-purple)" /> Preset: Brute Force
            </button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Input Form Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Sliders size={18} />
              Unidirectional IP Flow Features
            </span>
            <span className="badge badge-cyan">Feature Extractor</span>
          </div>

          <form onSubmit={handleSubmit}>
            {/* IP Metadata Header */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Flow Metadata (Informational Only)
              </div>
              <div className="grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Source IP Address</label>
                  <input
                    type="text"
                    className="form-input"
                    name="source_ip"
                    value={formData.source_ip}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Destination IP Address</label>
                  <input
                    type="text"
                    className="form-input"
                    name="dest_ip"
                    value={formData.dest_ip}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Main Numeric Flow Features */}
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Source Port</label>
                <input
                  type="number"
                  className="form-input"
                  name="src_port"
                  value={formData.src_port}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Destination Port</label>
                <input
                  type="number"
                  className="form-input"
                  name="dst_port"
                  value={formData.dst_port}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Protocol</label>
                <select
                  className="form-select"
                  name="protocol"
                  value={formData.protocol}
                  onChange={handleInputChange}
                >
                  <option value="TCP">TCP (6)</option>
                  <option value="UDP">UDP (17)</option>
                  <option value="ICMP">ICMP (1)</option>
                </select>
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Flow Duration (ms)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  name="flow_duration"
                  value={formData.flow_duration}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Total Packets</label>
                <input
                  type="number"
                  className="form-input"
                  name="total_pkts"
                  value={formData.total_pkts}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Total Bytes</label>
                <input
                  type="number"
                  className="form-input"
                  name="total_bytes"
                  value={formData.total_bytes}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Packet Rate (pkts/s)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  name="packet_rate"
                  value={formData.packet_rate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Byte Rate (bytes/s)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  name="byte_rate"
                  value={formData.byte_rate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Avg Packet Size</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  name="avg_pkt_size"
                  value={formData.avg_pkt_size}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Min Packet Size</label>
                <input
                  type="number"
                  className="form-input"
                  name="min_pkt_size"
                  value={formData.min_pkt_size}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Packet Size</label>
                <input
                  type="number"
                  className="form-input"
                  name="max_pkt_size"
                  value={formData.max_pkt_size}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">TCP Flags (Bitmask)</label>
                <input
                  type="number"
                  className="form-input"
                  name="tcp_flags"
                  value={formData.tcp_flags}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '1rem' }}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Analyzing Unidirectional Flow...
                </>
              ) : (
                <>
                  <Send size={18} />
                  DETECT THREAT
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Results Display Column */}
        <div>
          {error && (
            <div className="card" style={{ borderLeft: '4px solid var(--status-danger)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-danger)', fontWeight: '700', marginBottom: '0.5rem' }}>
                <AlertTriangle size={20} />
                Detection Warning
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
            </div>
          )}

          {!result && !error && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Activity size={48} color="var(--accent-cyan)" style={{ margin: '0 auto 1rem auto', opacity: 0.7 }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Ready for Traffic Inference</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                Fill in flow statistics or click one of the quick preset buttons above, then press <strong>DETECT THREAT</strong>.
              </p>
            </div>
          )}

          {result && (
            <div className={`result-banner ${result.is_malicious ? 'threat' : 'normal'}`}>
              {/* Header Status */}
              <div className="result-header">
                <div className="result-title">
                  {result.is_malicious ? (
                    <>
                      <AlertTriangle size={28} />
                      ⚠ CYBER THREAT DETECTED
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={28} />
                      NORMAL TRAFFIC
                    </>
                  )}
                </div>

                <div className="confidence-gauge">
                  Confidence: {result.confidence}%
                </div>
              </div>

              {/* Badges & Meta */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span className="badge badge-cyan">
                  Class: {result.predicted_class}
                </span>

                <span className={`badge ${
                  result.risk_level === 'CRITICAL' ? 'badge-danger' :
                  result.risk_level === 'HIGH' ? 'badge-danger' :
                  result.risk_level === 'MEDIUM' ? 'badge-warning' : 'badge-normal'
                }`}>
                  Risk Level: {result.risk_level}
                </span>

                <span className="badge badge-secondary" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}>
                  Model: {result.active_algorithm}
                </span>
              </div>

              {/* Disclaimer */}
              <div className="disclaimer-box">
                <Info size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />
                {result.disclaimer}
              </div>

              {/* Contributing Features Breakdown Chart */}
              {result.contributing_features && result.contributing_features.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Key Contributing Features
                  </h4>
                  <div style={{ height: '180px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={result.contributing_features}
                        margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#94a3b8" />
                        <YAxis dataKey="feature" type="category" stroke="#94a3b8" width={90} />
                        <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                        <Bar dataKey="importance" fill={result.is_malicious ? '#ef4444' : '#10b981'} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Defensive Recommendations */}
              {result.recommendations && (
                <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Recommended Defensive Actions
                  </h4>
                  <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} style={{ marginBottom: '0.3rem' }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Predict;
