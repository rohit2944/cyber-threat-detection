import pandas as pd
import numpy as np

# Feature list used for Machine Learning models
FEATURE_COLUMNS = [
    'src_port',
    'dst_port',
    'protocol',
    'flow_duration',
    'total_pkts',
    'total_bytes',
    'packet_rate',
    'byte_rate',
    'fwd_pkts',
    'fwd_bytes',
    'avg_pkt_size',
    'min_pkt_size',
    'max_pkt_size',
    'tcp_flags',
    'iat_mean'
]

# Protocol mapping
PROTOCOL_MAP = {
    'TCP': 6,
    'UDP': 17,
    'ICMP': 1,
    'GRE': 47,
    'AH': 51,
    'ESP': 50,
    'OTHER': 0
}

REVERSE_PROTOCOL_MAP = {v: k for k, v in PROTOCOL_MAP.items()}

def encode_protocol(val):
    if isinstance(val, (int, float)):
        return int(val)
    val_str = str(val).strip().upper()
    return PROTOCOL_MAP.get(val_str, 0)

def clean_and_preprocess_dataframe(df):
    """
    Cleans raw DataFrame uploaded from CSV:
    - Normalizes column names (lowercase, stripped, underscores)
    - Validates target column ('Label' or 'label' or 'class' or 'prediction')
    - Maps protocol to numeric
    - Imputes missing values
    - Removes duplicate rows
    - Calculates derived rates if missing
    """
    df = df.copy()
    
    # Normalize headers
    column_mapping = {col: col.strip().lower().replace(' ', '_').replace('-', '_') for col in df.columns}
    df.rename(columns=column_mapping, inplace=True)
    
    # Identify target column
    target_col = None
    possible_targets = ['label', 'target', 'class', 'prediction', 'attack_type']
    for candidate in possible_targets:
        if candidate in df.columns:
            target_col = candidate
            break
            
    if not target_col:
        # Fallback: check if last column is non-numeric string
        last_col = df.columns[-1]
        if df[last_col].dtype == 'object':
            target_col = last_col
        else:
            raise ValueError("CSV dataset must contain a target column named 'label', 'target', or 'class'.")
            
    # Check duplicate rows
    duplicate_count = int(df.duplicated().sum())
    df.drop_duplicates(inplace=True)
    
    # Missing values count before imputation
    missing_count = int(df.isnull().sum().sum())
    
    # Ensure protocol is encoded
    if 'protocol' in df.columns:
        df['protocol'] = df['protocol'].apply(encode_protocol)
    else:
        df['protocol'] = 6  # Default TCP
        
    # Map common feature name variations to canonical names
    alias_map = {
        'source_port': 'src_port',
        'destination_port': 'dst_port',
        'dest_port': 'dst_port',
        'duration': 'flow_duration',
        'total_packets': 'total_pkts',
        'packets': 'total_pkts',
        'bytes': 'total_bytes',
        'forward_packets': 'fwd_pkts',
        'forward_bytes': 'fwd_bytes',
        'average_packet_size': 'avg_pkt_size',
        'minimum_packet_size': 'min_pkt_size',
        'maximum_packet_size': 'max_pkt_size',
        'flags': 'tcp_flags',
        'inter_arrival_time': 'iat_mean'
    }
    
    for alias, canonical in alias_map.items():
        if alias in df.columns and canonical not in df.columns:
            df.rename(columns={alias: canonical}, inplace=True)
            
    # Fill missing features with default 0 if not present
    for feature in FEATURE_COLUMNS:
        if feature not in df.columns:
            df[feature] = 0
            
    # Calculate derived rates if zero or missing
    if 'packet_rate' in df.columns and 'flow_duration' in df.columns and 'total_pkts' in df.columns:
        df['packet_rate'] = np.where(
            (df['packet_rate'] == 0) & (df['flow_duration'] > 0),
            df['total_pkts'] / (df['flow_duration'] / 1000.0 + 1e-6),
            df['packet_rate']
        )
        
    if 'byte_rate' in df.columns and 'flow_duration' in df.columns and 'total_bytes' in df.columns:
        df['byte_rate'] = np.where(
            (df['byte_rate'] == 0) & (df['flow_duration'] > 0),
            df['total_bytes'] / (df['flow_duration'] / 1000.0 + 1e-6),
            df['byte_rate']
        )
        
    # Numeric conversion for feature columns
    for feature in FEATURE_COLUMNS:
        df[feature] = pd.to_numeric(df[feature], errors='coerce').fillna(0)
        
    # Clean target label
    df[target_col] = df[target_col].astype(str).str.strip().str.upper()
    
    # Binary classification target (0: BENIGN/NORMAL, 1: MALICIOUS/THREAT)
    # Also keep multi-class label for detailed breakdown
    df['is_malicious'] = df[target_col].apply(lambda x: 0 if x in ['BENIGN', 'NORMAL', '0', 'CLEAN'] else 1)
    
    class_distribution = df[target_col].value_counts().to_dict()
    
    X = df[FEATURE_COLUMNS]
    y_binary = df['is_malicious']
    y_multiclass = df[target_col]
    
    meta_info = {
        "row_count": len(df),
        "col_count": len(df.columns),
        "missing_values": missing_count,
        "duplicate_count": duplicate_count,
        "class_distribution": class_distribution,
        "target_col": target_col
    }
    
    return df, X, y_binary, y_multiclass, meta_info

def prepare_single_flow_features(payload):
    """
    Transforms a single flow payload dictionary into a DataFrame matching FEATURE_COLUMNS.
    """
    src_port = int(payload.get('src_port', 80))
    dst_port = int(payload.get('dst_port', 8080))
    protocol = encode_protocol(payload.get('protocol', 'TCP'))
    
    flow_duration = float(payload.get('flow_duration', 1000))  # ms
    total_pkts = int(payload.get('total_pkts', 10))
    total_bytes = int(payload.get('total_bytes', 1500))
    
    packet_rate = float(payload.get('packet_rate', 0))
    if packet_rate <= 0 and flow_duration > 0:
        packet_rate = total_pkts / (flow_duration / 1000.0 + 1e-6)
        
    byte_rate = float(payload.get('byte_rate', 0))
    if byte_rate <= 0 and flow_duration > 0:
        byte_rate = total_bytes / (flow_duration / 1000.0 + 1e-6)
        
    fwd_pkts = int(payload.get('fwd_pkts', max(1, total_pkts // 2)))
    fwd_bytes = int(payload.get('fwd_bytes', max(100, total_bytes // 2)))
    
    avg_pkt_size = float(payload.get('avg_pkt_size', total_bytes / max(1, total_pkts)))
    min_pkt_size = float(payload.get('min_pkt_size', 40))
    max_pkt_size = float(payload.get('max_pkt_size', 1500))
    
    tcp_flags = int(payload.get('tcp_flags', 2))  # SYN=2 default
    iat_mean = float(payload.get('iat_mean', flow_duration / max(1, total_pkts)))
    
    feature_dict = {
        'src_port': src_port,
        'dst_port': dst_port,
        'protocol': protocol,
        'flow_duration': flow_duration,
        'total_pkts': total_pkts,
        'total_bytes': total_bytes,
        'packet_rate': packet_rate,
        'byte_rate': byte_rate,
        'fwd_pkts': fwd_pkts,
        'fwd_bytes': fwd_bytes,
        'avg_pkt_size': avg_pkt_size,
        'min_pkt_size': min_pkt_size,
        'max_pkt_size': max_pkt_size,
        'tcp_flags': tcp_flags,
        'iat_mean': iat_mean
    }
    
    df = pd.DataFrame([feature_dict])[FEATURE_COLUMNS]
    return df
