import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, Edit, Trash2, Eye } from 'lucide-react';

export default function DataTable({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  searchable = true,
  selectable = false,
  onSelectionChange,
  expandable = false,
  renderExpansion,
  pageSize = 10,
  rowIdKey = 'id'
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(sorted.map(row => row[rowIdKey]));
      setSelectedIds(allIds);
      onSelectionChange && onSelectionChange(Array.from(allIds));
    } else {
      setSelectedIds(new Set());
      onSelectionChange && onSelectionChange([]);
    }
  };

  const handleSelectRow = (e, id) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (e.target.checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
    onSelectionChange && onSelectionChange(Array.from(next));
  };

  const toggleExpand = (id) => {
    if (!expandable) return;
    setExpandedId(expandedId === id ? null : id);
  };

  const getBadgeClass = (val, colKey) => {
    if (val === null || val === undefined) return '';
    const v = String(val).toLowerCase();
    
    if (colKey === 'role_name' || colKey === 'role') {
      if (v === 'admin') return 'badge badge-admin';
      if (v === 'engineer') return 'badge badge-engineer';
      if (v === 'sales') return 'badge badge-sales';
      if (v === 'technician') return 'badge badge-technician';
    }

    if (v === 'active' || v === 'true' || v === 'yes' || v === 'confirmed') return 'badge badge-active';
    if (v === 'inactive' || v === 'false' || v === 'no' || v === 'cancelled') return 'badge badge-inactive';
    if (v === 'pending') return 'badge badge-pending';
    return 'badge';
  };

  const formatCell = (col, row) => {
    const val = row[col.key];
    if (col.render) return col.render(val, row);
    
    if (val === null || val === undefined) return '—';

    // UUID Handling
    const isUuid = typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    if (isUuid) {
      return (
        <div className="uuid-cell" title="Click to copy" onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(val);
        }}>
          {val.substring(0, 8)}
          <span className="uuid-tooltip">{val}</span>
        </div>
      );
    }

    if (col.badge || col.key === 'role_name' || col.key === 'role' || col.type === 'boolean') {
      const displayVal = col.type === 'boolean' ? (val ? 'Active' : 'Inactive') : val;
      const cls = getBadgeClass(val, col.key);
      return <span className={cls}>{String(displayVal)}</span>;
    }
    
    if (col.type === 'date' || col.type === 'datetime') {
      try {
        const opts = col.type === 'datetime' ? { hour: '2-digit', minute: '2-digit' } : {};
        return new Date(val).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', ...opts });
      } catch { return val; }
    }
    
    if (col.type === 'currency') return `₹${Number(val).toLocaleString('en-IN')}`;
    
    return String(val);
  };

  return (
    <div className="table-container">
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {selectable && (
                <th className="checkbox-cell">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={sorted.length > 0 && selectedIds.size === sorted.length}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={sortKey === col.key ? 'sorted' : ''}
                  onClick={() => handleSort(col.key)}
                  style={{ width: col.width }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {col.label}
                    {sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    )}
                  </span>
                </th>
              ))}
              {(onEdit || onDelete || onView) && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + 1} style={{ textAlign: 'center', padding: 48 }}>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>No records found</div>
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => {
                const id = row[rowIdKey];
                const isExpanded = expandedId === id;
                return (
                  <React.Fragment key={id || idx}>
                    <tr 
                      className={isExpanded ? 'expanded' : ''} 
                      onClick={() => toggleExpand(id)}
                      style={{ cursor: expandable ? 'pointer' : 'default' }}
                    >
                      {selectable && (
                        <td className="checkbox-cell">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.has(id)}
                            onChange={(e) => handleSelectRow(e, id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key}>{formatCell(col, row)}</td>
                      ))}
                      {(onEdit || onDelete || onView) && (
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            {onView && (
                              <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onView(row); }} aria-label="View">
                                <Eye size={16} />
                              </button>
                            )}
                            {onEdit && (
                              <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onEdit(row); }} aria-label="Edit">
                                <Edit size={16} />
                              </button>
                            )}
                            {onDelete && (
                              <button className="btn-icon danger" onClick={(e) => { e.stopPropagation(); onDelete(row); }} aria-label="Delete">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {isExpanded && renderExpansion && (
                      <tr className="expansion-row">
                        <td colSpan={columns.length + (selectable ? 1 : 0) + 1}>
                          <div className="expansion-content">
                            {renderExpansion(row)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="table-pagination">
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="pagination-btns">
            <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Prev
            </button>
            <button className="pagination-btn active">{page}</button>
            <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
