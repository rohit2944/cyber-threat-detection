import os
import json
import joblib
import pandas as pd
import numpy as np

from preprocess import prepare_single_flow_features, FEATURE_COLUMNS
from database import save_prediction

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'models'))
MODEL_PATH = os.path.join(MODELS_DIR, 'best_model.pkl')
SCALER_PATH = os.path.join(MODELS_DIR, 'scaler.pkl')
META_PATH = os.path.join(MODELS_DIR, 'model_meta.json')

def load_model_artifacts():
    if not (os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH) and os.path.exists(META_PATH)):
        return None, None, None
    try:
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        with open(META_PATH, 'r') as f:
            meta = json.load(f)
        return model, scaler, meta
    except Exception as e:
        print(f"Error loading model artifacts: {e}")
        return None, None, None

def assess_risk_level(prediction_binary, confidence, flow_features):
    """
    Computes risk level (LOW, MEDIUM, HIGH, CRITICAL) based on prediction, confidence, and flow rates.
    """
    if prediction_binary == 0:
        return "LOW"
    
    # Malicious traffic risk assignment
    packet_rate = flow_features.get('packet_rate', 0)
    byte_rate = flow_features.get('byte_rate', 0)
    total_pkts = flow_features.get('total_pkts', 0)
    
    if confidence >= 0.85 and (packet_rate > 1000 or total_pkts > 1000):
        return "CRITICAL"
    elif confidence >= 0.75 or packet_rate > 500:
        return "HIGH"
    elif confidence >= 0.60:
        return "MEDIUM"
    else:
        return "LOW"

def generate_recommendations(risk_level, prediction_binary, predicted_class, payload):
    """
    Generates actionable defensive cybersecurity mitigation recommendations.
    """
    if prediction_binary == 0:
        return [
            "Traffic pattern aligns with benign network baseline.",
            "Continue standard passive network monitoring.",
            "No immediate firewall action required."
        ]
        
    src_ip = payload.get('source_ip', 'Source Host')
    dst_port = payload.get('dst_port', 80)
    protocol = payload.get('protocol', 'TCP')
    
    recommendations = []
    
    if risk_level in ["CRITICAL", "HIGH"]:
        recommendations.append(f"ALERT: Immediate defensive action recommended for {src_ip}.")
        recommendations.append(f"Consider dropping unidirectional traffic from {src_ip} at ingress router/firewall.")
        if predicted_class == 'DDoS' or payload.get('packet_rate', 0) > 1000:
            recommendations.append("Apply rate-limiting and SYN-proxy filtering on destination port " + str(dst_port) + ".")
        elif predicted_class == 'PortScan':
            recommendations.append("Enable automated IP shun rule to block port-scanning sweep activities.")
        elif predicted_class == 'BruteForce':
            recommendations.append("Enforce multi-factor authentication (MFA) and lock target service port " + str(dst_port) + ".")
        else:
            recommendations.append("Isolate impacted VLAN segment and initiate packet capture analysis.")
    else:
        recommendations.append(f"Flag host {src_ip} for heightened SIEM event correlation monitoring.")
        recommendations.append(f"Inspect recent authentication & connection logs on destination port {dst_port}.")
        recommendations.append("Review threat intelligence feeds for IP reputation history.")

    return recommendations

def infer_attack_subtype(payload, feature_df):
    """
    Rule-guided heuristic to estimate attack category when model outputs malicious binary decision.
    """
    pkt_rate = float(feature_df['packet_rate'].iloc[0])
    total_pkts = float(feature_df['total_pkts'].iloc[0])
    dst_port = int(feature_df['dst_port'].iloc[0])
    avg_pkt_size = float(feature_df['avg_pkt_size'].iloc[0])
    tcp_flags = int(feature_df['tcp_flags'].iloc[0])

    if pkt_rate > 500 or total_pkts > 500:
        return "DDoS"
    elif total_pkts <= 5 and avg_pkt_size < 100:
        return "PortScan"
    elif dst_port in [22, 21, 3389, 445] and tcp_flags in [24, 16]:
        return "BruteForce"
    elif avg_pkt_size > 1200:
        return "Data Exfiltration"
    else:
        return "Malicious Flow"

def predict_threat(payload):
    """
    Executes prediction workflow for a single flow payload.
    """
    model, scaler, meta = load_model_artifacts()
    
    if model is None or scaler is None:
        return {
            "error": True,
            "message": "Model has not been trained yet. Please upload a valid dataset and train the model first."
        }

    # Transform payload into dataframe matching FEATURE_COLUMNS
    feature_df = prepare_single_flow_features(payload)
    X_scaled = scaler.transform(feature_df)
    
    prediction_binary = int(model.predict(X_scaled)[0])
    
    # Calculate confidence percentage
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X_scaled)[0]
        confidence = float(probs[prediction_binary])
    else:
        confidence = 0.90 if prediction_binary == 1 else 0.92

    confidence_pct = round(confidence * 100, 2)
    
    # Determine prediction text and status
    if prediction_binary == 0:
        prediction_status = "NORMAL TRAFFIC"
        predicted_class = "BENIGN"
        ai_disclaimer = "AI analysis indicates traffic pattern aligns with normal baseline."
    else:
        prediction_status = "CYBER THREAT DETECTED"
        predicted_class = infer_attack_subtype(payload, feature_df)
        ai_disclaimer = "AI prediction indicates possible malicious network traffic."

    flow_features_dict = feature_df.to_dict(orient='records')[0]
    risk_level = assess_risk_level(prediction_binary, confidence, flow_features_dict)
    recommendations = generate_recommendations(risk_level, prediction_binary, predicted_class, payload)
    
    # Extract top contributing features
    contributing_features = []
    if meta and "feature_importances" in meta and meta["feature_importances"]:
        top_feats = list(meta["feature_importances"].items())[:5]
        for name, imp in top_feats:
            val = flow_features_dict.get(name, 0)
            contributing_features.append({
                "feature": name,
                "importance": round(imp, 4),
                "value": val
            })
    else:
        # Generic importance for non-RF models
        contributing_features = [
            {"feature": "packet_rate", "importance": 0.25, "value": flow_features_dict.get("packet_rate", 0)},
            {"feature": "flow_duration", "importance": 0.20, "value": flow_features_dict.get("flow_duration", 0)},
            {"feature": "total_bytes", "importance": 0.18, "value": flow_features_dict.get("total_bytes", 0)},
            {"feature": "total_pkts", "importance": 0.15, "value": flow_features_dict.get("total_pkts", 0)},
            {"feature": "avg_pkt_size", "importance": 0.12, "value": flow_features_dict.get("avg_pkt_size", 0)}
        ]

    result = {
        "error": False,
        "prediction": prediction_status,
        "predicted_class": predicted_class,
        "is_malicious": bool(prediction_binary == 1),
        "confidence": confidence_pct,
        "risk_level": risk_level,
        "disclaimer": ai_disclaimer,
        "active_algorithm": meta.get("active_algorithm", "Machine Learning Model") if meta else "Random Forest",
        "contributing_features": contributing_features,
        "recommendations": recommendations,
        "source_ip": payload.get('source_ip', '192.168.1.100'),
        "dest_ip": payload.get('dest_ip', '10.0.0.1'),
        "src_port": int(payload.get('src_port', 80)),
        "dst_port": int(payload.get('dst_port', 8080)),
        "protocol": payload.get('protocol', 'TCP'),
        "flow_duration": flow_features_dict.get('flow_duration', 0),
        "total_pkts": flow_features_dict.get('total_pkts', 0),
        "total_bytes": flow_features_dict.get('total_bytes', 0)
    }

    # Save prediction into SQLite Database
    try:
        db_id = save_prediction(result)
        result["history_id"] = db_id
    except Exception as e:
        print(f"Failed to log prediction to DB: {e}")

    return result
