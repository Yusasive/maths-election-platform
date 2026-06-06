import { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import ConfirmModal from '../../components/ConfirmModal';
import { usePageTitle } from '../../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Admin {
  _id: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'declined';
  declineReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

type FilterTab = 'all' | 'pending' | 'approved' | 'declined';

const statusConfig: Record<string, { label: string; badge: string }> = {
  pending: { label: 'Pending', badge: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', badge: 'bg-green-100 text-green-700' },
  declined: { label: 'Declined', badge: 'bg-red-100 text-red-600' },
};

export default function SuperAdminAdminsPage() {
  usePageTitle('Admin Management');
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [declineModal, setDeclineModal] = useState<{ id: string; name: string } | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const { addNotification } = useNotification();
  const token = localStorage.getItem('adminToken') || '';

  const fetchAdmins = () => {
    fetch(`${API_URL}/api/admin/super/admins`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setAdmins(Array.isArray(d) ? d : (d.data ?? [])))
      .catch(() => addNotification('error', 'Failed to load admins'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAdmins(); }, []);

  const approve = async (id: string) => {
    const r = await fetch(`${API_URL}/api/admin/super/admins/${id}/approve`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) { addNotification('success', 'Admin approved'); fetchAdmins(); }
    else addNotification('error', 'Failed to approve');
  };

  const decline = async () => {
    if (!declineModal) return;
    const r = await fetch(`${API_URL}/api/admin/super/admins/${declineModal.id}/decline`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: declineReason }),
    });
    if (r.ok) {
      addNotification('success', 'Admin declined');
      setDeclineModal(null);
      setDeclineReason('');
      fetchAdmins();
    } else addNotification('error', 'Failed to decline');
  };

  const deleteAdmin = async (id: string) => {
    const r = await fetch(`${API_URL}/api/admin/super/admins/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) { addNotification('success', 'Admin deleted'); fetchAdmins(); }
    else addNotification('error', 'Failed to delete');
    setDeleteConfirm(null);
  };

  const filtered = filter === 'all' ? admins : admins.filter((a) => a.status === filter);

  const counts = {
    all: admins.length,
    pending: admins.filter((a) => a.status === 'pending').length,
    approved: admins.filter((a) => a.status === 'approved').length,
    declined: admins.filter((a) => a.status === 'declined').length,
  };

  return (
    <div>
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Delete Admin"
        message={`Permanently delete admin "${deleteConfirm?.name}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteConfirm && deleteAdmin(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm(null)}
      />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Admin Management</h1>
        <p className="text-sm text-gray-500 mt-1">Review, approve, or decline admin registrations</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        {(['pending', 'approved', 'declined', 'all'] as FilterTab[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === f ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-gray-100 text-gray-600' : 'text-gray-400'}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-sm text-gray-400">
          No {filter === 'all' ? '' : filter} admins found.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((admin) => (
          <div key={admin._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-700 font-semibold">{admin.name[0].toUpperCase()}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800">{admin.name}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig[admin.status]?.badge}`}>
                      {statusConfig[admin.status]?.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">{admin.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Registered: {new Date(admin.createdAt).toLocaleString()}
                    {admin.reviewedAt && ` · Reviewed: ${new Date(admin.reviewedAt).toLocaleString()}`}
                  </p>
                  {admin.status === 'declined' && admin.declineReason && (
                    <p className="text-xs text-red-500 mt-1">Reason: {admin.declineReason}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {admin.status === 'pending' && (
                  <>
                    <button
                      onClick={() => approve(admin._id)}
                      className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => { setDeclineModal({ id: admin._id, name: admin.name }); setDeclineReason(''); }}
                      className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition border border-red-100"
                    >
                      Decline
                    </button>
                  </>
                )}
                {admin.status === 'declined' && (
                  <button
                    onClick={() => approve(admin._id)}
                    className="bg-green-50 hover:bg-green-100 text-green-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition border border-green-100"
                  >
                    Approve Instead
                  </button>
                )}
                {admin.status === 'approved' && (
                  <button
                    onClick={() => { setDeclineModal({ id: admin._id, name: admin.name }); setDeclineReason(''); }}
                    className="text-gray-400 hover:text-red-500 text-xs px-2 py-1.5 rounded-lg transition"
                  >
                    Revoke
                  </button>
                )}
                <button
                  onClick={() => setDeleteConfirm({ id: admin._id, name: admin.name })}
                  className="text-gray-300 hover:text-red-500 transition p-1.5"
                  title="Delete admin"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Decline modal */}
      {declineModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Decline Admin</h3>
            <p className="text-sm text-gray-500 mb-4">You are declining <strong>{declineModal.name}</strong>. Optionally provide a reason.</p>
            <textarea
              rows={3}
              placeholder="Reason for declining (optional)"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={decline}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg transition text-sm"
              >
                Confirm Decline
              </button>
              <button
                onClick={() => setDeclineModal(null)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
