import React from 'react';

const StatCard = ({ title, value, subtext, icon: Icon, type = 'normal' }) => {
  return (
    <div className={`stat-card stat-${type}`}>
      <div className="stat-info">
        <span className="stat-label">{title}</span>
        <span className="stat-value">{value}</span>
        {subtext && <span className="stat-subtext">{subtext}</span>}
      </div>
      {Icon && (
        <div className="stat-icon">
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
