export default function StatsCard({ label, value, icon: Icon, color = 'blue' }) {
  return (
    <div className={`stat-card ${color} animate-in`}>
      <div className={`stat-icon ${color}`}>
        <Icon size={20} />
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value ?? 0}</div>
      </div>
    </div>
  );
}
