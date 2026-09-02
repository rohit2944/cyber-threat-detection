import React from 'react';
import { 
  ShieldCheck, 
  Target, 
  Layers, 
  Cpu, 
  Database, 
  Code, 
  Lock, 
  CheckCircle2 
} from 'lucide-react';

const About = () => {
  return (
    <div>
      {/* Title Header Card */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(6,182,212,0.12))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <ShieldCheck size={32} color="var(--accent-cyan)" />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
              AI-Based Detection of Cyber Threats in Unidirectional IP Traffic
            </h1>
            <div style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Final-Year Academic Project Specification
            </div>
          </div>
        </div>
      </div>

      {/* Problem Statement & Objectives Grid */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Problem Statement Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Lock size={18} /> Problem Statement
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.925rem' }}>
            Traditional network intrusion detection systems (IDS) heavily rely on predefined static signatures and rules. 
            Modern cyber threats, such as zero-day attacks, polymorphic malware, and high-rate DDoS floods, frequently bypass static rule filters. 
            Furthermore, inspecting bidirectional traffic payload contents often violates encryption boundaries and imposes prohibitive processing overhead. 
            This project implements an intelligent machine learning classifier operating on high-level <strong>unidirectional IP flow features</strong> (flow duration, packet rates, byte rates, packet sizes, and TCP flags) to dynamically identify malicious traffic without requiring deep packet payload inspection.
          </p>
        </div>

        {/* Project Objectives Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Target size={18} /> Key Research Objectives
            </span>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--status-normal)" /> Extract and normalize features from unidirectional IP network traffic flows.
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--status-normal)" /> Implement automated ML preprocessing (protocol encoding, scaling, imputation).
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--status-normal)" /> Train and benchmark 4 algorithms: Logistic Regression, Decision Tree, Random Forest, SVM.
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--status-normal)" /> Auto-select optimal model prioritizing F1-Score for imbalanced network traffic.
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--status-normal)" /> Compute feature importance to interpret model decisions.
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--status-normal)" /> Log historical predictions in SQLite database with search, filter & CSV export.
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--status-normal)" /> Present interactive cybersecurity dashboard & actionable mitigation steps.
            </li>
          </ul>
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <span className="card-title">
            <Layers size={18} /> Technology Architecture & Stack
          </span>
        </div>

        <div className="grid-3" style={{ marginTop: '1rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', fontWeight: '700', marginBottom: '0.75rem' }}>
              <Code size={18} /> Frontend Stack
            </div>
            <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <li><strong>Framework:</strong> React.js (Vite)</li>
              <li><strong>Styling:</strong> Modern Vanilla CSS3 (Dark Theme)</li>
              <li><strong>Visualizations:</strong> Recharts (SVG/Canvas)</li>
              <li><strong>Icons:</strong> Lucide React</li>
              <li><strong>HTTP Client:</strong> Axios</li>
            </ul>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-normal)', fontWeight: '700', marginBottom: '0.75rem' }}>
              <Cpu size={18} /> Backend & Machine Learning
            </div>
            <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <li><strong>API Server:</strong> Python 3 / Flask REST API</li>
              <li><strong>ML Framework:</strong> Scikit-Learn</li>
              <li><strong>Data Processing:</strong> Pandas, NumPy</li>
              <li><strong>Model Persistence:</strong> Joblib</li>
              <li><strong>Testing:</strong> Pytest</li>
            </ul>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-purple)', fontWeight: '700', marginBottom: '0.75rem' }}>
              <Database size={18} /> Database & Storage
            </div>
            <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <li><strong>Database Engine:</strong> SQLite 3</li>
              <li><strong>History Log:</strong> prediction_history table</li>
              <li><strong>Metrics Log:</strong> model_evaluations table</li>
              <li><strong>Dataset Meta:</strong> datasets_meta table</li>
              <li><strong>Export Format:</strong> Standard CSV</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Defensive Disclaimer Card */}
      <div className="disclaimer-box" style={{ padding: '1.25rem' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--status-warning)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
          Defensive & Responsible Use Disclaimer
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          This software application is built strictly for defensive network flow traffic classification, threat visibility, and academic demonstration. 
          It does not contain functionality for exploiting remote hosts, launching cyber attacks, stealing credentials, deploying malware, or performing unauthorized port scans.
        </p>
      </div>
    </div>
  );
};

export default About;
