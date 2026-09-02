import React, { useState, useEffect } from 'react';
import { getModelPerformance } from '../services/api';
import { 
  BarChart3, 
  Award, 
  Info, 
  HelpCircle, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

const ModelPerformance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const res = await getModelPerformance();
      if (res.success) {
        setData(res);
      } else {
        setError(res.error || 'Failed to retrieve model performance data.');
      }
    } catch (err) {
      setError('Could not fetch model performance metrics. Please ensure model has been trained.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading model performance metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card" style={{ borderLeft: '4px solid var(--status-warning)', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <AlertTriangle color="var(--status-warning)" size={28} />
          <h2 style={{ fontSize: '1.2rem', color: 'var(--status-warning)' }}>No Performance Data</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchPerformanceData}>
          Refresh Metrics
        </button>
      </div>
    );
  }

  const {
    active_model = 'Random Forest',
    active_evaluation = {},
    all_evaluations = [],
    feature_importances = {}
  } = data;

  const {
    accuracy = 0,
    precision = 0,
    recall = 0,
    f1_score = 0,
    confusion_matrix = [[0, 0], [0, 0]]
  } = active_evaluation || {};

  // Confusion matrix components for binary classification:
  // [[TN, FP], [FN, TP]]
  const tn = confusion_matrix[0] ? confusion_matrix[0][0] : 0;
  const fp = confusion_matrix[0] ? confusion_matrix[0][1] : 0;
  const fn = confusion_matrix[1] ? confusion_matrix[1][0] : 0;
  const tp = confusion_matrix[1] ? confusion_matrix[1][1] : 0;

  // Feature Importance Data for horizontal bar chart
  const featureChartData = Object.keys(feature_importances).map((key) => ({
    feature: key,
    importance: feature_importances[key]
  }));

  // Multi-algorithm comparative chart data
  const comparisonData = all_evaluations.map((item) => ({
    name: item.algorithm,
    Accuracy: parseFloat((item.accuracy * 100).toFixed(1)),
    Precision: parseFloat((item.precision * 100).toFixed(1)),
    Recall: parseFloat((item.recall * 100).toFixed(1)),
    F1Score: parseFloat((item.f1_score * 100).toFixed(1))
  }));

  return (
    <div>
      {/* Header Banner */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.3rem' }}>
              Model Performance & Feature Importance
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Detailed metrics evaluation, confusion matrix breakdown, and feature contribution analysis for the active production model.
            </p>
          </div>
          <span className="badge badge-normal" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <Award size={16} /> Active Model: {active_model}
          </span>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card stat-purple">
          <div className="stat-info">
            <span className="stat-label">Accuracy Score</span>
            <span className="stat-value">{(accuracy * 100).toFixed(2)}%</span>
            <span className="stat-subtext">Overall correct predictions</span>
          </div>
        </div>

        <div className="stat-card stat-normal">
          <div className="stat-info">
            <span className="stat-label">Precision Score</span>
            <span className="stat-value">{(precision * 100).toFixed(2)}%</span>
            <span className="stat-subtext">True threat ratio</span>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-info">
            <span className="stat-label">Recall Score</span>
            <span className="stat-value">{(recall * 100).toFixed(2)}%</span>
            <span className="stat-subtext">Threat detection coverage</span>
          </div>
        </div>

        <div className="stat-card stat-danger">
          <div className="stat-info">
            <span className="stat-label">F1-Score (Primary Metric)</span>
            <span className="stat-value">{(f1_score * 100).toFixed(2)}%</span>
            <span className="stat-subtext">Harmonic mean of P & R</span>
          </div>
        </div>
      </div>

      {/* Imbalanced Dataset Notice */}
      <div className="disclaimer-box" style={{ marginBottom: '2rem', borderLeftColor: 'var(--status-warning)' }}>
        <Info size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle', color: 'var(--status-warning)' }} />
        <strong>Metric Interpretation Note:</strong> In imbalanced cybersecurity datasets where malicious flows represent a small percentage of total traffic, high Accuracy alone can be misleading. <strong>F1-Score, Precision, and Recall</strong> are prioritized as primary evaluation indicators.
      </div>

      {/* Confusion Matrix & Breakdown Grid */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Confusion Matrix Visual Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <BarChart3 size={18} /> Confusion Matrix Grid
            </span>
            <span className="badge badge-cyan">Binary Classification</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--status-normal-border)', padding: '1.25rem', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--status-normal)', fontWeight: '700', textTransform: 'uppercase' }}>True Negative (TN)</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#fff', margin: '0.3rem 0' }}>{tn}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Normal traffic correctly identified</div>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--status-warning-border)', padding: '1.25rem', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--status-warning)', fontWeight: '700', textTransform: 'uppercase' }}>False Positive (FP)</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#fff', margin: '0.3rem 0' }}>{fp}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Normal traffic wrongly flagged as threat</div>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--status-danger-border)', padding: '1.25rem', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--status-danger)', fontWeight: '700', textTransform: 'uppercase' }}>False Negative (FN)</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#fff', margin: '0.3rem 0' }}>{fn}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Malicious attack missed by model</div>
            </div>

            <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '1.25rem', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: '700', textTransform: 'uppercase' }}>True Positive (TP)</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#fff', margin: '0.3rem 0' }}>{tp}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Threat flow correctly intercepted</div>
            </div>
          </div>
        </div>

        {/* Confusion Matrix Plain English Guide */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <HelpCircle size={18} /> Confusion Matrix Plain-English Guide
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <CheckCircle2 color="var(--status-normal)" size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#fff' }}>True Positives (TP):</strong> Malicious flows correctly classified as cyber threats. Critical for stopping active network intrusions.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <CheckCircle2 color="var(--accent-cyan)" size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#fff' }}>True Negatives (TN):</strong> Legitimate, normal network flows correctly allowed. Ensures seamless operational connectivity.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <AlertTriangle color="var(--status-warning)" size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#fff' }}>False Positives (FP) [False Alarm]:</strong> Safe network activity incorrectly flagged as threat. Causes alert fatigue for SOC analysts.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <AlertTriangle color="var(--status-danger)" size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#fff' }}>False Negatives (FN) [Undetected Threat]:</strong> Malicious traffic missed by the classifier. Represents high operational security risk.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importance Horizontal Bar Chart */}
      {featureChartData.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <span className="card-title">
              <Sliders size={18} /> Random Forest Feature Importance Analysis
            </span>
            <span className="badge badge-cyan">Feature Weights</span>
          </div>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={featureChartData}
                margin={{ top: 10, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="feature" type="category" stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="importance" fill="#06b6d4" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="disclaimer-box" style={{ marginTop: '1rem' }}>
            <Info size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />
            Feature importance indicates which input features contributed most to the trained model's decisions. It does not prove that a feature directly causes an attack.
          </div>
        </div>
      )}

      {/* Algorithm Benchmark Multi-Bar Chart */}
      {comparisonData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Comparative Algorithm Performance</span>
            <span className="badge badge-cyan">LR vs DT vs RF vs SVM</span>
          </div>

          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Bar dataKey="Accuracy" fill="#a855f7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Precision" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recall" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="F1Score" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelPerformance;
