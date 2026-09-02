import os
import pytest
import pandas as pd

import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from train_model import train_and_evaluate_all, DEFAULT_DATASET_PATH, MODELS_DIR
from predict import predict_threat

def test_model_training_and_prediction():
    # Execute model training pipeline on default dataset
    evaluations, meta = train_and_evaluate_all(DEFAULT_DATASET_PATH)
    
    assert len(evaluations) == 4
    assert meta['active_algorithm'] in ["Random Forest", "Decision Tree", "Logistic Regression", "Support Vector Machine"]
    assert os.path.exists(os.path.join(MODELS_DIR, 'best_model.pkl'))
    assert os.path.exists(os.path.join(MODELS_DIR, 'scaler.pkl'))
    
    # Test single flow prediction
    normal_payload = {
        "source_ip": "192.168.1.10",
        "dest_ip": "10.0.0.1",
        "src_port": 50123,
        "dst_port": 443,
        "protocol": "TCP",
        "flow_duration": 1500,
        "total_pkts": 20,
        "total_bytes": 10000,
        "packet_rate": 13.3,
        "byte_rate": 6666.6,
        "fwd_pkts": 10,
        "fwd_bytes": 5000,
        "avg_pkt_size": 500,
        "min_pkt_size": 50,
        "max_pkt_size": 1200,
        "tcp_flags": 24,
        "iat_mean": 75
    }
    
    result = predict_threat(normal_payload)
    assert result['error'] is False
    assert result['prediction'] in ["NORMAL TRAFFIC", "CYBER THREAT DETECTED"]
    assert "confidence" in result
    assert "risk_level" in result
    assert len(result['recommendations']) > 0
