import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '';

interface CandidateResult {
  id: string;
  name: string;
  level: string;
  imageUrl: string;
  votes: number;
}

interface PositionResult {
  positionId: string;
  position: string;
  allowMultiple: boolean;
  candidates: CandidateResult[];
}

interface ElectionResults {
  election: { slug: string; title: string; status: string };
  totalVoters: number;
  totalVotesCast: number;
  results: PositionResult[];
}

export default function ResultsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<ElectionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/api/elections/${slug}/results`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load results');
        return r.json();
      })
      .then(setData)
      .catch(() => setError('Failed to load results'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <p className="text-xl font-semibold text-red-500">{error || 'No results found'}</p>
          <Link to="/" className="text-blue-600 hover:underline mt-2 block">Back to elections</Link>
        </div>
      </div>
    );
  }

  const totalVotes = data.totalVotesCast;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            All Elections
          </Link>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${data.election.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {data.election.status}
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-2">{data.election.title}</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Election Results</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-3xl font-bold text-blue-600">{data.totalVoters}</p>
            <p className="text-sm text-gray-500 mt-1">Registered Voters</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-3xl font-bold text-green-600">{totalVotes}</p>
            <p className="text-sm text-gray-500 mt-1">Votes Cast</p>
          </div>
        </div>

        <div className="space-y-6">
          {data.results.map((pos) => {
            const maxVotes = pos.candidates[0]?.votes || 0;
            return (
              <div key={pos.positionId} className="bg-white shadow-sm rounded-xl border border-gray-100 p-5">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{pos.position}</h2>
                <div className="space-y-3">
                  {pos.candidates.map((c, i) => {
                    const pct = totalVotes > 0 ? Math.round((c.votes / totalVotes) * 100) : 0;
                    const isWinner = i === 0 && c.votes > 0;
                    return (
                      <div key={c.id} className="flex items-center gap-3">
                        {isWinner && <span className="text-yellow-500 text-lg" title="Leading">★</span>}
                        {!isWinner && <span className="w-5" />}
                        <img
                          src={c.imageUrl}
                          alt={c.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{c.name} <span className="text-gray-400 text-xs">({c.level})</span></p>
                            <p className="text-sm font-bold text-gray-600 ml-2 flex-shrink-0">{c.votes} votes ({pct}%)</p>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${isWinner ? 'bg-yellow-400' : 'bg-blue-400'}`}
                              style={{ width: `${maxVotes > 0 ? (c.votes / maxVotes) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
