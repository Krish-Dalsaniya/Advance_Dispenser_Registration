import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Fuel, Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react';

import logo from '../assets/logo.png';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    mobile_no: '',
    role_id: 'ROLE-002', // Default: Engineer
    department: '',
    designation: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }

      // Success - redirect to login
      alert('Registration successful! Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '500px' }}>
        <Link to="/login" className="back-link" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20, textDecoration: 'none' }}>
           <ArrowLeft size={14} /> Back to Login
        </Link>
        <div className="login-logo">
          <img src={logo} alt="Leons CRM" className="login-logo-img" />
          <p>Create your account to get started</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Username *</label>
              <input
                name="username"
                className="form-input"
                type="text"
                placeholder="Unique username"
                value={form.username}
                onChange={onChange}
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  name="password"
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={onChange}
                  style={{ width: '100%', paddingRight: 40 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                name="first_name"
                className="form-input"
                type="text"
                value={form.first_name}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                name="last_name"
                className="form-input"
                type="text"
                value={form.last_name}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                name="email"
                className="form-input"
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                name="mobile_no"
                className="form-input"
                type="text"
                value={form.mobile_no}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                name="department"
                className="form-input"
                type="text"
                value={form.department}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role *</label>
              <select 
                name="role_id" 
                className="form-select" 
                value={form.role_id} 
                onChange={onChange}
                required
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', padding: '8px 10px' }}
              >
                <option value="ROLE-001">Admin</option>
                <option value="ROLE-002">Engineer</option>
                <option value="ROLE-003">Sales</option>
                <option value="ROLE-004">Technician</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 20 }}>
            {loading ? 'Processing...' : 'Complete Registration'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 25, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
      <style>{`
        .back-link:hover { color: var(--text-primary) !important; }
      `}</style>
    </div>
  );
}
