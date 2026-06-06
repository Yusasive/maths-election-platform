import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Election {
  slug: string;
  title: string;
  description: string;
  logoUrl?: string;
  status: string;
  hasAccessCode?: boolean;
  votingStartTime: string;
  votingEndTime: string;
}

export default function VoterLoginPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [election, setElection] = useState<Election | null>(null);
  const [loadingElection, setLoadingElection] = useState(true);
  const [formData, setFormData] = useState({ matricNumber: '', fullName: '', department: '', accessCode: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!slug) return;
    // Already registered — go straight to cast or done
    const stored = localStorage.getItem(`voter_${slug}`);
    if (stored) {
      const voted = localStorage.getItem(`voted_${slug}`);
      navigate(voted ? `/vote/${slug}/done` : `/vote/${slug}/cast`, { replace: true });
      return;
    }

    fetch(`${API_URL}/api/elections/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('Election not found');
        return r.json();
      })
      .then(setElection)
      .catch(() => addNotification('error', 'Election not found'))
      .finally(() => setLoadingElection(false));
  }, [slug, navigate, addNotification]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [imageFile]);

  const votingStart = useMemo(() => election ? new Date(election.votingStartTime) : null, [election]);
  const votingEnd = useMemo(() => election ? new Date(election.votingEndTime) : null, [election]);

  const isOpen = votingStart && votingEnd ? now >= votingStart && now <= votingEnd : false;
  const hasNotStarted = votingStart ? now < votingStart : false;

  const formatCountdown = (target: Date) => {
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return '00:00:00';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.matricNumber || !formData.fullName || !formData.department || !imageFile) {
      addNotification('error', 'All fields including an image are required');
      return;
    }
    if (election?.hasAccessCode && !formData.accessCode.trim()) {
      addNotification('error', 'Please enter the access code for this election');
      return;
    }
    if (!isOpen) {
      addNotification('error', hasNotStarted ? 'Voting has not started yet' : 'This election has ended');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', imageFile);
      const uploadRes = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: fd });
      if (!uploadRes.ok) throw new Error('Image upload failed');
      const { url: imageUrl } = await uploadRes.json();

      const res = await fetch(`${API_URL}/api/elections/${slug}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matricNumber: formData.matricNumber.toLowerCase(),
          fullName: formData.fullName,
          department: formData.department,
          image: imageUrl,
          ...(formData.accessCode ? { accessCode: formData.accessCode.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      localStorage.setItem(`voter_${slug}`, JSON.stringify({
        matricNumber: formData.matricNumber.toLowerCase(),
        fullName: formData.fullName,
        department: formData.department,
        image: imageUrl,
      }));

      addNotification('success', 'Registered! Proceeding to vote.');
      navigate(`/vote/${slug}/cast`);
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingElection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <p className="text-xl font-semibold text-gray-700">Election not found</p>
          <Link to="/" className="text-blue-600 hover:underline mt-2 block">Back to elections</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            All Elections
          </Link>
          <Link to={`/vote/${slug}/results`} className="text-sm text-gray-500 hover:text-blue-600">
            View Results
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="text-center mb-8">
          {election.logoUrl ? (
            <img src={election.logoUrl} alt="" className="w-16 h-16 rounded-xl object-cover mx-auto mb-4 border border-gray-100 shadow-sm" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-800">{election.title}</h1>
          {election.description && <p className="text-gray-500 mt-2 text-sm">{election.description}</p>}
        </div>

        {/* Status banner */}
        {hasNotStarted && votingStart && (
          <div className="mb-6 text-center py-3 px-4 rounded-lg text-sm font-medium bg-yellow-50 text-yellow-700">
            Voting opens in {formatCountdown(votingStart)} &mdash; {votingStart.toLocaleString()}
          </div>
        )}
        {isOpen && votingEnd && (
          <div className="mb-6 text-center py-3 px-4 rounded-lg text-sm font-medium bg-green-50 text-green-700">
            Voting closes in: {formatCountdown(votingEnd)}
          </div>
        )}
        {!hasNotStarted && !isOpen && (
          <div className="mb-6 text-center py-3 px-4 rounded-lg text-sm font-medium bg-red-50 text-red-700">
            This election has ended
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 text-lg">Register to Vote</h2>

          <input
            type="text"
            placeholder="Matric Number"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={formData.matricNumber}
            onChange={(e) => setFormData({ ...formData, matricNumber: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Full Name"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Department"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            required
          />

          {election?.hasAccessCode && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <label className="text-sm font-medium text-gray-700">Access Code</label>
              </div>
              <input
                type="text"
                placeholder="Enter the code shared by your organiser"
                className="w-full px-4 py-2.5 border border-amber-200 bg-amber-50 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                value={formData.accessCode}
                onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                required
              />
            </div>
          )}

          <label className="flex flex-col items-center justify-center w-full py-6 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <>
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="text-sm text-gray-500">Upload ID Card or Course Form</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </label>

          <button
            type="submit"
            disabled={!isOpen || submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition text-sm"
          >
            {submitting ? 'Registering...' : 'Register & Vote'}
          </button>
        </form>
      </div>
    </main>
  );
}
