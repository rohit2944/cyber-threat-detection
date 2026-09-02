import sqlite3
import os
import json
from datetime import datetime

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database'))
DB_PATH = os.path.join(DB_DIR, 'cyber_threat.db')

def get_db_connection():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Prediction History Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prediction_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            source_ip TEXT,
            dest_ip TEXT,
            src_port INTEGER,
            dst_port INTEGER,
            protocol TEXT,
            flow_duration REAL,
            total_pkts INTEGER,
            total_bytes INTEGER,
            prediction TEXT NOT NULL,
            predicted_class TEXT NOT NULL,
            confidence REAL NOT NULL,
            risk_level TEXT NOT NULL,
            contributing_features TEXT
        )
    ''')

    # Datasets Metadata Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS datasets_meta (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            upload_timestamp TEXT NOT NULL,
            row_count INTEGER NOT NULL,
            col_count INTEGER NOT NULL,
            missing_values INTEGER NOT NULL,
            duplicate_count INTEGER NOT NULL,
            class_distribution TEXT NOT NULL
        )
    ''')

    # Model Evaluations Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS model_evaluations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            algorithm TEXT NOT NULL,
            accuracy REAL NOT NULL,
            precision REAL NOT NULL,
            recall REAL NOT NULL,
            f1_score REAL NOT NULL,
            roc_auc REAL,
            execution_time REAL NOT NULL,
            confusion_matrix TEXT NOT NULL,
            evaluation_timestamp TEXT NOT NULL,
            is_active INTEGER DEFAULT 0
        )
    ''')

    conn.commit()
    conn.close()

def save_prediction(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    contributing_str = json.dumps(data.get('contributing_features', []))
    
    cursor.execute('''
        INSERT INTO prediction_history (
            timestamp, source_ip, dest_ip, src_port, dst_port, protocol,
            flow_duration, total_pkts, total_bytes, prediction,
            predicted_class, confidence, risk_level, contributing_features
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        timestamp,
        data.get('source_ip', '192.168.1.100'),
        data.get('dest_ip', '10.0.0.1'),
        int(data.get('src_port', 80)),
        int(data.get('dst_port', 8080)),
        str(data.get('protocol', 'TCP')),
        float(data.get('flow_duration', 0)),
        int(data.get('total_pkts', 0)),
        int(data.get('total_bytes', 0)),
        data['prediction'],
        data.get('predicted_class', 'BENIGN'),
        float(data['confidence']),
        data['risk_level'],
        contributing_str
    ))
    
    prediction_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return prediction_id

def get_predictions(limit=100, offset=0, risk_filter=None, protocol_filter=None, search=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM prediction_history WHERE 1=1"
    params = []
    
    if risk_filter and risk_filter != 'ALL':
        query += " AND risk_level = ?"
        params.append(risk_filter)
        
    if protocol_filter and protocol_filter != 'ALL':
        query += " AND protocol = ?"
        params.append(protocol_filter)
        
    if search:
        query += " AND (source_ip LIKE ? OR dest_ip LIKE ? OR predicted_class LIKE ? OR prediction LIKE ?)"
        search_param = f"%{search}%"
        params.extend([search_param, search_param, search_param, search_param])
        
    query += " ORDER BY id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    # Get total count for pagination
    count_query = "SELECT COUNT(*) FROM prediction_history WHERE 1=1"
    count_params = []
    if risk_filter and risk_filter != 'ALL':
        count_query += " AND risk_level = ?"
        count_params.append(risk_filter)
    if protocol_filter and protocol_filter != 'ALL':
        count_query += " AND protocol = ?"
        count_params.append(protocol_filter)
    if search:
        count_query += " AND (source_ip LIKE ? OR dest_ip LIKE ? OR predicted_class LIKE ? OR prediction LIKE ?)"
        search_param = f"%{search}%"
        count_params.extend([search_param, search_param, search_param, search_param])
        
    cursor.execute(count_query, count_params)
    total_count = cursor.fetchone()[0]
    
    result = []
    for r in rows:
        item = dict(r)
        if item['contributing_features']:
            try:
                item['contributing_features'] = json.loads(item['contributing_features'])
            except Exception:
                item['contributing_features'] = []
        result.append(item)
        
    conn.close()
    return result, total_count

def delete_prediction(prediction_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM prediction_history WHERE id = ?", (prediction_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def clear_predictions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM prediction_history")
    conn.commit()
    conn.close()
    return True

def save_dataset_meta(filename, row_count, col_count, missing_values, duplicate_count, class_distribution):
    conn = get_db_connection()
    cursor = conn.cursor()
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    dist_str = json.dumps(class_distribution)
    
    cursor.execute('''
        INSERT INTO datasets_meta (
            filename, upload_timestamp, row_count, col_count,
            missing_values, duplicate_count, class_distribution
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (filename, timestamp, row_count, col_count, missing_values, duplicate_count, dist_str))
    
    meta_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return meta_id

def get_latest_dataset_meta():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM datasets_meta ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        res = dict(row)
        res['class_distribution'] = json.loads(res['class_distribution'])
        return res
    return None

def save_model_evaluations(eval_list, active_algorithm):
    conn = get_db_connection()
    cursor = conn.cursor()
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Mark old records as non-active
    cursor.execute("UPDATE model_evaluations SET is_active = 0")
    
    for ev in eval_list:
        is_active = 1 if ev['algorithm'] == active_algorithm else 0
        cm_str = json.dumps(ev.get('confusion_matrix', []))
        cursor.execute('''
            INSERT INTO model_evaluations (
                algorithm, accuracy, precision, recall, f1_score,
                roc_auc, execution_time, confusion_matrix, evaluation_timestamp, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            ev['algorithm'], ev['accuracy'], ev['precision'], ev['recall'], ev['f1_score'],
            ev.get('roc_auc'), ev['execution_time'], cm_str, timestamp, is_active
        ))
        
    conn.commit()
    conn.close()

def get_model_evaluations():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM model_evaluations ORDER BY evaluation_timestamp DESC, id DESC LIMIT 4")
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        item = dict(r)
        item['confusion_matrix'] = json.loads(item['confusion_matrix'])
        result.append(item)
    return result

def get_dashboard_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM prediction_history")
    total_analyzed = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM prediction_history WHERE prediction = 'NORMAL'")
    normal_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM prediction_history WHERE prediction LIKE '%MALICIOUS%' OR prediction LIKE '%THREAT%'")
    malicious_count = cursor.fetchone()[0]
    
    detection_rate = round((malicious_count / total_analyzed * 100), 2) if total_analyzed > 0 else 0.0
    
    # Get active model accuracy from evaluations
    cursor.execute("SELECT accuracy, f1_score, algorithm FROM model_evaluations WHERE is_active = 1 LIMIT 1")
    active_eval = cursor.fetchone()
    model_accuracy = active_eval['accuracy'] if active_eval else 0.0
    active_model_name = active_eval['algorithm'] if active_eval else 'Not Trained'
    
    # Class distribution breakdown in history
    cursor.execute("SELECT predicted_class, COUNT(*) as cnt FROM prediction_history GROUP BY predicted_class")
    class_rows = cursor.fetchall()
    class_breakdown = {r['predicted_class']: r['cnt'] for r in class_rows}
    
    # Recent predictions (last 5)
    cursor.execute("SELECT * FROM prediction_history ORDER BY id DESC LIMIT 5")
    recent_rows = [dict(r) for r in cursor.fetchall()]
    
    # Protocol distribution
    cursor.execute("SELECT protocol, COUNT(*) as cnt FROM prediction_history GROUP BY protocol")
    protocol_rows = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    
    return {
        "total_analyzed": total_analyzed,
        "normal_count": normal_count,
        "malicious_count": malicious_count,
        "threat_detection_rate": detection_rate,
        "active_model_accuracy": model_accuracy,
        "active_model_name": active_model_name,
        "class_breakdown": class_breakdown,
        "recent_predictions": recent_rows,
        "protocol_breakdown": protocol_rows
    }

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully at:", DB_PATH)
