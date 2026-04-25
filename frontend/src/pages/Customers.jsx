import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHeaderAction } from '../context/HeaderActionContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SlideOver from '../components/SlideOver';
import EmptyState from '../components/EmptyState';
import { 
  Plus, Search, Building2, AlertTriangle, 
  ChevronRight, MapPin, Router, Trash2, Edit2, Mail, Phone 
} from 'lucide-react';

const emptyForm = {
  customer_code: '', customer_name: '', company_name: '', contact_person: '',
  mobile_no: '', email: '', address_line1: '', address_line2: '',
  city: '', state: '', country: 'India', pincode: '', gst_no: '', status: 'active',
};

export default function CustomersPage() {
  const { apiFetch } = useAuth();
  const { setAction } = useHeaderAction();
  const [data, setData] = useState([]);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  
  // Selection & Details
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState({ sites: [], devices: [] });
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/customers');
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
  };

  const openCreate = useCallback(() => { 
    setForm(emptyForm); 
    setError(''); 
    setEditing(null); 
    setModal(true); 
  }, []);

  useEffect(() => {
    setAction(
      <button className="btn btn-primary" onClick={openCreate}>
        <Plus size={16} /> Add Customer
      </button>
    );
    return () => setAction(null);
  }, [setAction, openCreate]);

  const openCustomerDetails = async (customer) => {
    setSelectedCustomer(customer);
    setIsSlideOverOpen(true);
    // Fetch associated sites and devices
    try {
      const [sitesRes, devicesRes] = await Promise.all([
        apiFetch(`/api/site-locations?customer_id=${customer.customer_id}`),
        apiFetch(`/api/devices?customer_id=${customer.customer_id}`)
      ]);
      if (sitesRes.ok && devicesRes.ok) {
        setCustomerDetails({
          sites: await sitesRes.json(),
          devices: await devicesRes.json()
        });
      }
    } catch (e) { console.error('Error fetching details:', e); }
  };

  const openEdit = (row) => { 
    setForm(row); 
    setError(''); 
    setEditing(row.customer_id); 
    setModal(true); 
    setIsSlideOverOpen(false);
  };

  const handleDelete = async (row) => {
    if (!confirm(`Deactivate customer "${row.customer_name}"?`)) return;
    await apiFetch(`/api/customers/${row.customer_id}`, { method: 'DELETE' });
    if (isSlideOverOpen) setIsSlideOverOpen(false);
    load();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/customers/${editing}` : '/api/customers';
      await apiFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setModal(false);
      load();
    } catch (e) { setError(e.message); }
  };

  const onChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const filteredData = useMemo(() => {
    return data.filter(c => {
      const matchesSearch = !search || 
        c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.city?.toLowerCase().includes(search.toLowerCase());
      
      const matchesState = stateFilter === 'All' || c.state === stateFilter;
      const matchesCity = cityFilter === 'All' || c.city === cityFilter;
      
      return matchesSearch && matchesState && matchesCity;
    });
  }, [data, search, stateFilter, cityFilter]);

  const states = useMemo(() => ['All', ...new Set(data.map(c => c.state).filter(Boolean))], [data]);
  const cities = useMemo(() => ['All', ...new Set(data.map(c => c.city).filter(Boolean))], [data]);

  const columns = [
    { 
      key: 'customer_code', 
      label: 'Code',
      render: (val) => <span className="code-pill">{val}</span>
    },
    { 
      key: 'customer_name', 
      label: 'Name',
      render: (val, row) => {
        const isIncomplete = !row.gst_no || !row.state;
        const isTest = row.customer_code === '99' || row.customer_name.toLowerCase().includes('shell');
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              className="link-btn" 
              style={{ fontWeight: 600, color: 'var(--color-primary)' }}
              onClick={() => openCustomerDetails(row)}
            >
              {val}
            </button>
            {isTest && <span className="test-tag">Test</span>}
            {isIncomplete && (
              <span className="quality-warning" title="Incomplete record — click to complete">
                <AlertTriangle size={14} />
              </span>
            )}
          </div>
        );
      }
    },
    { key: 'company_name', label: 'Company' },
    { 
      key: 'contact_person', 
      label: 'Contact',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="user-avatar" style={{ width: '24px', height: '24px', fontSize: '9px' }}>
            {val?.split(' ').map(n => n[0]).join('')}
          </div>
          <span>{val || '—'}</span>
        </div>
      )
    },
    { 
      key: 'mobile_no', 
      label: 'Mobile',
      render: (val) => <span className="mono">{val || '—'}</span>
    },
    { 
      key: 'email', 
      label: 'Email',
      render: (val) => val ? <a href={`mailto:${val}`} className="link" style={{ fontSize: '12px' }}>{val}</a> : '—'
    },
    { 
      key: 'location', 
      label: 'Location',
      render: (_, row) => <span style={{ fontSize: '12px' }}>{row.city}{row.state ? `, ${row.state}` : ''}</span>
    },
    { 
      key: 'gst_no', 
      label: 'GST No',
      render: (val) => <span className="mono">{val || '—'}</span>
    },
  ];

  if (data.length === 0) {
    return (
      <EmptyState 
        icon={Building2}
        title="No customers added"
        description="Start building your client directory to manage sites and registrations"
        actionLabel="Add First Customer"
        onAction={openCreate}
      />
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Maintain your B2B client relationships and site profiles</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-left">
          <div className="search-container">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by name, company, or city…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-chips">
            <select className="filter-select" value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
              {states.map(s => <option key={s} value={s}>{s === 'All' ? 'State: All' : s}</option>)}
            </select>
            <select className="filter-select" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
              {cities.map(c => <option key={c} value={c}>{c === 'All' ? 'City: All' : c}</option>)}
            </select>
          </div>
        </div>
        <div className="record-count">{filteredData.length} customers</div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredData} 
        onEdit={openEdit} 
        onDelete={handleDelete}
        rowIdKey="customer_id"
      />

      {/* Slide-Over Panel */}
      <SlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => setIsSlideOverOpen(false)}
        title="Customer Details"
        width="600px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => openEdit(selectedCustomer)}>
              <Edit2 size={14} /> Edit
            </button>
            <button className="btn btn-danger" onClick={() => handleDelete(selectedCustomer)}>
              <Trash2 size={14} /> Deactivate
            </button>
          </>
        }
      >
        {selectedCustomer && (
          <div className="customer-detail-content">
            <div className="detail-section">
              <div className="detail-section-title">General Information</div>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="expansion-field">
                  <span className="expansion-label">Code</span>
                  <span className="code-pill">{selectedCustomer.customer_code}</span>
                </div>
                <div className="expansion-field">
                  <span className="expansion-label">Status</span>
                  <span className={`badge ${selectedCustomer.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                    {selectedCustomer.status}
                  </span>
                </div>
                <div className="expansion-field">
                  <span className="expansion-label">Company</span>
                  <span className="expansion-value">{selectedCustomer.company_name || '—'}</span>
                </div>
                <div className="expansion-field">
                  <span className="expansion-label">GST Number</span>
                  <span className="mono">{selectedCustomer.gst_no || '—'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Contact & Location</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} color="#64748b" />
                  <span className="expansion-value">{selectedCustomer.email || '—'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} color="#64748b" />
                  <span className="expansion-value mono">{selectedCustomer.mobile_no || '—'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <MapPin size={14} color="#64748b" style={{ marginTop: '2px' }} />
                  <span className="expansion-value">
                    {selectedCustomer.address_line1}<br/>
                    {selectedCustomer.address_line2 && <>{selectedCustomer.address_line2}<br/></>}
                    {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pincode}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Associated Site Locations ({customerDetails.sites.length})</div>
              {customerDetails.sites.length > 0 ? (
                customerDetails.sites.map(site => (
                  <div key={site.site_location_id} className="linked-item">
                    <div className="linked-item-info">
                      <span className="linked-item-title">{site.site_name}</span>
                      <span className="linked-item-sub">{site.city}, {site.state}</span>
                    </div>
                    <ChevronRight size={14} color="#94a3b8" />
                  </div>
                ))
              ) : <div style={{ fontSize: '12px', color: '#94a3b8' }}>No sites registered</div>}
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Field Devices ({customerDetails.devices.length})</div>
              {customerDetails.devices.length > 0 ? (
                customerDetails.devices.map(dev => (
                  <div key={dev.device_id} className="linked-item">
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <Router size={16} color="#0f4c81" />
                      <div className="linked-item-info">
                        <span className="linked-item-title">{dev.serial_number}</span>
                        <span className="linked-item-sub">{dev.model_name} • {dev.device_uid.substring(0, 8)}</span>
                      </div>
                    </div>
                    <span className={`badge ${dev.status === 'online' ? 'badge-active' : 'badge-inactive'}`} style={{ fontSize: '10px' }}>
                      {dev.status}
                    </span>
                  </div>
                ))
              ) : <div style={{ fontSize: '12px', color: '#94a3b8' }}>No devices registered</div>}
            </div>
          </div>
        )}
      </SlideOver>

      <Modal 
        isOpen={modal} 
        onClose={() => setModal(false)} 
        title={editing ? 'Edit Customer' : 'New Customer'} 
        width="640px" 
        error={error}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Customer Code</label>
            <input className="form-input" value={form.customer_code} onChange={e => onChange('customer_code', e.target.value)} placeholder="e.g. C-RFP-001" />
          </div>
          <div className="form-group">
            <label className="form-label">Customer Name *</label>
            <input className="form-input" value={form.customer_name} onChange={e => onChange('customer_name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input className="form-input" value={form.company_name} onChange={e => onChange('company_name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Person</label>
            <input className="form-input" value={form.contact_person} onChange={e => onChange('contact_person', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Mobile</label>
            <input className="form-input" value={form.mobile_no} onChange={e => onChange('mobile_no', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => onChange('email', e.target.value)} />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Address Line 1</label>
            <input className="form-input" value={form.address_line1} onChange={e => onChange('address_line1', e.target.value)} />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Address Line 2</label>
            <input className="form-input" value={form.address_line2 || ''} onChange={e => onChange('address_line2', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-input" value={form.city} onChange={e => onChange('city', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <input className="form-input" value={form.state} onChange={e => onChange('state', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Pincode</label>
            <input className="form-input" value={form.pincode} onChange={e => onChange('pincode', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">GST No</label>
            <input className="form-input" value={form.gst_no} onChange={e => onChange('gst_no', e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

