import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHeaderAction } from '../context/HeaderActionContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SlideOver from '../components/SlideOver';
import EmptyState from '../components/EmptyState';
import { 
  Plus, Search, ShoppingCart, Clock, CheckCircle2, 
  XCircle, Package, Truck, Receipt, Printer, FileText,
  Building2, User, ExternalLink, Trash2, Edit2, Info
} from 'lucide-react';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatRelativeTime(date) {
  if (!date) return '—';
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return d.toLocaleDateString('en-IN');
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export default function SalesPage() {
  const { apiFetch } = useAuth();
  const { setAction } = useHeaderAction();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  
  // Details
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  const [form, setForm] = useState({ 
    customer_id: '', order_date: '', po_number: '', remarks: '', status: 'draft', 
    total_amount: 0, tax_amount: 0, discount_amount: 0, items: [] 
  });
  const [editing, setEditing] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [customerFilter, setCustomerFilter] = useState('All');

  useEffect(() => { load(); loadCustomers(); loadProducts(); }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/sales');
      if (res.ok) setData(await res.json());
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadCustomers = async () => {
    try {
      const res = await apiFetch('/api/customers');
      if (res.ok) setCustomers(await res.json());
    } catch(e) { console.error(e); }
  };

  const loadProducts = async () => {
    try {
      const res = await apiFetch('/api/products');
      if (res.ok) setProducts(await res.json());
    } catch(e) { console.error(e); }
  };

  const openCreate = useCallback(() => {
    setForm({ 
      customer_id: '', order_date: new Date().toISOString().split('T')[0], po_number: '', remarks: '', status: 'draft', 
      total_amount: 0, tax_amount: 0, discount_amount: 0, 
      items: [{ 
        product_id: '', quantity: 1, unit_price: '', 
        is_iot_order: false, 
        iot_config: { 
          nozzle_count: 1, dispensing_speed: 21, keyboard_format: '4x6', config_notes: '',
          connectivity: { ethernet: true, wifi: false, gsm_4g: true, gps: true } 
        } 
      }] 
    });
    setError('');
    setEditing(null);
    setModal(true);
  }, []);

  useEffect(() => {
    setAction(
      <button className="btn btn-primary" onClick={openCreate}>
        <Plus size={16} /> New Order
      </button>
    );
    return () => setAction(null);
  }, [setAction, openCreate]);

  const openDetails = async (order) => {
    try {
      const res = await apiFetch(`/api/sales/${order.sales_id}`);
      if (res.ok) {
        setSelectedOrder(await res.json());
        setIsSlideOverOpen(true);
      }
    } catch(e) { console.error(e); }
  };

  const handleCancelOrder = async (e, order) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to cancel Order ${order.sales_id}?`)) return;
    try {
      await apiFetch(`/api/sales/${order.sales_id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ ...order, status: 'cancelled' }) 
      });
      load();
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/sales/${editing}` : '/api/sales';
      await apiFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setModal(false);
      load();
    } catch (err) { setError(err.message); }
  };

  const filteredData = useMemo(() => {
    return data.filter(o => {
      const searchStr = `${o.sales_id} ${o.customer_name} ${o.company_name} ${o.po_number}`.toLowerCase();
      const matchesSearch = !search || searchStr.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
      const matchesCustomer = customerFilter === 'All' || o.customer_name === customerFilter;
      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }, [data, search, statusFilter, customerFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return {
      total: data.length,
      pending: data.filter(o => o.status === 'draft' || o.status === 'confirmed').length,
      fulfilled: data.filter(o => o.status === 'delivered').length,
      revenue: data.filter(o => {
        const d = new Date(o.order_date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && o.status !== 'cancelled';
      }).reduce((sum, o) => sum + (Number(o.net_amount) || 0), 0)
    };
  }, [data]);

  const columns = [
    {
      key: 'sales_id',
      label: 'Order ID',
      render: (val) => <code style={{ fontSize: '13px', fontWeight: 600 }}>ORD-{new Date().getFullYear()}-{val.toString().padStart(3, '0')}</code>
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{val}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{row.company_name}</div>
        </div>
      )
    },
    {
      key: 'items_count',
      label: 'Products',
      render: (val, row) => (
        <span className="items-summary-pill" title="View breakdown in details">
          {row.items?.length || 1} item{row.items?.length > 1 ? 's' : ''}
        </span>
      )
    },
    {
      key: 'order_date',
      label: 'Order Date',
      render: (val) => (
        <span className="relative-date" title={new Date(val).toLocaleDateString()}>
          {formatRelativeTime(val)}
        </span>
      )
    },
    {
      key: 'net_amount',
      label: 'Amount',
      render: (val) => (
        <div style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
          {formatCurrency(val)}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`badge badge-order-${val}`}>
          {val.charAt(0).toUpperCase() + val.slice(1)}
        </span>
      )
    }
  ];

  if (!loading && data.length === 0) {
    return (
      <EmptyState 
        icon={ShoppingCart}
        title="No sales orders yet"
        description="Track customer orders, generated quotes, and fulfillment status for IoT dispenser hardware"
        actionLabel="Create First Order"
        onAction={openCreate}
      />
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Sales Orders</h1>
          <p className="page-subtitle">Track orders, fulfillment status, and revenue</p>
        </div>
      </div>

      <div className="sales-summary-row">
        <div className="sales-stat-card">
          <span className="sales-stat-label">Total Orders</span>
          <span className="sales-stat-value">{stats.total}</span>
        </div>
        <div className="sales-stat-card">
          <span className="sales-stat-label">Pending</span>
          <span className="sales-stat-value" style={{ color: 'var(--color-warning)' }}>{stats.pending}</span>
        </div>
        <div className="sales-stat-card">
          <span className="sales-stat-label">Fulfilled</span>
          <span className="sales-stat-value" style={{ color: 'var(--color-success)' }}>{stats.fulfilled}</span>
        </div>
        <div className="sales-stat-card">
          <span className="sales-stat-label">Monthly Revenue</span>
          <span className="sales-stat-value" style={{ color: 'var(--color-primary)' }}>{formatCurrency(stats.revenue)}</span>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-left">
          <div className="search-container">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by order ID, customer, PO…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-chips">
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">Status: All</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="record-count">{filteredData.length} orders</div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredData}
        onRowClick={(row) => openDetails(row)}
        actions={(row) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-icon" title="View Details" onClick={(e) => { e.stopPropagation(); openDetails(row); }}>
              <ExternalLink size={16} />
            </button>
            <button className="btn-icon" title="Edit Order" onClick={(e) => { e.stopPropagation(); setForm(row); setEditing(row.sales_id); setModal(true); }}>
              <Edit2 size={16} />
            </button>
          </div>
        )}
      />

      <SlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        title="Order Fulfillment Details"
        width="720px"
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary">
              <Printer size={14} style={{ marginRight: '8px' }} /> Print Invoice
            </button>
            <button className="btn btn-secondary">
              <FileText size={14} style={{ marginRight: '8px' }} /> Export PDF
            </button>
            {selectedOrder?.status !== 'delivered' && selectedOrder?.status !== 'cancelled' && (
              <button className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                Mark as Delivered
              </button>
            )}
          </div>
        }
      >
        {selectedOrder && (
          <div className="order-detail-grid">
            <div className="detail-section">
              <div className="detail-section-title">Customer Information</div>
              <div className="linked-item">
                <Building2 size={20} color="#0f4c81" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{selectedOrder.customer_name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{selectedOrder.company_name}</div>
                </div>
                <Link to="/customers" className="btn-icon"><ExternalLink size={16} /></Link>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Order Lifecycle</div>
              <div className="order-timeline">
                <div className={`timeline-event ${['confirmed', 'shipped', 'delivered'].includes(selectedOrder.status) ? 'completed' : ''}`}>
                  <div className="timeline-dot"></div>
                  <span className="timeline-label">Order Created</span>
                  <span className="timeline-time">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
                <div className={`timeline-event ${['shipped', 'delivered'].includes(selectedOrder.status) ? 'completed' : ''}`}>
                  <div className="timeline-dot"></div>
                  <span className="timeline-label">Order Confirmed</span>
                  <span className="timeline-time">Validated by Sales Team</span>
                </div>
                <div className={`timeline-event ${selectedOrder.status === 'delivered' ? 'completed' : ''}`}>
                  <div className="timeline-dot"></div>
                  <span className="timeline-label">Out for Delivery</span>
                  <span className="timeline-time">Hardware leaves facility</span>
                </div>
                <div className={`timeline-event ${selectedOrder.status === 'delivered' ? 'completed' : ''}`}>
                  <div className="timeline-dot"></div>
                  <span className="timeline-label">Delivered & Verified</span>
                  <span className="timeline-time">{selectedOrder.status === 'delivered' ? 'Completed' : 'Pending'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Line Items</div>
              <table className="data-table" style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Product / Hardware</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{item.model_name}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.quantity * item.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'right', border: 'none', padding: '12px 8px 4px' }}>Subtotal</td>
                    <td style={{ textAlign: 'right', border: 'none', padding: '12px 8px 4px' }}>{formatCurrency(selectedOrder.total_amount)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'right', border: 'none', padding: '4px 8px' }}>Tax (GST)</td>
                    <td style={{ textAlign: 'right', border: 'none', padding: '4px 8px' }}>{formatCurrency(selectedOrder.tax_amount)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'right', border: 'none', padding: '4px 8px' }}>Discount</td>
                    <td style={{ textAlign: 'right', border: 'none', padding: '4px 8px', color: '#ef4444' }}>-{formatCurrency(selectedOrder.discount_amount)}</td>
                  </tr>
                  <tr style={{ fontSize: '15px', fontWeight: 700 }}>
                    <td colSpan="3" style={{ textAlign: 'right', border: 'none', padding: '12px 8px' }}>Net Amount</td>
                    <td style={{ textAlign: 'right', border: 'none', padding: '12px 8px', color: 'var(--color-primary)' }}>{formatCurrency(selectedOrder.net_amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </SlideOver>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Sales Order' : 'New Sales Order'} width="640px" error={error}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create Order'}</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select className="form-select" value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})} required>
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Order Date *</label>
            <input className="form-input" type="date" value={form.order_date} onChange={e => setForm({...form, order_date: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">PO Number</label>
            <input className="form-input" value={form.po_number} onChange={e => setForm({...form, po_number: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

