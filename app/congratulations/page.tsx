"use client";

import { useEffect, useState } from "react";

export default function CongratulationsPage() {
  const [balloons, setBalloons] = useState<string[]>([]);

  useEffect(() => {
    const mathsVoteRecord = localStorage.getItem("mathsVoteRecord_v2");

    if (!mathsVoteRecord) {
      alert("Unauthorized access! Redirecting to login.");
      window.location.href = "/";
    } else {
      setBalloons(["red", "blue", "green", "yellow", "purple"]);
    }
  }, []);

  return (
    <main className="relative flex flex-col items-center justify-center h-screen bg-gradient-to-br from-green-100 via-gray-100 to-blue-100 overflow-hidden">
      <h1 className="text-4xl md:text-6xl font-extrabold text-green-700 animate-bounce z-10">
        🎉 Thank You!
      </h1>
      <p className="text-2xl md:text-3xl text-green-700 font-semibold pt-8 text-center z-10">
        Your vote has been successfully recorded.
      </p>
      <p className="text-lg md:text-xl text-gray-600 pt-4 text-center z-10">
        Your participation helps us ensure a fair election.{" "}
        <span className="text-blue-500 font-bold">We appreciate you!</span>
      </p>
      <div className="absolute inset-0 pointer-events-none">
        {balloons.map((color, index) => (
          <div
            key={index}
            className={`absolute balloon bg-${color}-500`}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      <button
        onClick={() => {
          window.location.href = "/";
        }}
        className="mt-10 relative overflow-hidden bg-blue-500 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-600 transition duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-400 z-10"
      >
        Return to Home 
      </button>
      <style jsx>{`
        .balloon {
          width: 40px;
          height: 50px;
          border-radius: 50% 50% 50% 50% / 60% 60% 80% 80%;
          position: absolute;
          bottom: -100px;
          animation:
            floatUp 4s ease-in-out infinite,
            pop 0.5s steps(4, end) forwards;
        }

        .balloon::after {
          content: "";
          width: 6px;
          height: 40px;
          background: currentColor;
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
        }

        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          90% {
            transform: translateY(-500px) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translateY(-600px) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes pop {
          0% {
            background-size: 100%;
          }
          100% {
            background-size: 0%;
          }
        }
      `}</style>
    </main>
  );
}
