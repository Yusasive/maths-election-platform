import { Link } from 'react-router-dom';

export default function AdminPendingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Pending Approval</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your registration has been submitted and is awaiting review by a super admin.
            You will gain access to the dashboard once your account is approved.
          </p>
          <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-sm text-yellow-700">
            This process typically takes a short time. Please check back soon.
          </div>
          <div className="mt-6 flex gap-3">
            <Link
              to="/admin/login"
              className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition"
            >
              Try Login Again
            </Link>
            <Link
              to="/"
              className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
