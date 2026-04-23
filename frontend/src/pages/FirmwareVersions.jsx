import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { CheckCircle } from 'lucide-react';

const columns = [
  { key: 'version_string', label: 'Version String' },
  { key: 'product_name', label: 'Product' },
  { key: 'nozzle_count', label: 'Nozzles' },
  { key: 'dispensing_speed', label: 'Speed' },
  { key: 'is_stable', label: 'Stable', type: 'boolean' },
  { key: 'created_at', label: 'Created', type: 'datetime' },
];

export default function FirmwareVersionsPage() {
  const { apiFetch } = useAuth();
  const [data, setData] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/firmware-versions');
      if (res.ok) setData(await res.json());
    } catch(e) { console.error(e); }
  };

  const handleMarkStable = async (row) => {
    if (row.is_stable) return;
    if (!confirm(`Mark version ${row.version_string} as STABLE?`)) return;
    
    try {
      const res = await apiFetch(`/api/firmware-versions/${row.firmware_version_id}/stable`, { method: 'PATCH' });
      if (res.ok) load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Firmware Versions</h1>
          <p className="page-subtitle">Automatically generated firmware builds for IoT configurations</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <DataTable 
        columns={columns} 
        data={data} 
        actions={(row) => (
          !row.is_stable && (
            <button className="btn btn-secondary btn-sm" title="Mark as Stable" onClick={() => handleMarkStable(row)}>
              <CheckCircle size={14} /> Stable
            </button>
          )
        )}
      />
    </div>
  );
}
