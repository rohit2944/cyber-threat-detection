import os
import json
import pandas as pd
from io import StringIO
from flask import Flask, request, jsonify, make_response, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

from database import (
    init_db, get_dashboard_stats, get_predictions, delete_prediction,
    clear_predictions, get_latest_dataset_meta, get_model_evaluations
)
from preprocess import clean_and_preprocess_dataframe
from train_model import train_and_evaluate_all, DATASETS_DIR, MODELS_DIR, DEFAULT_DATASET_PATH
from predict import predict_threat, load_model_artifacts

app = Flask(__name__)
CORS(app)

# 50 MB Upload limit
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
UPLOAD_FOLDER = DATASETS_DIR
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize DB on server start
init_db()

@app.route('/api/health', methods=['GET'])
def health():
    model, scaler, meta = load_model_artifacts()
    model_loaded = model is not None
    active_algo = meta.get("active_algorithm", "None") if meta else "None"
    
    return jsonify({
        "status": "online",
        "service": "AI-Based Cyber Threat Detection API",
        "version": "1.0.0",
        "model_loaded": model_loaded,
        "active_algorithm": active_algo,
        "database_connected": True
    }), 200

@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    try:
        stats = get_dashboard_stats()
        return jsonify({
            "success": True,
            "data": stats
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Failed to fetch dashboard statistics",
            "details": str(e)
        }), 500

@app.route('/api/live-flow', methods=['GET'])
def live_flow():
    """
    Generates or captures a live unidirectional network traffic flow record,
    executes real-time threat inference, and returns live telemetry.
    """
    import random
    import numpy as np
    
    # 85% probability of normal traffic, 15% probability of attack flow
    is_attack = random.random() < 0.15
    
    if is_attack:
        attack_type = random.choice(['ddos', 'portscan', 'bruteforce'])
        if attack_type == 'ddos':
            flow = {
                "source_ip": f"{random.randint(100,200)}.{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}",
                "dest_ip": "10.0.0.1",
                "src_port": random.randint(1024, 65535),
                "dst_port": random.choice([80, 443]),
                "protocol": "TCP",
                "flow_duration": round(float(random.uniform(1000, 4000)), 2),
                "total_pkts": random.randint(1200, 4500),
                "total_bytes": random.randint(72000, 270000),
                "packet_rate": round(float(random.uniform(800, 2000)), 2),
                "byte_rate": round(float(random.uniform(50000, 150000)), 2),
                "fwd_pkts": random.randint(1200, 4500),
                "fwd_bytes": random.randint(72000, 270000),
                "avg_pkt_size": 60.0,
                "min_pkt_size": 40,
                "max_pkt_size": 80,
                "tcp_flags": 2,
                "iat_mean": round(float(random.uniform(0.1, 1.2)), 2)
            }
        elif attack_type == 'portscan':
            flow = {
                "source_ip": f"{random.randint(40,190)}.{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}",
                "dest_ip": "10.0.0.1",
                "src_port": random.randint(1024, 65535),
                "dst_port": random.randint(1, 10000),
                "protocol": "TCP",
                "flow_duration": round(float(random.uniform(10, 40)), 2),
                "total_pkts": random.randint(1, 3),
                "total_bytes": random.randint(54, 162),
                "packet_rate": round(float(random.uniform(50, 150)), 2),
                "byte_rate": round(float(random.uniform(2000, 6000)), 2),
                "fwd_pkts": random.randint(1, 3),
                "fwd_bytes": random.randint(54, 162),
                "avg_pkt_size": 54.0,
                "min_pkt_size": 54,
                "max_pkt_size": 54,
                "tcp_flags": 2,
                "iat_mean": round(float(random.uniform(5, 20)), 2)
            }
        else:
            flow = {
                "source_ip": f"198.51.100.{random.randint(1,254)}",
                "dest_ip": "10.0.0.1",
                "src_port": random.randint(1024, 65535),
                "dst_port": random.choice([22, 21, 3389]),
                "protocol": "TCP",
                "flow_duration": round(float(random.uniform(400, 1200)), 2),
                "total_pkts": random.randint(30, 90),
                "total_bytes": random.randint(9000, 27000),
                "packet_rate": round(float(random.uniform(40, 100)), 2),
                "byte_rate": round(float(random.uniform(10000, 30000)), 2),
                "fwd_pkts": random.randint(15, 45),
                "fwd_bytes": random.randint(4500, 13500),
                "avg_pkt_size": 300.0,
                "min_pkt_size": 60,
                "max_pkt_size": 500,
                "tcp_flags": 24,
                "iat_mean": round(float(random.uniform(10, 30)), 2)
            }
    else:
        # Normal web/dns traffic flow
        proto = random.choice(['TCP', 'UDP'])
        flow = {
            "source_ip": f"192.168.1.{random.randint(10,250)}",
            "dest_ip": f"10.0.0.{random.randint(1,20)}",
            "src_port": random.randint(1024, 65535),
            "dst_port": random.choice([80, 443, 53, 8080]),
            "protocol": proto,
            "flow_duration": round(float(random.uniform(300, 2500)), 2),
            "total_pkts": random.randint(8, 45),
            "total_bytes": random.randint(1200, 35000),
            "packet_rate": round(float(random.uniform(5, 30)), 2),
            "byte_rate": round(float(random.uniform(2000, 15000)), 2),
            "fwd_pkts": random.randint(4, 25),
            "fwd_bytes": random.randint(600, 18000),
            "avg_pkt_size": round(float(random.uniform(300, 900)), 2),
            "min_pkt_size": random.randint(40, 64),
            "max_pkt_size": random.randint(1200, 1500),
            "tcp_flags": 24 if proto == 'TCP' else 0,
            "iat_mean": round(float(random.uniform(30, 100)), 2)
        }

    result = predict_threat(flow)
    return jsonify({
        "success": True,
        "live_flow": flow,
        "prediction_result": result
    }), 200

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        payload = request.get_json(silent=True)
        if not payload:
            return jsonify({"success": False, "error": "Invalid request payload. Expected JSON."}), 400

        result = predict_threat(payload)
        
        if result.get("error"):
            return jsonify({
                "success": False,
                "error": result["message"]
            }), 400

        return jsonify({
            "success": True,
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Threat prediction processing failed.",
            "details": str(e)
        }), 500

@app.route('/api/upload-dataset', methods=['POST'])
def upload_dataset():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file part provided in request."}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file."}), 400

    if not file.filename.lower().endswith('.csv'):
        return jsonify({"success": False, "error": "Invalid file format. Only CSV files are supported."}), 400

    try:
        filename = secure_filename(file.filename)
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)

        df_raw = pd.read_csv(save_path)
        
        if df_raw.empty:
            os.remove(save_path)
            return jsonify({"success": False, "error": "Uploaded CSV file is empty."}), 400

        # Validate and preprocess dataset
        df, X, y_binary, y_multiclass, meta_info = clean_and_preprocess_dataframe(df_raw)
        
        # Extract preview rows (first 10)
        preview_data = df_raw.head(10).to_dict(orient='records')
        headers = list(df_raw.columns)

        return jsonify({
            "success": True,
            "message": "Dataset uploaded and validated successfully.",
            "filename": filename,
            "file_path": save_path,
            "metrics": meta_info,
            "headers": headers,
            "preview": preview_data
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Dataset processing error. Please check CSV column structure.",
            "details": str(e)
        }), 400

@app.route('/api/train', methods=['POST'])
def train():
    try:
        payload = request.get_json() or {}
        filename = payload.get('filename')
        
        if filename:
            csv_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
        else:
            csv_path = DEFAULT_DATASET_PATH
            
        if not os.path.exists(csv_path):
            return jsonify({
                "success": False,
                "error": f"Dataset file not found: {csv_path}. Please upload a CSV dataset first."
            }), 404

        evaluations, meta = train_and_evaluate_all(csv_path)

        return jsonify({
            "success": True,
            "message": f"All models trained successfully. Active best model: {meta['active_algorithm']}",
            "active_model": meta['active_algorithm'],
            "evaluations": evaluations,
            "meta": meta
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Model training pipeline failed.",
            "details": str(e)
        }), 500

@app.route('/api/model-performance', methods=['GET'])
def model_performance():
    try:
        evaluations = get_model_evaluations()
        model, scaler, meta = load_model_artifacts()

        if not evaluations and meta is None:
            return jsonify({
                "success": False,
                "error": "No model performance data found. Please train the model first."
            }), 404

        active_eval = None
        for ev in evaluations:
            if ev.get('is_active') == 1:
                active_eval = ev
                break
        if not active_eval and evaluations:
            active_eval = evaluations[0]

        feature_importances = meta.get('feature_importances', {}) if meta else {}

        return jsonify({
            "success": True,
            "active_model": meta.get('active_algorithm', 'Unknown') if meta else (active_eval['algorithm'] if active_eval else 'Unknown'),
            "active_evaluation": active_eval,
            "all_evaluations": evaluations,
            "feature_importances": feature_importances,
            "dataset_name": meta.get('dataset_name', 'Default Dataset') if meta else 'Default Dataset'
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Failed to retrieve model performance evaluation metrics.",
            "details": str(e)
        }), 500

@app.route('/api/dataset-info', methods=['GET'])
def dataset_info():
    try:
        meta = get_latest_dataset_meta()
        
        # Check if default dataset exists if meta is None
        if not meta and os.path.exists(DEFAULT_DATASET_PATH):
            df_raw = pd.read_csv(DEFAULT_DATASET_PATH)
            df, X, y_binary, y_multiclass, meta_info = clean_and_preprocess_dataframe(df_raw)
            meta = {
                "filename": os.path.basename(DEFAULT_DATASET_PATH),
                "row_count": meta_info['row_count'],
                "col_count": meta_info['col_count'],
                "missing_values": meta_info['missing_values'],
                "duplicate_count": meta_info['duplicate_count'],
                "class_distribution": meta_info['class_distribution']
            }
            preview_rows = df_raw.head(10).to_dict(orient='records')
            headers = list(df_raw.columns)
        elif meta:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], meta['filename'])
            if os.path.exists(file_path):
                df_raw = pd.read_csv(file_path)
                preview_rows = df_raw.head(10).to_dict(orient='records')
                headers = list(df_raw.columns)
            else:
                preview_rows = []
                headers = []
        else:
            return jsonify({
                "success": False,
                "error": "No dataset information available. Please upload a dataset."
            }), 404

        return jsonify({
            "success": True,
            "meta": meta,
            "headers": headers,
            "preview": preview_rows
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Failed to fetch dataset information.",
            "details": str(e)
        }), 500

@app.route('/api/history', methods=['GET'])
def history():
    try:
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        risk_filter = request.args.get('risk', 'ALL')
        protocol_filter = request.args.get('protocol', 'ALL')
        search = request.args.get('search', '').strip()

        rows, total_count = get_predictions(
            limit=limit,
            offset=offset,
            risk_filter=risk_filter,
            protocol_filter=protocol_filter,
            search=search
        )

        return jsonify({
            "success": True,
            "predictions": rows,
            "total_count": total_count,
            "limit": limit,
            "offset": offset
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Failed to fetch prediction history log.",
            "details": str(e)
        }), 500

@app.route('/api/history/<int:pred_id>', methods=['DELETE'])
def delete_history_item(pred_id):
    try:
        success = delete_prediction(pred_id)
        if success:
            return jsonify({"success": True, "message": f"Prediction entry {pred_id} deleted."}), 200
        else:
            return jsonify({"success": False, "error": f"Prediction entry {pred_id} not found."}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/history', methods=['DELETE'])
def clear_all_history():
    try:
        clear_predictions()
        return jsonify({"success": True, "message": "All prediction history logs cleared."}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/history/export', methods=['GET'])
def export_history_csv():
    try:
        rows, total = get_predictions(limit=5000, offset=0)
        if not rows:
            return jsonify({"success": False, "error": "No prediction history to export."}), 404

        df = pd.DataFrame(rows)
        # Drop JSON string column for clean CSV export
        if 'contributing_features' in df.columns:
            df.drop(columns=['contributing_features'], inplace=True)

        si = StringIO()
        df.to_csv(si, index=False)
        output = make_response(si.getvalue())
        output.headers["Content-Disposition"] = "attachment; filename=cyber_threat_predictions_history.csv"
        output.headers["Content-type"] = "text/csv"
        return output

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Flask server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
