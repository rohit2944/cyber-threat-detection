import React, { useState, useEffect } from 'react';
import { trainModel, getModelPerformance } from '../services/api';
import { 
  Cpu, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Award, 
  Clock, 
  BarChart2, 
  ArrowRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TrainModel = () => {
  const navigate = useNavigate();
  const [training, setTraining] = useState(false);
  const [trainingStep, setTrainingStep] = useState(0);
  const [evaluations, setEvaluations] = useState([]);
  const [activeModel, setActiveModel] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchCurrentModelInfo();
  }, []);

  const fetchCurrentModelInfo = async () => {
    try {
      const res = await getModelPerformance();
      if (res.success) {
        setEvaluations(res.all_evaluations || []);
        setActiveModel(res.active_model || '');
      }
    } catch (err) {
      // Ignore initial missing model state
    }
  };

  const handleStartTraining = async () => {
    setTraining(true);
    setError(null);
    setSuccessMsg(null);
    setTrainingStep(1); // Stage 1: Dataset Preprocessing & Feature Extraction

    try {
      // Simulate step-by-step training progress UI feedback
      setTimeout(() => setTrainingStep(2), 800);  // Stage 2: Train/Test Split & Scaling
      setTimeout(() => setTrainingStep(3), 1600); // Stage 3: Multi-Algorithm Optimization (LR, DT, RF, SVM)
      
      const res = await trainModel();

      if (res.success) {
        setTrainingStep(4); // Stage 4: Evaluation & Best Model Artifact Selection
        setEvaluations(res.evaluations);
        setActiveModel(res.active_model);
        setSuccessMsg(`Model training completed successfully! Best Model '${res.active_model}' saved to backend/models/`);
      } else {
        setError(res.error || 'Training failed.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to execute model training pipeline.');
    } finally {
      setTraining(false);
    }
  };

  return (
    <div>
      {/* Header Banner */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.3rem' }}>
              Machine Learning Model Training & Optimization Pipeline
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Trains and evaluates 4 algorithms (Logistic Regression, Decision Tree, Random Forest, SVM) using stratified 80/20 train-test splits.
            </p>
          </div>
          {evaluations.length > 0 && (
            <button className="btn btn-secondary" onClick={() => navigate('/performance')}>
              View Detailed Metrics <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Trigger & Progress Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <span className="card-title">
            <Cpu size={18} /> Training Controller
          </span>
          <span className="badge badge-cyan">Fixed Random State = 42</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>Execute Multi-Algorithm Training</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              The system automatically benchmarks models and saves the highest F1-Score model artifact to <code style={{ color: 'var(--accent-cyan)' }}>backend/models/best_model.pkl</code>.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleStartTraining}
            disabled={training}
            style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}
          >
            {training ? (
              <>
                <div className="spinner"></div> Training Pipeline Running...
              </>
            ) : (
              <>
                <Play size={18} /> START TRAINING
              </>
            )}
          </button>
        </div>

        {/* Real-time Progress Bar */}
        {training && (
          <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>
                {trainingStep === 1 && 'Step 1/4: Cleaning & Feature Preprocessing...'}
                {trainingStep === 2 && 'Step 2/4: Standard Scaling & Train-Test Splitting...'}
                {trainingStep === 3 && 'Step 3/4: Training Logistic Regression, Decision Tree, Random Forest, SVM...'}
                {trainingStep === 4 && 'Step 4/4: Computing F1 Scores & Saving Artifacts...'}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>{trainingStep * 25}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${trainingStep * 25}%` }}></div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ borderLeft: '4px solid var(--status-danger)', background: 'var(--status-danger-bg)', padding: '1rem', borderRadius: '8px', marginTop: '1rem', color: 'var(--status-danger)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
              <AlertTriangle size={18} /> Training Failed
            </div>
            <p style={{ marginTop: '0.3rem', fontSize: '0.875rem' }}>{error}</p>
          </div>
        )}

        {successMsg && (
          <div style={{ borderLeft: '4px solid var(--status-normal)', background: 'var(--status-normal-bg)', padding: '1rem', borderRadius: '8px', marginTop: '1rem', color: 'var(--status-normal)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
              <CheckCircle size={18} /> Training Complete
            </div>
            <p style={{ marginTop: '0.3rem', fontSize: '0.875rem' }}>{successMsg}</p>
          </div>
        )}
      </div>

      {/* Model Performance Comparison Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Award size={18} /> Algorithm Evaluation Matrix
          </span>
          <span className="badge badge-cyan">Benchmark Results</span>
        </div>

        {evaluations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '1.5rem 0', textAlign: 'center' }}>
            No model evaluation matrix available. Click <strong>START TRAINING</strong> to run algorithm benchmark comparison.
          </p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>Accuracy</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1 Score</th>
                  <th>Execution Time</th>
                  <th>Selection Status</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((item, idx) => {
                  const isBest = item.algorithm === activeModel;
                  return (
                    <tr key={idx} style={{ background: isBest ? 'rgba(6, 182, 212, 0.08)' : 'transparent' }}>
                      <td style={{ fontWeight: '700', color: isBest ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                        {item.algorithm}
                      </td>
                      <td className="font-mono">{(item.accuracy * 100).toFixed(2)}%</td>
                      <td className="font-mono">{(item.precision * 100).toFixed(2)}%</td>
                      <td className="font-mono">{(item.recall * 100).toFixed(2)}%</td>
                      <td className="font-mono" style={{ fontWeight: '700', color: isBest ? 'var(--status-normal)' : 'inherit' }}>
                        {(item.f1_score * 100).toFixed(2)}%
                      </td>
                      <td className="font-mono">
                        <Clock size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />
                        {item.execution_time}s
                      </td>
                      <td>
                        {isBest ? (
                          <span className="badge badge-normal">
                            <Award size={12} /> BEST MODEL (Active)
                          </span>
                        ) : (
                          <span className="badge badge-secondary" style={{ opacity: 0.6 }}>
                            Evaluated
                          </span>
                        )}
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

export default TrainModel;
