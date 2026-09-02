import React from 'react';
import { ShieldCheck, Cpu, Database } from 'lucide-react';

const Header = ({ title, activeModel, datasetName }) => {
  return (
    <header className="top-header">
      <div className="header-page-title">
        <ShieldCheck className="text-cyan-400" size={24} />
        <span>{title}</span>
      </div>

      <div className="header-badges">
        <span className="badge badge-cyan">
          <Cpu size={14} />
          Active Model: {activeModel || 'Random Forest'}
        </span>
        <span className="badge badge-normal">
          <Database size={14} />
          Dataset: {datasetName || 'Synthetic Flows'}
        </span>
      </div>
    </header>
  );
};

export default Header;
