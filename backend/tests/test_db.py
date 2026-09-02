import os
import pytest
import sqlite3

import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import (
    init_db, get_db_connection, save_prediction, get_predictions,
    delete_prediction, clear_predictions, save_dataset_meta, get_latest_dataset_meta
)

def test_db_initialization_and_crud():
    init_db()
    
    # Clear any previous test data
    clear_predictions()
    
    sample_prediction = {
        "source_ip": "192.168.1.50",
        "dest_ip": "10.0.0.5",
        "src_port": 54321,
        "dst_port": 80,
        "protocol": "TCP",
        "flow_duration": 1500.0,
        "total_pkts": 100,
        "total_bytes": 50000,
        "prediction": "CYBER THREAT DETECTED",
        "predicted_class": "DDoS",
        "confidence": 98.5,
        "risk_level": "CRITICAL",
        "contributing_features": [{"feature": "packet_rate", "importance": 0.3}]
    }
    
    pred_id = save_prediction(sample_prediction)
    assert pred_id is not None
    assert pred_id > 0
    
    rows, total = get_predictions(limit=10)
    assert total >= 1
    assert rows[0]['source_ip'] == "192.168.1.50"
    assert rows[0]['risk_level'] == "CRITICAL"
    
    deleted = delete_prediction(pred_id)
    assert deleted is True

def test_dataset_meta_db():
    init_db()
    meta_id = save_dataset_meta(
        filename="test_dataset.csv",
        row_count=500,
        col_count=16,
        missing_values=0,
        duplicate_count=2,
        class_distribution={"BENIGN": 300, "MALICIOUS": 200}
    )
    assert meta_id > 0
    
    meta = get_latest_dataset_meta()
    assert meta is not None
    assert meta['filename'] == "test_dataset.csv"
    assert meta['row_count'] == 500
    assert meta['class_distribution']['BENIGN'] == 300
