import React, { useState, useEffect } from 'react';
import { getHistory, deleteHistoryItem, clearHistory, getExportHistoryUrl } from '../services/api';
import { 
  History, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle 
} from 'lucide-react';

const PredictionHistory = () => {
  const [predictions, setPredictions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(15);
  const [page, setPage] = useState(1);
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [protocolFilter, setProtocolFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    fetchHistoryData();
  }, [page, riskFilter, protocolFilter, search]);

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const offset = (page - 1) * limit;
      const res = await getHistory({
        limit,
        offset,
        risk: riskFilter,
        protocol: protocolFilter,
        search
      });

      if (res.success) {
        setPredictions(res.predictions || []);
        setTotalCount(res.total_count || 0);
      } else {
        setError(res.error || 'Failed to load history.');
      }
    } catch (err) {
      setError('Could not retrieve prediction history from backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm(`Delete prediction record #${id}?`)) return;
    try {
      const res = await deleteHistoryItem(id);
      if (res.success) {
        fetchHistoryData();
      }
    } catch (err) {
      alert('Failed to delete history record.');
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await clearHistory();
      if (res.success) {
        setShowClearModal(false);
        setPage(1);
        fetchHistoryData();
      }
    } catch (err) {
      alert('Failed to clear prediction history.');
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div>
      {/* Header Banner */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.3rem' }}>
              Historical Threat Log & Audit Records
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Searchable history of past traffic flow inferences logged inside SQLite database (<code style={{ color: 'var(--accent-cyan)' }}>cyber_threat.db</code>).
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a href={getExportHistoryUrl()} className="btn btn-primary" target="_blank" rel="noreferrer">
              <Download size={16} /> Export CSV
            </a>
            <button className="btn btn-danger" onClick={() => setShowClearModal(true)} disabled={predictions.length === 0}>
              <Trash2 size={16} /> Clear History
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem' }}>
          {/* Search Box */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label"><Search size={14} /> Search IP or Class</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 192.168.1.100, DDoS..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Risk Level Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label"><Filter size={14} /> Risk Level</label>
            <select
              className="form-select"
              value={riskFilter}
              onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          {/* Protocol Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label"><Filter size={14} /> Protocol</label>
            <select
              className="form-select"
              value={protocolFilter}
              onChange={(e) => { setProtocolFilter(e.target.value); setPage(1); }}
            >
              <option value="ALL">All Protocols</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
            </select>
          </div>

          {/* Refresh Button */}
          <div className="form-group" style={{ marginBottom: 0, justifyContent: 'flex-end' }}>
            <label className="form-label">&nbsp;</label>
            <button className="btn btn-secondary" onClick={fetchHistoryData} style={{ width: '100%' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* History Data Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <History size={18} /> Prediction Records ({totalCount})
          </span>
          <span className="badge badge-cyan">Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading history records...</p>
          </div>
        ) : predictions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '2rem 0', textAlign: 'center' }}>
            No prediction history matches the selected filters.
          </p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Timestamp</th>
                  <th>Source IP:Port</th>
                  <th>Dest IP:Port</th>
                  <th>Protocol</th>
                  <th>Prediction</th>
                  <th>Class</th>
                  <th>Confidence</th>
                  <th>Risk Level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((item) => {
                  const isNormal = item.prediction === 'NORMAL TRAFFIC' || item.prediction === 'NORMAL';
                  return (
                    <tr key={item.id}>
                      <td className="font-mono">#{item.id}</td>
                      <td className="font-mono">{item.timestamp}</td>
                      <td className="font-mono">{item.source_ip}:{item.src_port}</td>
                      <td className="font-mono">{item.dest_ip}:{item.dst_port}</td>
                      <td><span className="badge badge-cyan">{item.protocol}</span></td>
                      <td>
                        <span className={`badge ${isNormal ? 'badge-normal' : 'badge-danger'}`}>
                          {item.prediction}
                        </span>
                      </td>
                      <td>{item.predicted_class}</td>
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
                      <td>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteItem(item.id)}
                          title="Delete Record"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Showing {predictions.length} of {totalCount} total entries
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '450px', width: '100%', borderLeft: '4px solid var(--status-danger)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--status-danger)' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.1rem' }}>Confirm Clear Prediction History</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Are you sure you want to permanently delete all logged prediction history from SQLite database? This operation cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowClearModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleClearAll}>
                Yes, Clear All History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionHistory;
