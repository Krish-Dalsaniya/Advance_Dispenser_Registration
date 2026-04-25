import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function StatsCard({ label, value, icon: Icon, trend, path }) {
  const navigate = useNavigate();

  const getTrendColor = () => {
    if (!trend || trend === 0) return '#6b7280'; // gray
    return trend > 0 ? '#10b981' : '#e85d24'; // green / red
  };

  const getTrendIcon = () => {
    if (!trend || trend === 0) return '—';
    return trend > 0 ? '▲' : '▼';
  };

  return (
    <div 
      className="stat-card" 
      onClick={() => path && navigate(path)}
      style={{ cursor: path ? 'pointer' : 'default' }}
    >
      <div className="stat-card-header">
        <div className="stat-card-icon">
          {Icon && <Icon size={20} color="#0f4c81" />}
        </div>
        {trend !== undefined && (
          <div className="stat-trend" style={{ color: getTrendColor() }}>
            <span style={{ fontSize: '10px', marginRight: '2px' }}>{getTrendIcon()}</span>
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      <div className="stat-card-body">
        <div className="stat-value">{value ?? 0}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
