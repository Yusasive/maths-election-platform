import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import ConfirmModal from '../../components/ConfirmModal';
import { usePageTitle } from '../../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_API_URL || '';

type Tab = 'overview' | 'positions' | 'candidates' | 'voters' | 'settings';

interface Election {
  _id: string; slug: string; title: string; description: string; logoUrl?: string;
  status: string; hasAccessCode?: boolean; isPublic?: boolean; showLiveResults?: boolean;
  votingStartTime: string; votingEndTime: string;
}
interface Position { _id: string; name: string; allowMultiple: boolean; maxVotes: number; order: number; }
interface Candidate { _id: string; positionId: string; name: string; level: string; imageUrl: string; nickname?: string; }
interface Voter { _id: string; matricNumber: string; fullName: string; department: string; level?: string; hasVoted: boolean; createdAt: string; }
interface Stats { voters: number; votes: number; candidates: number; positions: number; turnout: number; }

interface ConfirmState {
  open: boolean; title: string; message: string; variant: 'danger' | 'warning';
  onConfirm: () => void;
}

function toLocalValue(d: string) {
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

const defaultConfirm: ConfirmState = { open: false, title: '', message: '', variant: 'danger', onConfirm: () => {} };

export default function AdminElectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const token = localStorage.getItem('adminToken') || '';

  const tabsRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [election, setElection] = useState<Election | null>(null);
  usePageTitle(election ? election.title : 'Election');
  const [stats, setStats] = useState<Stats | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<ConfirmState>(defaultConfirm);

  // Add position
  const [newPos, setNewPos] = useState({ name: '', allowMultiple: false, maxVotes: 2 });
  const [addingPos, setAddingPos] = useState(false);

  // Edit position modal
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [editPosForm, setEditPosForm] = useState({ name: '', allowMultiple: false, maxVotes: 2 });
  const [savingPos, setSavingPos] = useState(false);

  // Add candidate
  const [newCand, setNewCand] = useState({ positionId: '', name: '', level: '', imageUrl: '', nickname: '' });
  const [candImageFile, setCandImageFile] = useState<File | null>(null);
  const [candImagePreview, setCandImagePreview] = useState<string | null>(null);
  const [addingCand, setAddingCand] = useState(false);

  // Edit candidate modal
  const [editingCand, setEditingCand] = useState<Candidate | null>(null);
  const [editCandForm, setEditCandForm] = useState({ name: '', level: '', imageUrl: '', nickname: '' });
  const [editCandImageFile, setEditCandImageFile] = useState<File | null>(null);
  const [editCandPreview, setEditCandPreview] = useState<string | null>(null);
  const [savingCand, setSavingCand] = useState(false);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    title: '', description: '', status: '', logoUrl: '',
    accessCode: '', isPublic: true, showLiveResults: true,
    votingStartTime: '', votingEndTime: '',
  });
  const [settingsLogoFile, setSettingsLogoFile] = useState<File | null>(null);
  const [settingsLogoPreview, setSettingsLogoPreview] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const [elRes, posRes, candRes] = await Promise.all([
        fetch(`${API_URL}/api/elections/${slug}`),
        fetch(`${API_URL}/api/elections/${slug}/positions`),
        fetch(`${API_URL}/api/elections/${slug}/candidates`),
      ]);
      const [el, pos, cand] = await Promise.all([elRes.json(), posRes.json(), candRes.json()]);
      setElection(el);
      setPositions(Array.isArray(pos) ? pos : []);
      const allCandidates: Candidate[] = [];
      if (Array.isArray(cand)) {
        for (const p of cand) for (const c of (p.candidates || [])) allCandidates.push(c);
      }
      setCandidates(allCandidates);
      setSettingsForm({
        title: el.title, description: el.description || '', status: el.status,
        logoUrl: el.logoUrl || '',
        accessCode: '',
        isPublic: el.isPublic !== false,
        showLiveResults: el.showLiveResults !== false,
        votingStartTime: toLocalValue(el.votingStartTime),
        votingEndTime: toLocalValue(el.votingEndTime),
      });
      setSettingsLogoPreview(el.logoUrl || null);
    } catch { addNotification('error', 'Failed to load election data'); }
  };

  const fetchStats = async () => {
    try {
      const r = await fetch(`${API_URL}/api/elections/${slug}/stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setStats(await r.json());
    } catch { /* optional */ }
  };

  const fetchVoters = async () => {
    try {
      const r = await fetch(`${API_URL}/api/admin/elections/${slug}/voters`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); setVoters(d.data ?? d); }
    } catch { /* optional */ }
  };

  useEffect(() => {
    if (!slug) return;
    Promise.all([fetchAll(), fetchStats()]).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => { if (tab === 'voters') fetchVoters(); }, [tab]);

  // Confirm helper
  const askConfirm = (title: string, message: string, onConfirm: () => void, variant: 'danger' | 'warning' = 'danger') => {
    setConfirm({ open: true, title, message, variant, onConfirm });
  };

  // --- Positions ---
  const addPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPos.name.trim()) return;
    setAddingPos(true);
    try {
      const r = await fetch(`${API_URL}/api/elections/${slug}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newPos),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setNewPos({ name: '', allowMultiple: false, maxVotes: 2 });
      await fetchAll();
      addNotification('success', 'Position added');
    } catch (err) { addNotification('error', err instanceof Error ? err.message : 'Failed'); }
    finally { setAddingPos(false); }
  };

  const openEditPos = (p: Position) => {
    setEditingPos(p);
    setEditPosForm({ name: p.name, allowMultiple: p.allowMultiple, maxVotes: p.maxVotes });
  };

  const saveEditPos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPos) return;
    setSavingPos(true);
    try {
      const r = await fetch(`${API_URL}/api/elections/${slug}/positions/${editingPos._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editPosForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setEditingPos(null);
      await fetchAll();
      addNotification('success', 'Position updated');
    } catch (err) { addNotification('error', err instanceof Error ? err.message : 'Failed'); }
    finally { setSavingPos(false); }
  };

  const deletePosition = (id: string, name: string) => {
    askConfirm(
      'Delete Position',
      `Delete "${name}" and all its candidates? This cannot be undone.`,
      async () => {
        const r = await fetch(`${API_URL}/api/elections/${slug}/positions/${id}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) { await fetchAll(); addNotification('success', 'Position deleted'); }
        else addNotification('error', 'Failed to delete position');
        setConfirm(defaultConfirm);
      },
    );
  };

  // --- Candidates ---
  const uploadAndAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCand.positionId || !newCand.name || !newCand.level || !candImageFile) {
      addNotification('error', 'All fields including an image are required');
      return;
    }
    setAddingCand(true);
    try {
      const fd = new FormData();
      fd.append('file', candImageFile);
      const upRes = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: fd });
      if (!upRes.ok) throw new Error('Image upload failed');
      const { url: imageUrl } = await upRes.json();

      const r = await fetch(`${API_URL}/api/elections/${slug}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newCand, imageUrl }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setNewCand({ positionId: '', name: '', level: '', imageUrl: '', nickname: '' });
      setCandImageFile(null);
      setCandImagePreview(null);
      await fetchAll();
      addNotification('success', 'Candidate added');
    } catch (err) { addNotification('error', err instanceof Error ? err.message : 'Failed'); }
    finally { setAddingCand(false); }
  };

  const openEditCand = (c: Candidate) => {
    setEditingCand(c);
    setEditCandForm({ name: c.name, level: c.level, imageUrl: c.imageUrl, nickname: c.nickname ?? '' });
    setEditCandPreview(c.imageUrl);
    setEditCandImageFile(null);
  };

  const saveEditCand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCand) return;
    setSavingCand(true);
    try {
      let imageUrl = editCandForm.imageUrl;
      if (editCandImageFile) {
        const fd = new FormData();
        fd.append('file', editCandImageFile);
        const upRes = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: fd });
        if (!upRes.ok) throw new Error('Image upload failed');
        const data = await upRes.json();
        imageUrl = data.url;
      }
      const r = await fetch(`${API_URL}/api/elections/${slug}/candidates/${editingCand._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...editCandForm, imageUrl }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setEditingCand(null);
      setEditCandImageFile(null);
      setEditCandPreview(null);
      await fetchAll();
      addNotification('success', 'Candidate updated');
    } catch (err) { addNotification('error', err instanceof Error ? err.message : 'Failed'); }
    finally { setSavingCand(false); }
  };

  const deleteCandidate = (id: string, name: string) => {
    askConfirm('Delete Candidate', `Remove "${name}" from this election?`, async () => {
      const r = await fetch(`${API_URL}/api/elections/${slug}/candidates/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) { await fetchAll(); addNotification('success', 'Candidate deleted'); }
      else addNotification('error', 'Failed to delete');
      setConfirm(defaultConfirm);
    });
  };

  // --- Settings ---
  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let logoUrl = settingsForm.logoUrl;
      if (settingsLogoFile) {
        const fd = new FormData();
        fd.append('file', settingsLogoFile);
        const upRes = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: fd });
        if (!upRes.ok) throw new Error('Logo upload failed');
        const data = await upRes.json();
        logoUrl = data.url;
      }
      const r = await fetch(`${API_URL}/api/elections/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...settingsForm, logoUrl,
          // Only send accessCode if admin typed something — empty = keep existing
          ...(settingsForm.accessCode ? { accessCode: settingsForm.accessCode } : {}),
          votingStartTime: new Date(settingsForm.votingStartTime).toISOString(),
          votingEndTime: new Date(settingsForm.votingEndTime).toISOString(),
          showLiveResults: settingsForm.showLiveResults,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setSettingsLogoFile(null);
      await fetchAll();
      addNotification('success', 'Settings saved');
    } catch (err) { addNotification('error', err instanceof Error ? err.message : 'Failed'); }
  };

  const deleteElection = () => {
    askConfirm(
      'Delete Election',
      `Permanently delete "${election?.title}" including all votes, voters, candidates, and positions?`,
      async () => {
        const r = await fetch(`${API_URL}/api/elections/${slug}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) { addNotification('success', 'Election deleted'); navigate('/admin/dashboard'); }
        else addNotification('error', 'Failed to delete');
        setConfirm(defaultConfirm);
      },
    );
  };

  const deleteVoter = (matricNumber: string, name: string) => {
    askConfirm('Remove Voter', `Remove "${name}" from this election?`, async () => {
      const r = await fetch(`${API_URL}/api/admin/elections/${slug}/voters/${matricNumber}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) { await fetchVoters(); addNotification('success', 'Voter removed'); }
      else addNotification('error', 'Failed to remove voter');
      setConfirm(defaultConfirm);
    }, 'warning');
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  }

  if (!election) {
    return <div className="text-center py-20 text-gray-500">Election not found. <Link to="/admin/dashboard" className="text-blue-600 hover:underline">Go back</Link></div>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'positions', label: 'Positions' },
    { key: 'candidates', label: 'Candidates' },
    { key: 'voters', label: 'Voters' },
    { key: 'settings', label: 'Settings' },
  ];

  const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-700', draft: 'bg-yellow-100 text-yellow-700', closed: 'bg-gray-100 text-gray-500',
  };

  return (
    <div>
      {/* Confirm modal */}
      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.title}
        message={confirm.message}
        variant={confirm.variant}
        confirmLabel="Yes, proceed"
        cancelLabel="Cancel"
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm(defaultConfirm)}
      />

      {/* Edit Position Modal */}
      {editingPos && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-800">Edit Position</h3>
              <button onClick={() => setEditingPos(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close edit position modal">
                <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={saveEditPos} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Position Name</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editPosForm.name}
                  onChange={(e) => setEditPosForm({ ...editPosForm, name: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox" className="w-4 h-4 rounded"
                  checked={editPosForm.allowMultiple}
                  onChange={(e) => setEditPosForm({ ...editPosForm, allowMultiple: e.target.checked })}
                />
                <span className="text-sm text-gray-700">Allow multiple selections</span>
              </label>
              {editPosForm.allowMultiple && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Max votes</label>
                  <input
                    type="number" min={2} max={10}
                    className="w-24 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editPosForm.maxVotes}
                    onChange={(e) => setEditPosForm({ ...editPosForm, maxVotes: Number(e.target.value) })}
                  />
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={savingPos} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition">
                  {savingPos ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditingPos(null)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Candidate Modal */}
      {editingCand && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-800">Edit Candidate</h3>
              <button onClick={() => setEditingCand(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close edit candidate modal">
                <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={saveEditCand} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editCandForm.name}
                  onChange={(e) => setEditCandForm({ ...editCandForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Level / Year</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editCandForm.level}
                  onChange={(e) => setEditCandForm({ ...editCandForm, level: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nickname <span className="text-gray-400 text-xs font-normal">(optional)</span></label>
                <input
                  type="text"
                  placeholder='e.g. "The Lion"'
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editCandForm.nickname}
                  onChange={(e) => setEditCandForm({ ...editCandForm, nickname: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Photo</label>
                <div className="flex items-center gap-4">
                  {editCandPreview && (
                    <img src={editCandPreview} alt="Preview" className="w-14 h-14 rounded-full object-cover border border-gray-100" />
                  )}
                  <label className="flex-1 flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    {editCandImageFile ? editCandImageFile.name : 'Replace photo (optional)'}
                    <input
                      type="file" accept="image/*" className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) { setEditCandImageFile(f); setEditCandPreview(URL.createObjectURL(f)); }
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={savingCand} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition">
                  {savingCand ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditingCand(null)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-3">
          <Link to="/admin/dashboard" className="mt-1 flex-shrink-0 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 flex-wrap">
              {election.logoUrl && <img src={election.logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-100 mt-0.5" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">{election.title}</h1>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusColor[election.status] || 'bg-gray-100 text-gray-500'}`}>
                    {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-0.5 font-mono">/{election.slug}</p>
              </div>
            </div>
          </div>
          <a href={`/vote/${election.slug}`} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 text-sm border border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            <span className="hidden sm:inline">Voter Page</span>
          </a>
        </div>
      </div>

      {/* Tabs — scrollable on mobile, select fallback for very small screens */}
      <div className="mb-6">
        {/* Mobile select */}
        <select
          className="sm:hidden w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          value={tab}
          onChange={(e) => setTab(e.target.value as Tab)}
          aria-label="Select tab"
        >
          {tabs.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        {/* Desktop tabs */}
        <div ref={tabsRef} className="hidden sm:flex gap-1 border-b border-gray-100 overflow-x-auto scrollbar-none">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              aria-selected={tab === t.key}
              role="tab"
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Registered Voters', value: stats?.voters ?? '—', color: 'text-blue-600' },
              { label: 'Votes Cast', value: stats?.votes ?? '—', color: 'text-green-600' },
              { label: 'Turnout', value: stats ? `${stats.turnout}%` : '—', color: 'text-purple-600' },
              { label: 'Candidates', value: stats?.candidates ?? '—', color: 'text-gray-800' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Election Details</h3>
            <dl className="space-y-2 text-sm">
              {election.description && <div className="flex flex-col sm:flex-row sm:gap-2"><dt className="text-gray-400 sm:w-36 font-medium sm:font-normal">Description:</dt><dd className="text-gray-700">{election.description}</dd></div>}
              <div className="flex flex-col sm:flex-row sm:gap-2"><dt className="text-gray-400 sm:w-36 font-medium sm:font-normal">Voting opens:</dt><dd className="text-gray-700">{new Date(election.votingStartTime).toLocaleString()}</dd></div>
              <div className="flex flex-col sm:flex-row sm:gap-2"><dt className="text-gray-400 sm:w-36 font-medium sm:font-normal">Voting closes:</dt><dd className="text-gray-700">{new Date(election.votingEndTime).toLocaleString()}</dd></div>
            </dl>
          </div>
          <Link to={`/vote/${election.slug}/results`} target="_blank"
            className="inline-flex items-center gap-2 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            View Public Results
          </Link>
        </div>
      )}

      {/* Positions */}
      {tab === 'positions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Add Position</h3>
            <form onSubmit={addPosition} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-40">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Position Name</label>
                <input type="text" placeholder="e.g. President" required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newPos.name} onChange={(e) => setNewPos({ ...newPos, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Type</label>
                <label className="flex items-center gap-2 cursor-pointer h-9 px-3 border border-gray-200 rounded-lg text-sm">
                  <input type="checkbox" checked={newPos.allowMultiple} onChange={(e) => setNewPos({ ...newPos, allowMultiple: e.target.checked })} />
                  Multi-select
                </label>
              </div>
              {newPos.allowMultiple && (
                <div className="w-24">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Max votes</label>
                  <input type="number" min={2} max={10}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPos.maxVotes} onChange={(e) => setNewPos({ ...newPos, maxVotes: Number(e.target.value) })} />
                </div>
              )}
              <button type="submit" disabled={addingPos}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition h-9">
                {addingPos ? 'Adding...' : 'Add'}
              </button>
            </form>
          </div>

          {positions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">No positions yet. Add your first position above.</div>
          ) : positions.map((p) => (
            <div key={p._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {p.allowMultiple ? `Multi-select (up to ${p.maxVotes})` : 'Single select'}
                  {' · '}{candidates.filter((c) => c.positionId === p._id).length} candidate(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEditPos(p)}
                  className="text-gray-400 hover:text-blue-600 transition p-1.5 hover:bg-blue-50 rounded-lg"
                  aria-label={`Edit position ${p.name}`}>
                  <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => deletePosition(p._id, p.name)}
                  className="text-gray-400 hover:text-red-500 transition p-1.5 hover:bg-red-50 rounded-lg"
                  aria-label={`Delete position ${p.name}`}>
                  <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidates */}
      {tab === 'candidates' && (
        <div className="space-y-4">
          {positions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
              Add positions first before adding candidates.
              <button onClick={() => setTab('positions')} className="ml-1 text-blue-600 hover:underline">Go to Positions</button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Add Candidate</h3>
              <form onSubmit={uploadAndAddCandidate} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Position</label>
                    <select required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={newCand.positionId} onChange={(e) => setNewCand({ ...newCand, positionId: e.target.value })}>
                      <option value="">Select position</option>
                      {positions.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Full Name</label>
                    <input type="text" placeholder="Candidate name" required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newCand.name} onChange={(e) => setNewCand({ ...newCand, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Level / Year</label>
                    <input type="text" placeholder="e.g. 300L" required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newCand.level} onChange={(e) => setNewCand({ ...newCand, level: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Nickname <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="text" placeholder='e.g. "The Lion"'
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newCand.nickname} onChange={(e) => setNewCand({ ...newCand, nickname: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Photo</label>
                    <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition text-sm text-gray-500">
                      {candImagePreview
                        ? <img src={candImagePreview} alt="" className="w-8 h-8 rounded-full object-cover" />
                        : <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
                      <span className="truncate">{candImageFile ? candImageFile.name : 'Choose photo'}</span>
                      <input type="file" accept="image/*" required className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) { setCandImageFile(f); setCandImagePreview(URL.createObjectURL(f)); }
                        }} />
                    </label>
                  </div>
                </div>
                <button type="submit" disabled={addingCand}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition">
                  {addingCand ? 'Uploading & Adding...' : 'Add Candidate'}
                </button>
              </form>
            </div>
          )}

          {positions.map((pos) => {
            const posCandidates = candidates.filter((c) => c.positionId === pos._id);
            if (posCandidates.length === 0) return null;
            return (
              <div key={pos._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-700 mb-3">{pos.name}</h3>
                <div className="divide-y divide-gray-50">
                  {posCandidates.map((c) => (
                    <div key={c._id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <img src={c.imageUrl} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-gray-100"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.level}{c.nickname ? ` · "${c.nickname}"` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEditCand(c)}
                          className="text-gray-400 hover:text-blue-600 transition p-1.5 hover:bg-blue-50 rounded-lg"
                          aria-label={`Edit candidate ${c.name}`}>
                          <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => deleteCandidate(c._id, c.name)}
                          className="text-gray-400 hover:text-red-500 transition p-1.5 hover:bg-red-50 rounded-lg"
                          aria-label={`Delete candidate ${c.name}`}>
                          <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Voters */}
      {tab === 'voters' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Registered Voters ({voters.length})</h3>
            <button onClick={fetchVoters} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
          </div>
          {voters.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">No voters registered yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {voters.map((v) => (
                <div key={v._id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{v.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{v.matricNumber} · {v.department}{v.level ? ` · ${v.level}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${v.hasVoted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {v.hasVoted ? 'Voted' : 'Not voted'}
                    </span>
                    <button onClick={() => deleteVoter(v.matricNumber, v.fullName)}
                      className="text-gray-300 hover:text-red-500 transition p-1 hover:bg-red-50 rounded-lg"
                      aria-label={`Remove voter ${v.fullName}`}>
                      <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings */}
      {tab === 'settings' && (
        <div className="space-y-6 max-w-2xl">
          <form onSubmit={saveSettings} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h3 className="font-semibold text-gray-700">Election Settings</h3>

            {/* Logo */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Election Logo</label>
              <div className="flex items-center gap-4">
                {settingsLogoPreview ? (
                  <img src={settingsLogoPreview} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  {settingsLogoFile ? settingsLogoFile.name : 'Upload new logo'}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) { setSettingsLogoFile(f); setSettingsLogoPreview(URL.createObjectURL(f)); }
                    }} />
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Title</label>
              <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settingsForm.title} onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
              <textarea rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={settingsForm.description} onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Status</label>
              <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={settingsForm.status}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next === 'closed' && election?.status !== 'closed') {
                    askConfirm(
                      'Close Election',
                      'Closing this election will permanently stop voting. Voters will no longer be able to register or cast votes. Are you sure?',
                      () => { setSettingsForm((f) => ({ ...f, status: 'closed' })); setConfirm(defaultConfirm); },
                      'warning',
                    );
                  } else {
                    setSettingsForm({ ...settingsForm, status: next });
                  }
                }}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
              {settingsForm.status === 'closed' && election?.status !== 'closed' && (
                <p className="text-xs text-amber-600 mt-1">This change will permanently close voting when saved.</p>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Voting Start</label>
                <input type="datetime-local" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={settingsForm.votingStartTime} onChange={(e) => setSettingsForm({ ...settingsForm, votingStartTime: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Voting End</label>
                <input type="datetime-local" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={settingsForm.votingEndTime} onChange={(e) => setSettingsForm({ ...settingsForm, votingEndTime: e.target.value })} />
              </div>
            </div>
            {/* Access code */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Access Code</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={election?.hasAccessCode ? 'Leave blank to keep existing code' : 'Optional — voters must enter this to register'}
                  value={settingsForm.accessCode}
                  onChange={(e) => setSettingsForm({ ...settingsForm, accessCode: e.target.value })}
                />
                {election?.hasAccessCode && (
                  <button
                    type="button"
                    onClick={async () => {
                      const r = await fetch(`${API_URL}/api/elections/${slug}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ accessCode: '' }),
                      });
                      if (r.ok) { await fetchAll(); addNotification('success', 'Access code removed'); }
                      else addNotification('error', 'Failed to remove code');
                    }}
                    className="px-3 py-2.5 text-xs font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition whitespace-nowrap"
                  >
                    Remove code
                  </button>
                )}
              </div>
              {election?.hasAccessCode && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  An access code is currently set for this election.
                </p>
              )}
            </div>

            {/* Visibility toggle */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Public Listing</label>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setSettingsForm({ ...settingsForm, isPublic: !settingsForm.isPublic })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${settingsForm.isPublic ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settingsForm.isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm text-gray-600">
                  {settingsForm.isPublic ? 'Visible on the public elections page' : 'Hidden — only accessible via direct link'}
                </span>
              </label>
            </div>

            {/* Live results toggle */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Live Results</label>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setSettingsForm({ ...settingsForm, showLiveResults: !settingsForm.showLiveResults })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${settingsForm.showLiveResults ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settingsForm.showLiveResults ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm text-gray-600">
                  {settingsForm.showLiveResults
                    ? 'Voters can view results while voting is ongoing'
                    : 'Results are hidden until you turn this on'}
                </span>
              </label>
              {!settingsForm.showLiveResults && (
                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  The public results page will show a "results not available" message.
                </p>
              )}
            </div>

            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition">
              Save Changes
            </button>
          </form>

          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
            <h3 className="font-semibold text-red-600 mb-2">Danger Zone</h3>
            <p className="text-sm text-gray-500 mb-4">Deleting this election permanently removes all voters, votes, candidates, and positions.</p>
            <button onClick={deleteElection} className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete Election
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
