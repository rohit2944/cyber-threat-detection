import React, { useState, useEffect } from 'react';
import { getDatasetInfo, uploadDataset } from '../services/api';
import { 
  Database, 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  PieChart as PieIcon, 
  ArrowRight, 
  RefreshCw 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#a855f7', '#06b6d4'];

const Dataset = () => {
  const navigate = useNavigate();
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchDatasetData();
  }, []);

  const fetchDatasetData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDatasetInfo();
      if (res.success) {
        setDatasetInfo(res);
      } else {
        setError(res.error || 'Failed to load dataset metadata.');
      }
    } catch (err) {
      setError('Could not connect to backend API server.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Invalid file type. Only .csv files are supported.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds the maximum limit of 50 MB.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await uploadDataset(file);
      if (res.success) {
        setSuccessMsg(`CSV Dataset '${file.name}' uploaded and validated successfully!`);
        fetchDatasetData();
      } else {
        setError(res.error || 'Dataset upload failed.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload dataset file.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Scanning active CSV dataset...</p>
      </div>
    );
  }

  const { meta, headers = [], preview = [] } = datasetInfo || {};
  const {
    filename = 'Default Synthetic Flows',
    row_count = 0,
    col_count = 0,
    missing_values = 0,
    duplicate_count = 0,
    class_distribution = {}
  } = meta || {};

  // Pie chart class distribution
  const pieData = Object.keys(class_distribution).map((lbl, idx) => ({
    name: lbl,
    value: class_distribution[lbl],
    color: COLORS[idx % COLORS.length]
  }));

  return (
    <div>
      {/* Header Banner */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.3rem' }}>
              Dataset Management & Preprocessing
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Upload and inspect network flow datasets in CSV format. Supports multi-class attack categories and automatic feature cleaning.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/train')}>
            Proceed to Model Training <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--status-danger)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-danger)', fontWeight: '700' }}>
            <AlertTriangle size={20} /> Dataset Upload / Inspection Notice
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="card" style={{ borderLeft: '4px solid var(--status-normal)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-normal)', fontWeight: '700' }}>
            <CheckCircle size={20} /> Success
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>{successMsg}</p>
        </div>
      )}

      {/* File Upload Drag & Drop Box */}
      <div className="card" style={{ marginBottom: '2rem', border: '2px dashed var(--border-color)', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
        <UploadCloud size={48} color="var(--accent-cyan)" style={{ margin: '0 auto 1rem auto' }} />
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Upload Network Traffic CSV Dataset</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          File must contain flow feature columns and a target column named <code style={{ color: 'var(--accent-cyan)' }}>Label</code>. Max size: 50MB.
        </p>

        <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
          {uploading ? (
            <>
              <div className="spinner"></div> Processing CSV...
            </>
          ) : (
            <>
              <FileText size={18} /> Select CSV File
            </>
          )}
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Dataset Statistics Grid */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Database size={18} /> Active File</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>
            {filename}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
            Validated & Loaded
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><FileText size={18} /> Dimensions</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
            {row_count} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '400' }}>rows</span> × {col_count} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '400' }}>cols</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
            Total Unidirectional Records
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><RefreshCw size={18} /> Quality Audit</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div>
              <span className="stat-label">Missing Values</span>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: missing_values > 0 ? 'var(--status-warning)' : 'var(--status-normal)' }}>
                {missing_values}
              </div>
            </div>
            <div>
              <span className="stat-label">Duplicates</span>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: duplicate_count > 0 ? 'var(--status-warning)' : 'var(--status-normal)' }}>
                {duplicate_count}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Class Distribution & Preview */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <PieIcon size={18} /> Class Label Distribution
            </span>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Class Breakdown Counts</span>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Class / Category</th>
                  <th>Record Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(class_distribution).map((lbl, idx) => {
                  const cnt = class_distribution[lbl];
                  const pct = row_count > 0 ? ((cnt / row_count) * 100).toFixed(1) : 0;
                  return (
                    <tr key={idx}>
                      <td>
                        <span className={`badge ${lbl === 'BENIGN' ? 'badge-normal' : 'badge-danger'}`}>
                          {lbl}
                        </span>
                      </td>
                      <td className="font-mono">{cnt}</td>
                      <td className="font-mono">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dataset Preview Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Dataset Data Snippet Preview (First 10 Rows)</span>
        </div>

        {preview.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No preview data available.</p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  {headers.slice(0, 10).map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {headers.slice(0, 10).map((h, cIdx) => (
                      <td key={cIdx} className="font-mono">{String(row[h] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dataset;
