import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Election {
  _id: string; slug: string; title: string; description: string;
  status: string; adminId: string; votingStartTime: string; votingEndTime: string; createdAt: string;
}

export default function SuperAdminElectionsPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('adminToken') || '';

  useEffect(() => {
    fetch(`${API_URL}/api/elections/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setElections(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    draft: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-gray-100 text-gray-500',
  };

  const counts = {
    total: elections.length,
    active: elections.filter((e) => e.status === 'active').length,
    draft: elections.filter((e) => e.status === 'draft').length,
    closed: elections.filter((e) => e.status === 'closed').length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">All Elections</h1>
        <p className="text-sm text-gray-500 mt-1">Platform-wide view of all elections</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: counts.total, color: 'text-gray-800' },
          { label: 'Active', value: counts.active, color: 'text-green-600' },
          { label: 'Draft', value: counts.draft, color: 'text-yellow-600' },
          { label: 'Closed', value: counts.closed, color: 'text-gray-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      )}

      {!loading && elections.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-sm text-gray-400">
          No elections created yet.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {elections.map((e, i) => (
          <div key={e._id} className={`px-4 sm:px-5 py-4 flex items-start sm:items-center gap-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/vote/${e.slug}`}
                  target="_blank"
                  className="font-semibold text-gray-800 hover:text-indigo-600 transition"
                >
                  {e.title}
                </Link>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor[e.status] || 'bg-gray-100 text-gray-500'}`}>
                  {e.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">/vote/{e.slug}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(e.votingStartTime).toLocaleDateString()} – {new Date(e.votingEndTime).toLocaleDateString()}
              </p>
            </div>
            <div className="flex-shrink-0">
              <a
                href={`/vote/${e.slug}/results`}
                target="_blank"
                className="text-xs border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 px-3 py-1.5 rounded-lg transition"
              >
                Results
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
