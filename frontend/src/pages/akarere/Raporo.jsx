// ============================================================
// Raporo Page - District Reports & Export
// ============================================================
import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Download, BarChart3, Calendar } from 'lucide-react';

export default function RaporoPage() {
  const [itariki_itangira, setItangira] = useState('');
  const [itariki_irangira, setIrangira] = useState('');
  const [isExporting, setExporting]     = useState(false);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (itariki_itangira) params.append('itariki_itangira', itariki_itangira);
      if (itariki_irangira) params.append('itariki_irangira', itariki_irangira);

      const res = await api.get(`/raporo/export?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `raporo-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Raporo yoherejwe neza!');
    } catch {
      toast.error('Ikibazo mu kohereza raporo.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-600" />
          Kohereza Raporo (CSV)
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Itariki Itangira</label>
            <input type="date" value={itariki_itangira} onChange={e => setItangira(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Itariki Irangira</label>
            <input type="date" value={itariki_irangira} onChange={e => setIrangira(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <button onClick={exportCSV} disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2.5 bg-rwanda-dark hover:bg-blue-900 text-white rounded-xl text-sm font-medium transition disabled:opacity-60">
            <Download size={16} />
            {isExporting ? 'Gutuma...' : 'Kohereza CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
