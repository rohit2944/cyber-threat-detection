import pandas as pd
import numpy as np
import os

def generate_synthetic_flows(num_samples=700, random_state=42):
    np.random.seed(random_state)
    
    records = []
    
    # 1. BENIGN flows (approx 350 samples)
    for _ in range(350):
        src_port = np.random.choice([80, 443, 53, 8080, np.random.randint(1024, 65535)])
        dst_port = np.random.choice([80, 443, 53, 8080, 22, 21])
        protocol = np.random.choice(['TCP', 'UDP'], p=[0.8, 0.2])
        flow_duration = float(np.random.exponential(scale=1200) + 50)  # ms
        total_pkts = int(np.random.randint(4, 50))
        avg_pkt_size = float(np.random.uniform(200, 1100))
        total_bytes = int(total_pkts * avg_pkt_size)
        fwd_pkts = int(np.ceil(total_pkts * np.random.uniform(0.4, 0.6)))
        fwd_bytes = int(fwd_pkts * avg_pkt_size)
        packet_rate = float(total_pkts / (flow_duration / 1000.0 + 1e-5))
        byte_rate = float(total_bytes / (flow_duration / 1000.0 + 1e-5))
        min_pkt_size = int(np.random.uniform(40, 100))
        max_pkt_size = int(avg_pkt_size * np.random.uniform(1.2, 1.6))
        tcp_flags = int(np.random.choice([18, 24, 16, 2]))  # SYN-ACK, PSH-ACK, ACK
        iat_mean = float(flow_duration / total_pkts)
        
        records.append({
            'src_port': src_port,
            'dst_port': dst_port,
            'protocol': protocol,
            'flow_duration': round(flow_duration, 2),
            'total_pkts': total_pkts,
            'total_bytes': total_bytes,
            'packet_rate': round(packet_rate, 2),
            'byte_rate': round(byte_rate, 2),
            'fwd_pkts': fwd_pkts,
            'fwd_bytes': fwd_bytes,
            'avg_pkt_size': round(avg_pkt_size, 2),
            'min_pkt_size': min_pkt_size,
            'max_pkt_size': max_pkt_size,
            'tcp_flags': tcp_flags,
            'iat_mean': round(iat_mean, 2),
            'Label': 'BENIGN'
        })
        
    # 2. DDoS flows (approx 120 samples - high packet rate, small packet size, SYN flood)
    for _ in range(120):
        src_port = int(np.random.randint(1024, 65535))
        dst_port = np.random.choice([80, 443])
        protocol = 'TCP'
        flow_duration = float(np.random.uniform(500, 5000))
        total_pkts = int(np.random.randint(500, 5000))
        avg_pkt_size = float(np.random.uniform(40, 120))  # Small SYN packets
        total_bytes = int(total_pkts * avg_pkt_size)
        fwd_pkts = total_pkts
        fwd_bytes = total_bytes
        packet_rate = float(total_pkts / (flow_duration / 1000.0))
        byte_rate = float(total_bytes / (flow_duration / 1000.0))
        min_pkt_size = 40
        max_pkt_size = 120
        tcp_flags = 2  # SYN flag flood
        iat_mean = float(np.random.uniform(0.1, 1.5))
        
        records.append({
            'src_port': src_port,
            'dst_port': dst_port,
            'protocol': protocol,
            'flow_duration': round(flow_duration, 2),
            'total_pkts': total_pkts,
            'total_bytes': total_bytes,
            'packet_rate': round(packet_rate, 2),
            'byte_rate': round(byte_rate, 2),
            'fwd_pkts': fwd_pkts,
            'fwd_bytes': fwd_bytes,
            'avg_pkt_size': round(avg_pkt_size, 2),
            'min_pkt_size': min_pkt_size,
            'max_pkt_size': max_pkt_size,
            'tcp_flags': tcp_flags,
            'iat_mean': round(iat_mean, 2),
            'Label': 'DDoS'
        })

    # 3. PortScan flows (approx 100 samples - low pkts per port, high port variety)
    for _ in range(100):
        src_port = int(np.random.randint(1024, 65535))
        dst_port = int(np.random.randint(1, 10000))
        protocol = 'TCP'
        flow_duration = float(np.random.uniform(5, 50))  # Very short duration
        total_pkts = int(np.random.randint(1, 3))
        avg_pkt_size = float(np.random.uniform(40, 60))
        total_bytes = int(total_pkts * avg_pkt_size)
        fwd_pkts = total_pkts
        fwd_bytes = total_bytes
        packet_rate = float(total_pkts / (flow_duration / 1000.0 + 1e-5))
        byte_rate = float(total_bytes / (flow_duration / 1000.0 + 1e-5))
        min_pkt_size = 40
        max_pkt_size = 60
        tcp_flags = int(np.random.choice([2, 0, 1]))  # SYN or NULL or FIN scan
        iat_mean = float(flow_duration / max(1, total_pkts))
        
        records.append({
            'src_port': src_port,
            'dst_port': dst_port,
            'protocol': protocol,
            'flow_duration': round(flow_duration, 2),
            'total_pkts': total_pkts,
            'total_bytes': total_bytes,
            'packet_rate': round(packet_rate, 2),
            'byte_rate': round(byte_rate, 2),
            'fwd_pkts': fwd_pkts,
            'fwd_bytes': fwd_bytes,
            'avg_pkt_size': round(avg_pkt_size, 2),
            'min_pkt_size': min_pkt_size,
            'max_pkt_size': max_pkt_size,
            'tcp_flags': tcp_flags,
            'iat_mean': round(iat_mean, 2),
            'Label': 'PortScan'
        })

    # 4. BruteForce flows (approx 80 samples - repeated SSH/FTP authentication bursts)
    for _ in range(80):
        src_port = int(np.random.randint(1024, 65535))
        dst_port = np.random.choice([22, 21, 3389])
        protocol = 'TCP'
        flow_duration = float(np.random.uniform(300, 1500))
        total_pkts = int(np.random.randint(20, 100))
        avg_pkt_size = float(np.random.uniform(150, 400))
        total_bytes = int(total_pkts * avg_pkt_size)
        fwd_pkts = int(total_pkts * 0.5)
        fwd_bytes = int(total_bytes * 0.5)
        packet_rate = float(total_pkts / (flow_duration / 1000.0))
        byte_rate = float(total_bytes / (flow_duration / 1000.0))
        min_pkt_size = 50
        max_pkt_size = 500
        tcp_flags = 24  # PSH-ACK
        iat_mean = float(np.random.uniform(5, 25))
        
        records.append({
            'src_port': src_port,
            'dst_port': dst_port,
            'protocol': protocol,
            'flow_duration': round(flow_duration, 2),
            'total_pkts': total_pkts,
            'total_bytes': total_bytes,
            'packet_rate': round(packet_rate, 2),
            'byte_rate': round(byte_rate, 2),
            'fwd_pkts': fwd_pkts,
            'fwd_bytes': fwd_bytes,
            'avg_pkt_size': round(avg_pkt_size, 2),
            'min_pkt_size': min_pkt_size,
            'max_pkt_size': max_pkt_size,
            'tcp_flags': tcp_flags,
            'iat_mean': round(iat_mean, 2),
            'Label': 'BruteForce'
        })

    # Shuffle
    df = pd.DataFrame(records)
    df = df.sample(frac=1, random_state=random_state).reset_index(drop=True)
    return df

if __name__ == '__main__':
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'datasets'))
    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.join(out_dir, 'synthetic_unidirectional_flows.csv')
    df = generate_synthetic_flows()
    df.to_csv(csv_path, index=False)
    print(f"Generated synthetic flow dataset with {len(df)} records at: {csv_path}")
