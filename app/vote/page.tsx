"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import candidates from "../../data/candidates.json";

interface Candidate {
  id: number; 
  name: string;
}

interface Position {
  position: string;
  allowMultiple: boolean;
  candidates: Candidate[];
}

interface VoterData {
  matricNumber: string;
  fullName: string;
}

interface Selections {
  [position: string]: string | string[];
}

const useCountdown = (endTime: number): number => {
  const [timeLeft, setTimeLeft] = useState(Math.max(endTime - Date.now(), 0));

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(endTime - Date.now(), 0);
      setTimeLeft(remaining);
    };

    const intervalId = setInterval(tick, 1000);
    tick(); 

    return () => clearInterval(intervalId);
  }, [endTime]);

  return timeLeft;
};

export default function VotingPage() {
  const [selections, setSelections] = useState<Selections>({});
  const [voterData, setVoterData] = useState<VoterData | null>(null);
  const [isVotingOpen, setIsVotingOpen] = useState(false);

  const loginEndTime = useMemo(() => Date.now() + 5 * 7 * 60 * 1000, []);
  const votingEndTime = useMemo(() => Date.now() + 5 * 7 * 60 * 1000, []);

  const loginTimeLeft = useCountdown(loginEndTime);
  const votingTimeLeft = useCountdown(votingEndTime);

  const formatTime = (ms: number): string => {
    if (ms <= 0) return "Time Expired";

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const storedVoterData = JSON.parse(
      localStorage.getItem("voterData") || "{}"
    ) as VoterData;
    const hasVoted = localStorage.getItem("voteRecord");

    if (!storedVoterData?.matricNumber) {
      alert("You must log in first!");
      window.location.href = "/";
      return;
    }

    if (hasVoted) {
      alert("You have already voted!");
      window.location.href = "/";
      return;
    }
    setVoterData((prevData) => {
      if (JSON.stringify(prevData) !== JSON.stringify(storedVoterData)) {
        return storedVoterData;
      }
      return prevData;
    });


    const interval = setInterval(() => {
      const now = new Date().getTime();
      setIsVotingOpen(now <= votingEndTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [votingEndTime]);

  const handleSelection = (
    position: string,
    candidateId: string,
    allowMultiple: boolean
  ) => {
    if (allowMultiple) {
      const currentSelections = selections[position] || [];
      const updatedSelections = (currentSelections as string[]).includes(
        candidateId
      )
        ? (currentSelections as string[]).filter((id) => id !== candidateId)
        : [...(currentSelections as string[]), candidateId];
      setSelections({ ...selections, [position]: updatedSelections });
    } else {
      setSelections({ ...selections, [position]: candidateId });
    }
  };

  const handleVote = async () => {
    if (!isVotingOpen) {
      alert("Voting is closed.");
      return;
    }

    const allPositions = candidates.map(
      (position: Position) => position.position
    );
    const missingVotes = allPositions.filter(
      (pos) => !selections[pos] || (selections[pos] as string[]).length === 0
    );

    if (missingVotes.length > 0) {
      alert(`You must vote for all positions: ${missingVotes.join(", ")}`);
      return;
    }

    try {
      const response = await fetch(
        "https://65130c258e505cebc2e981a1.mockapi.io/votes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matricNumber: voterData?.matricNumber,
            votes: selections,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit your vote. Please try again later.");
      }

      localStorage.setItem("voteRecord", JSON.stringify(selections));
      alert("Thank you for voting!");
      window.location.href = "/congratulations";
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An unknown error occurred.");
      }
    }
  };

  return (
    <main className="p-6 bg-gradient-to-r from-gray-100 via-white to-gray-100 min-h-screen">
      <motion.header
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}>
        <h1 className="text-4xl font-extrabold text-gray-800">
          🗳️ Cast Your Vote
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Your voice matters! Make your vote count.
        </p>
      </motion.header>

      <motion.section
        className="mt-6 bg-white shadow-lg rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}>
        <div className="flex items-center gap-3">
          <span className="bg-blue-500 text-white p-2 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6l4 2"
              />
            </svg>
          </span>
          <p className="text-gray-700 font-medium">
            Login Time Left:{" "}
            <span className="text-blue-500 font-bold">
              {formatTime(loginTimeLeft)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-green-500 text-white p-2 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6l4 2"
              />
            </svg>
          </span>
          <p className="text-gray-700 font-medium">
            Voting Time Left:{" "}
            <span className="text-green-500 font-bold">
              {formatTime(votingTimeLeft)}
            </span>
          </p>
        </div>
        {!isVotingOpen && (
          <p className="text-center text-red-600 font-semibold">
            🚫 Voting is currently closed!
          </p>
        )}
      </motion.section>

      {voterData && (
        <motion.div
          className="mt-6 bg-blue-50 shadow-md rounded-lg p-6 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
              {voterData.fullName[0].toUpperCase()}
            </div>
            <p className="mt-2 text-gray-700">
              Welcome,{" "}
              <span className="text-blue-600 font-semibold">
                {voterData.fullName}
              </span>{" "}
              (<span className="text-gray-500">{voterData.matricNumber}</span>)
            </p>
          </div>
        </motion.div>
      )}

      <motion.section
        className="mt-8 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}>
        {candidates.map((position: Position) => (
          <motion.div
            key={position.position}
            className="bg-white shadow-lg p-6 rounded-lg border border-gray-200 hover:shadow-xl transition"
            whileHover={{ scale: 1.02 }}>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {position.position}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {position.candidates.map((candidate: Candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 p-4 rounded-lg transition shadow-sm">
                  {position.allowMultiple ? (
                    <input
                      type="checkbox"
                      checked={
                        !!selections[position.position]?.includes(
                          candidate.id.toString()
                        )
                      }
                      onChange={() =>
                        handleSelection(
                          position.position,
                          candidate.id.toString(),
                          position.allowMultiple
                        )
                      }
                      className="form-checkbox h-6 w-6 text-blue-500"
                    />
                  ) : (
                    <input
                      type="radio"
                      name={position.position}
                      checked={
                        selections[position.position] ===
                        candidate.id.toString()
                      }
                      onChange={() =>
                        handleSelection(
                          position.position,
                          candidate.id.toString(),
                          position.allowMultiple
                        )
                      }
                      className="form-radio h-6 w-6 text-blue-500"
                    />
                  )}
                  <label className="text-gray-700 font-medium">
                    {candidate.name}
                  </label>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.section>
      <motion.div
        className="text-center mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}>
        <button
          onClick={handleVote}
          className={`relative w-full sm:w-1/3 bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-bold transition duration-300 ease-in-out transform hover:scale-105 ${
            !isVotingOpen ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!isVotingOpen}>
          <span className="absolute inset-0 rounded-lg bg-green-500 opacity-0 group-hover:opacity-30 transition"></span>
          Cast Vote
        </button>
      </motion.div>
    </main>
  );
}
