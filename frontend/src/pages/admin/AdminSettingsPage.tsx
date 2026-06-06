import { useEffect, useRef, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { usePageTitle } from '../../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_API_URL || '';

interface AdminProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatarUrl?: string;
  createdAt?: string;
}

export default function AdminSettingsPage() {
  usePageTitle('Profile Settings');

  const { addNotification } = useNotification();
  const token = localStorage.getItem('adminToken') || '';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setProfile(d);
        setName(d.name ?? '');
        setEmail(d.email ?? '');
        setAvatarPreview(d.avatarUrl || null);
      })
      .catch(() => addNotification('error', 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [token, addNotification]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return profile?.avatarUrl || null;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('file', avatarFile);
      const r = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: fd });
      if (!r.ok) throw new Error('Upload failed');
      const { url } = await r.json();
      return url as string;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { addNotification('error', 'Name cannot be empty'); return; }
    setSavingProfile(true);
    try {
      const avatarUrl = await uploadAvatar();
      const r = await fetch(`${API_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Failed to save');

      // Update localStorage so sidebar reflects changes immediately
      const stored = localStorage.getItem('adminData');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('adminData', JSON.stringify({
          ...parsed,
          name: d.admin?.name ?? parsed.name,
          email: d.admin?.email ?? parsed.email,
          avatarUrl: d.admin?.avatarUrl ?? parsed.avatarUrl,
        }));
      }

      setProfile(d.admin);
      setAvatarFile(null);
      addNotification('success', 'Profile updated successfully');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.currentPassword) { addNotification('error', 'Enter your current password'); return; }
    if (pwForm.newPassword.length < 8) { addNotification('error', 'New password must be at least 8 characters'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { addNotification('error', 'New passwords do not match'); return; }
    setSavingPw(true);
    try {
      const r = await fetch(`${API_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Failed to change password');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      addNotification('success', 'Password changed successfully');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const initials = (name || profile?.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Update your personal details and account security</p>
      </div>

      {/* Avatar + basic info form */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">Personal Information</h2>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative flex-shrink-0">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-100 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center border-2 border-gray-100 shadow-sm">
                <span className="text-blue-700 font-bold text-xl">{initials}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow transition"
              aria-label="Change avatar"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">{profile?.name}</p>
            <p className="text-xs text-gray-400">{profile?.email}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              {avatarFile ? avatarFile.name : 'Change photo'}
            </button>
            {avatarPreview && profile?.avatarUrl && !avatarFile && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const r = await fetch(`${API_URL}/api/admin/profile`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ avatarUrl: '' }),
                    });
                    if (r.ok) {
                      setAvatarPreview(null);
                      setProfile((p) => p ? { ...p, avatarUrl: '' } : p);
                      addNotification('success', 'Photo removed');
                    }
                  } catch { addNotification('error', 'Failed to remove photo'); }
                }}
                className="ml-3 text-xs text-red-400 hover:underline mt-1"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Role badge */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-gray-500">Role:</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              profile?.role === 'super_admin'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {profile?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
            <span className="text-xs text-gray-400 ml-auto">
              {profile?.createdAt ? `Joined ${new Date(profile.createdAt).toLocaleDateString()}` : ''}
            </span>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={savingProfile || uploadingAvatar}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2"
          >
            {(savingProfile || uploadingAvatar) && (
              <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            )}
            {savingProfile || uploadingAvatar ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Password change */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Change Password</h2>
          <button
            type="button"
            onClick={() => setShowPasswords((v) => !v)}
            className="text-xs text-blue-600 hover:underline"
          >
            {showPasswords ? 'Hide' : 'Show'} passwords
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your current password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="At least 8 characters"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            />
            {pwForm.newPassword.length > 0 && (
              <div className="mt-1.5 flex gap-1">
                {[1, 2, 3, 4].map((lvl) => {
                  const score = Math.min(4, Math.floor(pwForm.newPassword.length / 3));
                  return (
                    <div key={lvl} className={`h-1 flex-1 rounded-full transition-colors ${
                      lvl <= score
                        ? score <= 1 ? 'bg-red-400' : score <= 2 ? 'bg-amber-400' : score <= 3 ? 'bg-blue-400' : 'bg-green-500'
                        : 'bg-gray-200'
                    }`} />
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword
                  ? 'border-red-300 focus:ring-red-400'
                  : 'border-gray-200'
              }`}
              placeholder="Re-enter new password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
            />
            {pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={savingPw || !pwForm.currentPassword || !pwForm.newPassword || pwForm.newPassword !== pwForm.confirmPassword}
            className="bg-gray-800 hover:bg-gray-900 disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2"
          >
            {savingPw && <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
            {savingPw ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
