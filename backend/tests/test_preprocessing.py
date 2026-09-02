import os
import pytest
import pandas as pd

import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from preprocess import (
    clean_and_preprocess_dataframe, prepare_single_flow_features,
    encode_protocol, FEATURE_COLUMNS
)

def test_encode_protocol():
    assert encode_protocol('TCP') == 6
    assert encode_protocol('UDP') == 17
    assert encode_protocol('ICMP') == 1
    assert encode_protocol('tcp') == 6
    assert encode_protocol(6) == 6
    assert encode_protocol('UNKNOWN_PROTO') == 0

def test_clean_and_preprocess_dataframe():
    data = {
        'src_port': [80, 443, 80],
        'dst_port': [8080, 53, 8080],
        'protocol': ['TCP', 'UDP', 'TCP'],
        'flow_duration': [1000, 500, 1000],
        'total_pkts': [10, 5, 10],
        'total_bytes': [1500, 500, 1500],
        'Label': ['BENIGN', 'DDoS', 'BENIGN']
    }
    raw_df = pd.DataFrame(data)
    df, X, y_binary, y_multiclass, meta = clean_and_preprocess_dataframe(raw_df)
    
    assert len(X) == 2  # 1 duplicate row removed
    assert meta['duplicate_count'] == 1
    assert 'protocol' in X.columns
    assert list(X.columns) == FEATURE_COLUMNS

def test_prepare_single_flow_features():
    payload = {
        'src_port': 443,
        'dst_port': 52140,
        'protocol': 'TCP',
        'flow_duration': 2500,
        'total_pkts': 30,
        'total_bytes': 45000
    }
    df = prepare_single_flow_features(payload)
    assert len(df) == 1
    assert df.shape[1] == len(FEATURE_COLUMNS)
    assert df['src_port'].iloc[0] == 443
    assert df['protocol'].iloc[0] == 6
