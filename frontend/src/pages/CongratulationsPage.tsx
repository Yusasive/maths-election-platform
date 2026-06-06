import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

export default function CongratulationsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [balloons] = useState(['red', 'blue', 'green', 'yellow', 'purple']);

  useEffect(() => {
    if (!slug) return;
    const voted = localStorage.getItem(`voted_${slug}`);
    if (!voted) {
      navigate(`/vote/${slug}`, { replace: true });
    }
  }, [slug, navigate]);

  return (
    <main className="relative flex flex-col items-center justify-center h-screen bg-gradient-to-br from-green-100 via-gray-100 to-blue-100 overflow-hidden">
      <h1 className="text-4xl md:text-6xl font-extrabold text-green-700 animate-bounce z-10">
        Thank You!
      </h1>
      <p className="text-2xl md:text-3xl text-green-700 font-semibold pt-8 text-center z-10">
        Your vote has been successfully recorded.
      </p>
      <p className="text-lg md:text-xl text-gray-600 pt-4 text-center px-4 z-10">
        Your participation helps ensure a fair election.{' '}
        <span className="text-blue-500 font-bold">We appreciate you!</span>
      </p>

      <div className="absolute inset-0 pointer-events-none">
        {balloons.map((color, i) => (
          <div
            key={i}
            className={`balloon bg-${color}-500`}
            style={{ left: `${10 + i * 18}%`, animationDelay: `${i * 0.4}s` }}
          />
        ))}
      </div>

      <div className="mt-10 flex gap-4 z-10">
        <Link
          to={`/vote/${slug}/results`}
          className="bg-white border border-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition"
        >
          View Results
        </Link>
        <Link
          to="/"
          className="bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
