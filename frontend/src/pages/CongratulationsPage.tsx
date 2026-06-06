import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

interface ReceiptItem {
  position: string;
  candidates: string[];
}

export default function CongratulationsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<ReceiptItem[]>([]);

  usePageTitle('Vote Recorded');

  useEffect(() => {
    if (!slug) return;
    const voted = localStorage.getItem(`voted_${slug}`);
    if (!voted) {
      navigate(`/vote/${slug}`, { replace: true });
      return;
    }
    const stored = localStorage.getItem(`receipt_${slug}`);
    if (stored) {
      try { setReceipt(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [slug, navigate]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Check icon */}
      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 text-center">
        Vote Recorded!
      </h1>
      <p className="text-gray-500 mt-2 text-center text-base max-w-sm">
        Your participation helps ensure a fair election. Thank you!
      </p>

      {/* Receipt */}
      {receipt.length > 0 && (
        <div className="mt-8 w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Votes</span>
          </div>
          <div className="divide-y divide-gray-50">
            {receipt.map((item) => (
              <div key={item.position} className="px-5 py-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{item.position}</p>
                {item.candidates.length > 0
                  ? item.candidates.map((name) => (
                    <div key={name} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-800">{name}</p>
                    </div>
                  ))
                  : <p className="text-sm text-gray-400 italic">No vote recorded</p>
                }
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Link
          to={`/vote/${slug}/results`}
          className="border border-gray-200 bg-white text-gray-700 font-semibold py-2.5 px-5 rounded-lg hover:bg-gray-50 transition text-sm"
        >
          View Results
        </Link>
        <Link
          to="/"
          className="bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-blue-700 transition text-sm"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
