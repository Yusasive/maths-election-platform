import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotification } from '../context/NotificationContext';
import { usePageTitle } from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Candidate {
  id: string;
  name: string;
  level: string;
  imageUrl: string;
}

interface Position {
  id: string;
  name: string;
  allowMultiple: boolean;
  maxVotes?: number;
  candidates: Candidate[];
}

interface Election {
  slug: string;
  title: string;
  description?: string;
  logoUrl?: string;
  votingStartTime: string;
  votingEndTime: string;
}

export default function VotePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [election, setElection] = useState<Election | null>(null);
  usePageTitle(
    election ? `Vote — ${election.title}` : 'Cast Your Vote',
    election ? { description: election.description, image: election.logoUrl } : undefined,
  );
  const [positions, setPositions] = useState<Position[]>([]);
  const [selections, setSelections] = useState<Record<string, string | string[]>>({});
  const [voterData, setVoterData] = useState<{ matricNumber: string; fullName: string } | null>(null);
  const [now, setNow] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const stored = localStorage.getItem(`voter_${slug}`);
    if (!stored) {
      addNotification('error', 'Please register first');
      navigate(`/vote/${slug}`, { replace: true });
      return;
    }

    const voted = localStorage.getItem(`voted_${slug}`);
    if (voted) {
      navigate(`/vote/${slug}/done`, { replace: true });
      return;
    }

    setVoterData(JSON.parse(stored));

    Promise.all([
      fetch(`${API_URL}/api/elections/${slug}`).then((r) => r.json()),
      fetch(`${API_URL}/api/elections/${slug}/candidates`).then((r) => r.json()),
    ])
      .then(([electionData, candidatesData]) => {
        setElection(electionData);
        setPositions(Array.isArray(candidatesData) ? candidatesData : []);
      })
      .catch(() => addNotification('error', 'Failed to load election data'))
      .finally(() => setLoading(false));
  }, [slug, navigate, addNotification]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const votingStart = election ? new Date(election.votingStartTime) : null;
  const votingEnd = election ? new Date(election.votingEndTime) : null;
  const hasStarted = votingStart ? now >= votingStart : false;
  const hasEnded = votingEnd ? now > votingEnd : false;
  const isVotingOpen = hasStarted && !hasEnded;

  const formatCountdown = (target: Date) => {
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return '00:00:00';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSelection = (positionId: string, candidateId: string, allowMultiple: boolean, maxVotes?: number) => {
    if (allowMultiple) {
      const current = (selections[positionId] as string[]) || [];
      const isSelected = current.includes(candidateId);
      if (!isSelected && maxVotes && current.length >= maxVotes) {
        addNotification('warning', `You can only select up to ${maxVotes} candidates for this position`);
        return;
      }
      const updated = isSelected ? current.filter((id) => id !== candidateId) : [...current, candidateId];
      setSelections({ ...selections, [positionId]: updated });
    } else {
      setSelections({ ...selections, [positionId]: candidateId });
    }
  };

  const handleVote = async () => {
    if (!isVotingOpen) {
      addNotification('error', hasEnded ? 'Voting period has ended' : 'Voting has not started yet');
      return;
    }

    const unvoted = positions.filter(
      (p) => !selections[p.id] || (Array.isArray(selections[p.id]) && (selections[p.id] as string[]).length === 0),
    );
    if (unvoted.length > 0) {
      addNotification('warning', `Please vote for: ${unvoted.map((p) => p.name).join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/elections/${slug}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricNumber: voterData?.matricNumber, votes: selections }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit vote');

      // Build human-readable receipt before navigating
      const receipt = positions.map((p) => {
        const sel = selections[p.id];
        const ids = Array.isArray(sel) ? sel : sel ? [sel] : [];
        const names = ids.map((id) => p.candidates.find((c) => c.id === id)?.name ?? id);
        return { position: p.name, candidates: names };
      });
      localStorage.setItem(`voted_${slug}`, 'true');
      localStorage.setItem(`receipt_${slug}`, JSON.stringify(receipt));
      addNotification('success', 'Your vote has been recorded!');
      navigate(`/vote/${slug}/done`);
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {election?.logoUrl ? (
            <img
              src={election.logoUrl}
              alt={election?.title}
              className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 border border-white shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4 shadow-md">
              <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          )}
          <h1 className="text-2xl font-extrabold text-gray-800">{election?.title ?? 'Cast Your Vote'}</h1>
          {voterData && (
            <p className="text-sm text-gray-500 mt-1">
              Voting as <span className="font-semibold text-gray-700">{voterData.fullName}</span>
            </p>
          )}
        </motion.div>

        {/* Voting window status */}
        {election && (
          <div className="bg-white shadow-sm rounded-xl p-4 mb-6 text-sm text-center">
            {isVotingOpen && votingEnd && (
              <p className="text-green-600 font-medium">
                Voting closes in <span className="font-bold tabular-nums">{formatCountdown(votingEnd)}</span>
              </p>
            )}
            {!hasStarted && votingStart && (
              <p className="text-amber-600 font-medium">
                Voting starts in <span className="font-bold tabular-nums">{formatCountdown(votingStart)}</span>
                <span className="text-gray-400 font-normal ml-1">({votingStart.toLocaleString()})</span>
              </p>
            )}
            {hasEnded && (
              <p className="text-red-500 font-medium">Voting ended {votingEnd?.toLocaleString()}</p>
            )}
          </div>
        )}

        {!isVotingOpen && election && (
          <div className={`border text-center py-3 rounded-xl mb-6 font-medium text-sm ${
            hasEnded
              ? 'bg-red-50 border-red-200 text-red-600'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            {hasEnded ? 'Voting is closed for this election' : 'Voting has not started yet'}
          </div>
        )}

        {/* Positions */}
        <div className="space-y-6">
          {positions.map((pos) => (
            <motion.div
              key={pos.id}
              className="bg-white shadow-sm rounded-xl border border-gray-100 p-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">{pos.name}</h2>
                {pos.allowMultiple && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
                    Select up to {pos.maxVotes ?? 2}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pos.candidates.map((candidate) => {
                  const isSelected = pos.allowMultiple
                    ? ((selections[pos.id] as string[]) || []).includes(candidate.id)
                    : selections[pos.id] === candidate.id;

                  return (
                    <label
                      key={candidate.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition select-none ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type={pos.allowMultiple ? 'checkbox' : 'radio'}
                        name={pos.id}
                        checked={isSelected}
                        onChange={() => handleSelection(pos.id, candidate.id, pos.allowMultiple, pos.maxVotes)}
                        className="hidden"
                      />
                      <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center border-2 transition ${
                        pos.allowMultiple ? 'rounded' : 'rounded-full'
                      } ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <img
                        src={candidate.imageUrl}
                        alt={candidate.name}
                        className="w-11 h-11 rounded-full object-cover flex-shrink-0 border border-gray-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{candidate.name}</p>
                        <p className="text-xs text-gray-400">{candidate.level}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {positions.length > 0 && (
          <div className="mt-8">
            <button
              onClick={handleVote}
              disabled={!isVotingOpen || submitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-10 rounded-xl transition text-base"
            >
              {submitting ? 'Submitting...' : 'Submit Vote'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
