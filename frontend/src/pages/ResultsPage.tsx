import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_API_URL || '';

interface CandidateResult {
  id: string;
  name: string;
  level: string;
  imageUrl: string;
  votes: number;
  nickname?: string;
}

interface PositionResult {
  positionId: string;
  position: string;
  allowMultiple: boolean;
  candidates: CandidateResult[];
}

interface ElectionResults {
  election: { slug: string; title: string; description?: string; logoUrl?: string; status: string; showLiveResults: boolean };
  totalVoters: number;
  totalVotesCast: number;
  results: PositionResult[];
  resultsHidden?: boolean;
}

export default function ResultsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<ElectionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  usePageTitle(
    data ? `Results — ${data.election.title}` : 'Election Results',
    data ? { description: data.election.description, image: data.election.logoUrl } : undefined,
  );

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

  if (data.resultsHidden) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              All Elections
            </Link>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">active</span>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{data.election.title}</h1>
          <p className="text-gray-500 text-sm mb-1">Results are not available yet</p>
          <p className="text-gray-400 text-xs">The election organiser has not enabled live results. Check back after voting closes.</p>
        </div>
      </main>
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
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {c.name}
                              {c.nickname && <span className="text-blue-500 text-xs font-medium ml-1">"{c.nickname}"</span>}
                              <span className="text-gray-400 text-xs ml-1">({c.level})</span>
                            </p>
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
