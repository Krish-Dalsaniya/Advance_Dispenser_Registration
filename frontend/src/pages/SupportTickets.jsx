import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Send, MessagesSquare } from 'lucide-react';

const columns = [
  { key: 'ticket_no', label: 'Ticket No' },
  { key: 'subject', label: 'Subject' },
  { key: 'customer_name', label: 'Customer' },
  { key: 'priority', label: 'Priority', badge: true },
  { key: 'status', label: 'Status', badge: true },
  { key: 'assigned_to_name', label: 'Assigned To' }
];

const emptyForm = {
  customer_id: '', device_id: '', project_id: '', assigned_to_user_id: '',
  subject: '', issue_category: 'hardware', priority: 'medium', issue_description: ''
};

export default function SupportTicketsPage() {
  const { apiFetch, user } = useAuth();
  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Modals state
  const [createModal, setCreateModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  
  const [form, setForm] = useState(emptyForm);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [error, setError] = useState('');
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => { 
    loadTickets();
    loadCustomers();
    loadUsers();
  }, []);

  useEffect(() => {
    if (detailModal && selectedTicket) {
      loadChat(selectedTicket.ticket_id);
    } else {
      setChatMessages([]);
    }
  }, [detailModal, selectedTicket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadTickets = async () => {
    try {
      const res = await apiFetch('/api/support-tickets');
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadCustomers = async () => {
    try {
      const res = await apiFetch('/api/customers');
      if (res.ok) setCustomers(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadUsers = async () => {
    try {
      const res = await apiFetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadChat = async (ticket_id) => {
    try {
      const res = await apiFetch(`/api/chat/ticket/${ticket_id}`);
      if (res.ok) {
        const chatData = await res.json();
        setChatMessages(chatData.messages);
      }
    } catch (e) { console.error(e); }
  };

  const openCreate = () => { setForm(emptyForm); setError(''); setCreateModal(true); };
  const openDetail = (row) => { setSelectedTicket(row); setError(''); setDetailModal(true); };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/support-tickets', { method: 'POST', body: JSON.stringify(form) });
      setCreateModal(false);
      loadTickets();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleUpdateStatus = async (status) => {
    if(!selectedTicket) return;
    try {
      await apiFetch(`/api/support-tickets/${selectedTicket.ticket_id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ ...selectedTicket, status }) 
      });
      setDetailModal(false);
      loadTickets();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if(!newMessage.trim() || !selectedTicket) return;
    try {
      await apiFetch(`/api/chat/ticket/${selectedTicket.ticket_id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message_text: newMessage })
      });
      setNewMessage('');
      loadChat(selectedTicket.ticket_id);
    } catch(e) { console.error(e) }
  };

  const onChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Support Tickets</h1>
          <p className="page-subtitle">Track and resolve customer issues</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Ticket</button>
      </div>

      <DataTable columns={columns} data={data} onEdit={openDetail} editIcon={<MessagesSquare size={16} />} editLabel="View" />

      {/* CREATE MODAL */}
      <Modal 
        isOpen={createModal} 
        onClose={() => setCreateModal(false)} 
        title="Create Support Ticket" 
        width="600px" 
        error={error}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreateSubmit}>Submit Ticket</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label">Customer *</label>
            <select className="form-input" value={form.customer_id} onChange={e => onChange('customer_id', e.target.value)} required>
              <option value="">-- Select Customer --</option>
              {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>)}
            </select>
          </div>
          <div className="form-group full-width">
            <label className="form-label">Subject *</label>
            <input className="form-input" value={form.subject} onChange={e => onChange('subject', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-input" value={form.priority} onChange={e => onChange('priority', e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assign To</label>
            <select className="form-input" value={form.assigned_to_user_id} onChange={e => onChange('assigned_to_user_id', e.target.value)}>
              <option value="">-- Unassigned --</option>
              {users.map(u => <option key={u.user_id} value={u.user_id}>{u.username}</option>)}
            </select>
          </div>
          <div className="form-group full-width">
            <label className="form-label">Issue Description</label>
            <textarea className="form-input" rows="4" value={form.issue_description} onChange={e => onChange('issue_description', e.target.value)}></textarea>
          </div>
        </div>
      </Modal>

      {/* DETAIL AND CHAT MODAL */}
      <Modal 
        isOpen={detailModal} 
        onClose={() => setDetailModal(false)} 
        title={`Ticket: ${selectedTicket?.ticket_no}`} 
        width="900px" 
        error={error}
      >
        {selectedTicket && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '24px', height: '600px' }}>
            
            {/* Left: Ticket Info */}
            <div style={{ background: 'var(--bg-glass)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>{selectedTicket.subject}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>{selectedTicket.issue_description}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                <div><strong>Status:</strong> <span className={`badge ${selectedTicket.status === 'open' ? 'badge-primary' : (selectedTicket.status === 'resolved' ? 'badge-success' : 'badge-neutral')}`}>{selectedTicket.status}</span></div>
                <div><strong>Priority:</strong> <span className="badge badge-warning">{selectedTicket.priority}</span></div>
                <div><strong>Customer:</strong> {selectedTicket.customer_name}</div>
                <div><strong>Created By:</strong> {selectedTicket.created_by_name}</div>
                <div><strong>Assigned To:</strong> {selectedTicket.assigned_to_name || 'Unassigned'}</div>
                <div><strong>Opened At:</strong> {new Date(selectedTicket.opened_at).toLocaleString()}</div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selectedTicket.status !== 'resolved' && (
                  <button className="btn btn-primary" style={{ flex: 1, padding: '8px' }} onClick={() => handleUpdateStatus('resolved')}>Mark Resolved</button>
                )}
                {selectedTicket.status !== 'closed' && (
                  <button className="btn btn-secondary" style={{ flex: 1, padding: '8px' }} onClick={() => handleUpdateStatus('closed')}>Close Ticket</button>
                )}
              </div>
            </div>

            {/* Right: Chat Window */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)', fontWeight: '600' }}>
                Conversation History
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {chatMessages.map(msg => {
                  const isMine = msg.user_id === user.user_id;
                  return (
                    <div key={msg.message_id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        {msg.sender_user_name} • {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ 
                        background: isMine ? 'var(--accent-blue)' : 'var(--bg-glass)', 
                        color: isMine ? '#fff' : 'var(--text-primary)',
                        padding: '10px 14px', 
                        borderRadius: 'var(--radius-md)', 
                        maxWidth: '80%',
                        fontSize: '0.85rem'
                      }}>
                        {msg.message_text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: '12px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-color)', gap: '8px' }}>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text-primary)' }}
                />
                <button type="submit" disabled={!newMessage.trim()} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                  <Send size={16} />
                </button>
              </form>
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
}
