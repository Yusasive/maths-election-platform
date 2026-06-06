import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { usePageTitle } from '../../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Election {
  _id: string;
  slug: string;
  title: string;
  description: string;
  logoUrl?: string;
  status: 'draft' | 'active' | 'closed';
  votingStartTime: string;
  votingEndTime: string;
  createdAt: string;
  voterCount?: number;
  voteCount?: number;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    draft: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function AdminDashboardPage() {
  usePageTitle('My Elections');
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    fetch(`${API_URL}/api/elections/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setElections)
      .catch(() => addNotification('error', 'Failed to load elections'))
      .finally(() => setLoading(false));
  }, [addNotification]);

  const counts = {
    total: elections.length,
    active: elections.filter((e) => e.status === 'active').length,
    draft: elections.filter((e) => e.status === 'draft').length,
    closed: elections.filter((e) => e.status === 'closed').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Elections</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all your elections</p>
        </div>
        <Link
          to="/admin/elections/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Election
        </Link>
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
            <p className="text-xs text-gray-400 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {!loading && elections.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="font-semibold text-gray-700 text-lg">No elections yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-6">Create your first election to get started</p>
          <Link
            to="/admin/elections/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
          >
            Create Election
          </Link>
        </div>
      )}

      {!loading && elections.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {elections.map((e) => (
            <Link
              key={e._id}
              to={`/admin/elections/${e.slug}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                  {e.logoUrl && (
                    <img src={e.logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition truncate">{e.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">/{e.slug}</p>
                  </div>
                </div>
                <StatusBadge status={e.status} />
              </div>
              {e.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-1">{e.description}</p>
              )}
              <div className="text-xs text-gray-400 space-y-0.5 mb-3">
                <p>Voting: {new Date(e.votingStartTime).toLocaleDateString()} – {new Date(e.votingEndTime).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4 py-2.5 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span><strong className="text-gray-700">{e.voterCount ?? 0}</strong> registered</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span><strong className="text-gray-700">{e.voteCount ?? 0}</strong> voted</span>
                </div>
                {(e.voterCount ?? 0) > 0 && (
                  <span className="ml-auto text-xs text-purple-600 font-medium">
                    {Math.round(((e.voteCount ?? 0) / (e.voterCount ?? 1)) * 100)}% turnout
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center text-xs text-blue-600 font-medium">
                Manage election
                <svg className="w-3.5 h-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
