import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, Building2, Bell, ShieldCheck, Link2, 
  CreditCard, Camera, LogOut, CheckCircle2,
  Lock, Smartphone, Globe, Mail, Save, AlertCircle, X
} from 'lucide-react';

export default function SettingsPage() {
  const { user, apiFetch } = useAuth();
  const [activeCategory, setActiveCategory] = useState('profile');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // State for different sections
  const [profileForm, setProfileForm] = useState({
    full_name: user?.first_name ? `${user.first_name} ${user.last_name}` : '',
    username: user?.username || '',
    email: user?.email || '',
    mobile: user?.mobile_no || '',
    designation: user?.designation || '',
    department: user?.department || ''
  });

  const [companyForm, setCompanyForm] = useState({
    company_name: '', gst_number: '', address: '', city: '', state: '', pincode: ''
  });

  const [notifications, setNotifications] = useState({
    device_reg: { email: true, app: true },
    ota_status: { email: true, app: true },
    low_inventory: { email: false, app: true },
    support_ticket: { email: true, app: true },
    order_updates: { email: false, app: false }
  });

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
    { id: 'billing', label: 'Billing', icon: CreditCard }
  ];

  const handleInputChange = (setter, field, value) => {
    setter(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    setHasUnsavedChanges(false);
    // Logic for save API
  };

  // Profile completion logic
  const completionCount = [
    profileForm.full_name, profileForm.mobile, 
    companyForm.company_name, companyForm.gst_number
  ].filter(Boolean).length;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Personalize your experience and manage organizational identity</p>
        </div>
        {hasUnsavedChanges && (
          <div className="unsaved-indicator">
            <div className="unsaved-dot-pulse"></div>
            <span>Unsaved changes</span>
          </div>
        )}
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar-nav">
          {sections.map(s => (
            <div 
              key={s.id} 
              className={`settings-nav-pill ${activeCategory === s.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(s.id)}
            >
              <s.icon size={20} />
              <span>{s.label}</span>
            </div>
          ))}
        </aside>

        <main className="settings-panel">
          {/* Profile Completion Tracker */}
          <div className="profile-completion-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>COMPLETE YOUR PROFILE</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>{completionCount} OF 4 COMPLETE</span>
            </div>
            <div className="completion-bar-outer">
              <div className="completion-bar-inner" style={{ width: `${(completionCount/4)*100}%` }}></div>
            </div>
          </div>

          <div className="settings-content-wrapper">
            {activeCategory === 'profile' && (
              <div className="fade-in">
                <div className="settings-group">
                  <h3 style={{ marginBottom: '24px', fontFamily: 'DM Serif Display', fontSize: '20px' }}>Personal Profile</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                    <div className="welcome-avatar" style={{ width: '80px', height: '80px', borderRadius: '24px', fontSize: '32px' }}>
                      {profileForm.full_name?.[0] || 'U'}
                    </div>
                    <div>
                      <button className="btn btn-secondary btn-sm" style={{ marginBottom: '8px' }}>
                        <Camera size={14} style={{ marginRight: '8px' }} /> Upload New Photo
                      </button>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>JPG, GIF or PNG. Max size of 800K</p>
                    </div>
                  </div>

                  <div className="form-grid" style={{ gap: '24px' }}>
                    <div className="form-group">
                      <label className="settings-label-above">Full Name</label>
                      <input 
                        className="settings-input-h40" 
                        value={profileForm.full_name} 
                        onChange={e => handleInputChange(setProfileForm, 'full_name', e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="settings-label-above">Email Address (Locked)</label>
                      <input className="settings-input-h40" value={profileForm.email} readOnly style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label className="settings-label-above">Username</label>
                      <input 
                        className="settings-input-h40" 
                        value={profileForm.username} 
                        onChange={e => handleInputChange(setProfileForm, 'username', e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="settings-label-above">Mobile Number</label>
                      <input 
                        className="settings-input-h40" 
                        value={profileForm.mobile} 
                        onChange={e => handleInputChange(setProfileForm, 'mobile', e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="settings-label-above">Designation</label>
                      <input 
                        className="settings-input-h40" 
                        value={profileForm.designation} 
                        onChange={e => handleInputChange(setProfileForm, 'designation', e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="settings-label-above">Department</label>
                      <input 
                        className="settings-input-h40" 
                        value={profileForm.department} 
                        onChange={e => handleInputChange(setProfileForm, 'department', e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'company' && (
              <div className="fade-in">
                <div className="settings-group">
                  <h3 style={{ marginBottom: '24px', fontFamily: 'DM Serif Display', fontSize: '20px' }}>Company Information</h3>
                  <div className="form-grid" style={{ gap: '24px' }}>
                    <div className="form-group full-width">
                      <label className="settings-label-above">Legal Company Name</label>
                      <input 
                        className="settings-input-h40" 
                        value={companyForm.company_name} 
                        onChange={e => handleInputChange(setCompanyForm, 'company_name', e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="settings-label-above">GST Registration Number</label>
                      <input 
                        className="settings-input-h40" 
                        value={companyForm.gst_number} 
                        onChange={e => handleInputChange(setCompanyForm, 'gst_number', e.target.value)} 
                      />
                    </div>
                    <div className="form-group full-width">
                      <label className="settings-label-above">Corporate Address</label>
                      <input 
                        className="settings-input-h40" 
                        value={companyForm.address} 
                        onChange={e => handleInputChange(setCompanyForm, 'address', e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="settings-label-above">City</label>
                      <input 
                        className="settings-input-h40" 
                        value={companyForm.city} 
                        onChange={e => handleInputChange(setCompanyForm, 'city', e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="settings-label-above">State</label>
                      <input 
                        className="settings-input-h40" 
                        value={companyForm.state} 
                        onChange={e => handleInputChange(setCompanyForm, 'state', e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'notifications' && (
              <div className="fade-in">
                <div className="settings-group">
                  <h3 style={{ marginBottom: '24px', fontFamily: 'DM Serif Display', fontSize: '20px' }}>Notification Center</h3>
                  <div className="notification-toggle-grid" style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>EVENT TYPE</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textAlign: 'center' }}>EMAIL</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textAlign: 'center' }}>IN-APP</span>
                  </div>
                  {[
                    { id: 'device_reg', label: 'New Device Registration', desc: 'When a new dispenser is added' },
                    { id: 'ota_status', label: 'OTA Update Status', desc: 'Success/Failure of deployments' },
                    { id: 'low_inventory', label: 'Low Inventory Alert', desc: 'Stock drops below 10%' },
                    { id: 'support_ticket', label: 'Support Ticket', desc: 'New customer incidents' },
                    { id: 'order_updates', label: 'Sales Order Status', desc: 'Fulfillment milestones' }
                  ].map(item => (
                    <div key={item.id} className="notification-toggle-grid">
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{item.label}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{item.desc}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div 
                          className={`switch-toggle ${notifications[item.id].email ? 'active' : ''}`}
                          onClick={() => {
                            const val = !notifications[item.id].email;
                            setNotifications(prev => ({ ...prev, [item.id]: { ...prev[item.id], email: val } }));
                            setHasUnsavedChanges(true);
                          }}
                        >
                          <div className="switch-handle"></div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div 
                          className={`switch-toggle ${notifications[item.id].app ? 'active' : ''}`}
                          onClick={() => {
                            const val = !notifications[item.id].app;
                            setNotifications(prev => ({ ...prev, [item.id]: { ...prev[item.id], app: val } }));
                            setHasUnsavedChanges(true);
                          }}
                        >
                          <div className="switch-handle"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeCategory === 'security' && (
              <div className="fade-in">
                <div className="settings-group">
                  <h3 style={{ marginBottom: '24px', fontFamily: 'DM Serif Display', fontSize: '20px' }}>Access Control</h3>
                  <div className="form-grid" style={{ gap: '24px', maxWidth: '400px', marginBottom: '40px' }}>
                    <div className="form-group full-width">
                      <label className="settings-label-above">Current Password</label>
                      <input className="settings-input-h40" type="password" placeholder="••••••••" />
                    </div>
                    <div className="form-group full-width">
                      <label className="settings-label-above">New Password</label>
                      <input className="settings-input-h40" type="password" placeholder="Min. 8 characters" />
                    </div>
                    <div className="form-group full-width">
                      <label className="settings-label-above">Confirm Password</label>
                      <input className="settings-input-h40" type="password" />
                    </div>
                  </div>

                  <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <Smartphone size={24} color="#15803d" />
                      <div>
                        <div style={{ fontWeight: 600, color: '#14532d' }}>Two-Factor Authentication</div>
                        <div style={{ fontSize: '12px', color: '#166534' }}>Add an extra layer of security to your account.</div>
                      </div>
                    </div>
                    <button className="btn btn-primary btn-sm">Enable 2FA</button>
                  </div>
                </div>

                <div className="settings-group">
                  <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Active Sessions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="linked-item" style={{ background: '#f8fafc', padding: '16px' }}>
                      <Globe size={20} color="#0f4c81" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>Chrome on Windows 11 (Current)</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Surat, India • 192.168.1.1</div>
                      </div>
                      <span className="badge badge-success" style={{ fontSize: '10px' }}>ACTIVE NOW</span>
                    </div>
                    <div className="linked-item" style={{ padding: '16px' }}>
                      <Smartphone size={20} color="#64748b" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>iPhone 15 Pro</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Mumbai, India • 2 days ago</div>
                      </div>
                      <button className="btn-icon" style={{ color: '#ef4444' }}><LogOut size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'integrations' && (
              <div className="fade-in">
                <div style={{ padding: '80px 0', textAlign: 'center' }}>
                  <Link2 size={48} color="#e2e8f0" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontFamily: 'DM Serif Display', fontSize: '24px' }}>No active integrations</h3>
                  <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '300px', margin: '0 auto 24px' }}>
                    Connect external services like Slack, WhatsApp or AWS IoT Core to your dashboard.
                  </p>
                  <button className="btn btn-secondary">Explore Integrations</button>
                </div>
              </div>
            )}
          </div>

          <div className="settings-footer-sticky">
            <button className="btn btn-secondary" onClick={() => setHasUnsavedChanges(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={16} style={{ marginRight: '8px' }} /> Save Changes
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
