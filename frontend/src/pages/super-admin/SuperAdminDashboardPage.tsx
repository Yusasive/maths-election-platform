import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Admin {
  _id: string; name: string; email: string; status: 'pending' | 'approved' | 'declined'; createdAt: string;
}
interface Election {
  _id: string; slug: string; title: string; status: string; adminId: string; createdAt: string;
}

export default function SuperAdminDashboardPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    Promise.all([
      fetch(`${API_URL}/api/admin/super/admins`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API_URL}/api/elections/all`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([a, e]) => { setAdmins(Array.isArray(a) ? a : []); setElections(Array.isArray(e) ? e : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pending = admins.filter((a) => a.status === 'pending');

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Super Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform-wide overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Admins', value: admins.length, color: 'text-gray-800' },
          { label: 'Pending Approval', value: pending.length, color: 'text-yellow-600' },
          { label: 'Total Elections', value: elections.length, color: 'text-indigo-600' },
          { label: 'Active Elections', value: elections.filter((e) => e.status === 'active').length, color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Admins Alert */}
      {pending.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-yellow-800">
              {pending.length} admin registration{pending.length > 1 ? 's are' : ' is'} waiting for your approval
            </p>
          </div>
          <Link to="/super-admin/admins" className="text-sm font-semibold text-yellow-700 hover:text-yellow-900">
            Review
          </Link>
        </div>
      )}

      {/* Recent elections */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">Recent Elections</h3>
          <Link to="/super-admin/elections" className="text-xs text-indigo-600 hover:underline">View all</Link>
        </div>
        {elections.slice(0, 5).length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No elections yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {elections.slice(0, 5).map((e) => (
              <div key={e._id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{e.title}</p>
                  <p className="text-xs text-gray-400 font-mono">/{e.slug}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  e.status === 'active' ? 'bg-green-100 text-green-700' :
                  e.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {e.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
