import os
import pytest
import json

import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_api_health(client):
    res = client.get('/api/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'online'
    assert 'model_loaded' in data

def test_api_dashboard(client):
    res = client.get('/api/dashboard')
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'total_analyzed' in data['data']

def test_api_predict(client):
    payload = {
        "source_ip": "172.16.0.5",
        "dest_ip": "10.0.0.10",
        "src_port": 80,
        "dst_port": 8080,
        "protocol": "TCP",
        "flow_duration": 1200,
        "total_pkts": 15,
        "total_bytes": 4500
    }
    res = client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'prediction' in data['data']

def test_api_predict_invalid_payload(client):
    res = client.post('/api/predict', data="not json", content_type='text/plain')
    assert res.status_code == 400

def test_api_history(client):
    res = client.get('/api/history')
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'predictions' in data
