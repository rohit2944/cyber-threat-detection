import os
import json
import time
import joblib
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, roc_auc_score
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.calibration import CalibratedClassifierCV

from preprocess import clean_and_preprocess_dataframe, FEATURE_COLUMNS
from database import save_model_evaluations, save_dataset_meta, init_db

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'models'))
DATASETS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'datasets'))
DEFAULT_DATASET_PATH = os.path.join(DATASETS_DIR, 'synthetic_unidirectional_flows.csv')

def train_and_evaluate_all(csv_file_path=None):
    if csv_file_path is None:
        csv_file_path = DEFAULT_DATASET_PATH

    if not os.path.exists(csv_file_path):
        # Generate synthetic dataset if missing
        from utils.generate_synthetic_dataset import generate_synthetic_flows
        os.makedirs(DATASETS_DIR, exist_ok=True)
        df_gen = generate_synthetic_flows()
        df_gen.to_csv(csv_file_path, index=False)

    df_raw = pd.read_csv(csv_file_path)
    df, X, y_binary, y_multiclass, meta_info = clean_and_preprocess_dataframe(df_raw)

    # Initialize DB and save dataset metadata
    init_db()
    save_dataset_meta(
        filename=os.path.basename(csv_file_path),
        row_count=meta_info['row_count'],
        col_count=meta_info['col_count'],
        missing_values=meta_info['missing_values'],
        duplicate_count=meta_info['duplicate_count'],
        class_distribution=meta_info['class_distribution']
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_binary, test_size=0.2, random_state=42, stratify=y_binary
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    classifiers = {
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42, max_depth=12),
        "Decision Tree": DecisionTreeClassifier(random_state=42, max_depth=10),
        "Logistic Regression": LogisticRegression(random_state=42, max_iter=1000),
        "Support Vector Machine": CalibratedClassifierCV(SVC(kernel='rbf', random_state=42), ensemble=False)
    }

    evaluations = []
    trained_models = {}

    for name, clf in classifiers.items():
        start_time = time.time()
        
        # Scaling used for all to maintain consistent evaluation pipeline
        clf.fit(X_train_scaled, y_train)
        train_time = round(time.time() - start_time, 4)
        
        y_pred = clf.predict(X_test_scaled)
        
        acc = round(float(accuracy_score(y_test, y_pred)), 4)
        prec = round(float(precision_score(y_test, y_pred, zero_division=0)), 4)
        rec = round(float(recall_score(y_test, y_pred, zero_division=0)), 4)
        f1 = round(float(f1_score(y_test, y_pred, zero_division=0)), 4)
        
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        roc_auc = None
        try:
            if hasattr(clf, "predict_proba"):
                y_prob = clf.predict_proba(X_test_scaled)[:, 1]
                roc_auc = round(float(roc_auc_score(y_test, y_prob)), 4)
        except Exception:
            roc_auc = None

        evaluations.append({
            "algorithm": name,
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "roc_auc": roc_auc,
            "execution_time": train_time,
            "confusion_matrix": cm
        })
        
        trained_models[name] = clf

    # Select best model based primarily on F1 Score
    # Default priority to Random Forest if tied
    best_eval = max(evaluations, key=lambda e: (e['f1_score'], e['accuracy'], 1 if e['algorithm'] == 'Random Forest' else 0))
    best_name = best_eval['algorithm']
    best_clf = trained_models[best_name]

    # Save artifacts
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    joblib.dump(best_clf, os.path.join(MODELS_DIR, 'best_model.pkl'))
    joblib.dump(scaler, os.path.join(MODELS_DIR, 'scaler.pkl'))

    # Extract feature importances if Random Forest or Decision Tree
    feature_importances = {}
    if hasattr(best_clf, 'feature_importances_'):
        importances = best_clf.feature_importances_
        feature_importances = {col: round(float(imp), 4) for col, imp in zip(FEATURE_COLUMNS, importances)}
        # Sort descending
        feature_importances = dict(sorted(feature_importances.items(), key=lambda x: x[1], reverse=True))

    meta_payload = {
        "active_algorithm": best_name,
        "metrics": best_eval,
        "feature_importances": feature_importances,
        "feature_columns": FEATURE_COLUMNS,
        "class_labels": ["BENIGN", "MALICIOUS"],
        "dataset_name": os.path.basename(csv_file_path),
        "total_samples": len(df)
    }

    with open(os.path.join(MODELS_DIR, 'model_meta.json'), 'w') as f:
        json.dump(meta_payload, f, indent=2)

    with open(os.path.join(MODELS_DIR, 'feature_names.json'), 'w') as f:
        json.dump(FEATURE_COLUMNS, f, indent=2)

    # Save metrics in DB
    save_model_evaluations(evaluations, active_algorithm=best_name)

    print(f"Model training complete. Best Model: {best_name} (F1 Score: {best_eval['f1_score']})")
    return evaluations, meta_payload

if __name__ == '__main__':
    train_and_evaluate_all()
