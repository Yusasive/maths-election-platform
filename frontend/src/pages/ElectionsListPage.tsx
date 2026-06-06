import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    draft: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function ElectionsListPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/elections`)
      .then((r) => r.json())
      .then(setElections)
      .catch(() => setError('Failed to load elections'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Department of Mathematics</h1>
            <p className="text-sm text-gray-500 mt-1">Voting Platform</p>
          </div>
          <Link to="/admin/login" className="text-sm text-blue-600 hover:underline font-medium">
            Admin Login
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <img src="/maths.png" alt="Maths" className="w-20 h-16 object-contain mx-auto mb-6" />
        <h2 className="text-xl font-semibold text-gray-700 text-center mb-8">Active Elections</h2>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {error && (
          <div className="text-center text-red-500 py-10">{error}</div>
        )}

        {!loading && !error && elections.length === 0 && (
          <div className="text-center text-gray-500 py-20">
            <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-medium">No elections are currently available</p>
            <p className="text-sm mt-1">Check back later or contact your admin</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {elections.map((e) => (
            <div key={e._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {e.logoUrl && (
                    <img src={e.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                  )}
                  <h3 className="font-semibold text-gray-800 text-lg leading-snug">{e.title}</h3>
                </div>
                <StatusBadge status={e.status} />
              </div>
              {e.description && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{e.description}</p>
              )}
              <div className="text-xs text-gray-400 mb-4 space-y-1">
                <p>Voting starts: {new Date(e.votingStartTime).toLocaleString()}</p>
                <p>Voting ends: {new Date(e.votingEndTime).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                {e.status !== 'closed' && (
                  <Link
                    to={`/vote/${e.slug}`}
                    className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
                  >
                    Vote Now
                  </Link>
                )}
                <Link
                  to={`/vote/${e.slug}/results`}
                  className="flex-1 text-center border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium py-2 px-4 rounded-lg transition"
                >
                  View Results
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
