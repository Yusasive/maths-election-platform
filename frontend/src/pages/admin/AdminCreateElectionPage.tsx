import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

const API_URL = import.meta.env.VITE_API_URL || '';

function toLocalDatetimeValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AdminCreateElectionPage() {
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000);
  const defaultEnd = new Date(now.getTime() + 5 * 60 * 60 * 1000);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    status: 'active',
    accessCode: '',
    isPublic: true,
    votingStartTime: toLocalDatetimeValue(defaultStart),
    votingEndTime: toLocalDatetimeValue(defaultEnd),
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slugManuallySet, setSlugManuallySet] = useState(false);

  const autoSlug = (text: string) =>
    text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setForm((f) => ({
      ...f,
      title,
      slug: slugManuallySet ? f.slug : autoSlug(title),
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setLogoFile(f);
      setLogoPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.votingStartTime || !form.votingEndTime) {
      addNotification('error', 'All required fields must be filled');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');

      let logoUrl = '';
      if (logoFile) {
        const fd = new FormData();
        fd.append('file', logoFile);
        const upRes = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: fd });
        if (!upRes.ok) throw new Error('Logo upload failed');
        const upData = await upRes.json();
        logoUrl = upData.url;
      }

      const res = await fetch(`${API_URL}/api/elections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          logoUrl,
          votingStartTime: new Date(form.votingStartTime).toISOString(),
          votingEndTime: new Date(form.votingEndTime).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create election');
      addNotification('success', 'Election created!');
      navigate(`/admin/elections/${data.slug}`);
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Failed to create election');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin/dashboard" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Create Election</h1>
          <p className="text-sm text-gray-500 mt-0.5">Set up a new election for your voters</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">

        {/* Logo upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Election Logo</label>
          <div className="flex items-center gap-4">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo preview" className="w-16 h-16 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition text-sm text-gray-500 flex-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="truncate">{logoFile ? logoFile.name : 'Upload logo (optional)'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
            {logoFile && (
              <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                className="text-gray-400 hover:text-red-400 transition flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Election Title *</label>
          <input
            type="text"
            placeholder="e.g. Maths Department Elections 2025"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={form.title}
            onChange={handleTitleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL Slug *</label>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
            <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200">/vote/</span>
            <input
              type="text"
              placeholder="maths-elections-2025"
              className="flex-1 px-3 py-2.5 text-gray-700 text-sm focus:outline-none"
              value={form.slug}
              onChange={(e) => { setSlugManuallySet(true); setForm({ ...form, slug: autoSlug(e.target.value) }); }}
              required
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Voters will go to /vote/{form.slug || 'your-slug'}</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
          <textarea
            placeholder="Brief description of this election (optional)"
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Publish Status</label>
          <div className="flex gap-3">
            {(['active', 'draft'] as const).map((s) => (
              <label key={s} className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition ${form.status === s ? (s === 'active' ? 'border-green-500 bg-green-50' : 'border-yellow-400 bg-yellow-50') : 'border-gray-100 hover:border-gray-200'}`}>
                <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => setForm({ ...form, status: s })} className="hidden" />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.status === s ? (s === 'active' ? 'border-green-500' : 'border-yellow-400') : 'border-gray-300'}`}>
                  {form.status === s && <div className={`w-2 h-2 rounded-full ${s === 'active' ? 'bg-green-500' : 'bg-yellow-400'}`} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">{s === 'active' ? 'Active' : 'Draft'}</p>
                  <p className="text-xs text-gray-400">{s === 'active' ? 'Visible to voters immediately' : 'Hidden until you publish'}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Access code */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Access Code</label>
          <input
            type="text"
            placeholder="Optional — voters must enter this to register"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={form.accessCode}
            onChange={(e) => setForm({ ...form, accessCode: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1">Share this code only with intended voters. Leave blank for open access.</p>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Visibility</label>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.isPublic ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-gray-700">
              {form.isPublic ? 'Listed on the public elections page' : 'Hidden — only accessible via direct link'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Voting Start Time *</label>
            <input
              type="datetime-local"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={form.votingStartTime}
              onChange={(e) => setForm({ ...form, votingStartTime: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Voting End Time *</label>
            <input
              type="datetime-local"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={form.votingEndTime}
              onChange={(e) => setForm({ ...form, votingEndTime: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition text-sm"
          >
            {loading ? 'Creating...' : 'Create Election'}
          </button>
          <Link
            to="/admin/dashboard"
            className="px-6 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition text-sm"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
