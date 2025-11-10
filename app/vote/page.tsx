"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import candidates from "../../data/candidates.json";
import { useNotification } from "@/context/NotificationContext";
interface Candidate {
  id: number;
  name: string;
  level: string;
  imageUrl: string;
}

interface Position {
  position: string;
  allowMultiple: boolean;
  candidates: Candidate[];
}

interface mathsVoterData {
  matricNumber: string;
  fullName: string;
}

interface Selections {
  [position: string]: string | string[];
}

const useCountdown = (endTime: number | null): number => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (endTime) {
      const tick = () => setTimeLeft(Math.max(endTime - Date.now(), 0));
      const intervalId = setInterval(tick, 1000);
      tick();
      return () => clearInterval(intervalId);
    }
  }, [endTime]);

  return timeLeft;
};

export default function VotingPage() {
  const [selections, setSelections] = useState<Selections>({});
  const [mathsVoterData, setmathsVoterData] = useState<mathsVoterData | null>(
    null
  );
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const { addNotification } = useNotification();

  const loginEndTime = process.env.NEXT_PUBLIC_LOGIN_END_TIME
    ? new Date(process.env.NEXT_PUBLIC_LOGIN_END_TIME).getTime()
    : null;
  const votingEndTime = process.env.NEXT_PUBLIC_VOTING_END_TIME
    ? new Date(process.env.NEXT_PUBLIC_VOTING_END_TIME).getTime()
    : null;

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
    const storedmathsVoterData = JSON.parse(
      localStorage.getItem("mathsVoterData_v2") || "{}"
    ) as mathsVoterData;

    if (!storedmathsVoterData?.matricNumber) {
      addNotification("error", "You must log in first!");
      window.location.href = "/";
      return;
    }

    const hasVoted = localStorage.getItem("mathsVoteRecord_v2");

    if (hasVoted) {
      addNotification("warning", "You have already voted!");
      window.location.href = "/congratulations";
      return;
    }

    setmathsVoterData(storedmathsVoterData);

    const interval = setInterval(() => {
      setIsVotingOpen(Date.now() <= (votingEndTime || 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [votingEndTime, addNotification]);

  // Narrow candidates loaded from JSON to a safe, non-nullable array of Position
  const validCandidates = (candidates as Array<Position | undefined>).filter(
    (p): p is Position =>
      !!p &&
      typeof p.position === "string" &&
      Array.isArray(p.candidates) &&
      p.candidates.every((c) => c && typeof c.id === "number")
  );

  const handleVote = async () => {
    if (!isVotingOpen) {
      addNotification("error", "Voting is closed.");
      return;
    }

    const allPositions = validCandidates.map(
      (position: Position) => position.position
    );
    const missingVotes = allPositions.filter(
      (pos) => !selections[pos] || (selections[pos] as string[]).length === 0
    );

    if (missingVotes.length > 0) {
      addNotification(
        "warning",
        `You must vote for all positions: ${missingVotes.join(", ")}`
      );
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/votes/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matricNumber: mathsVoterData?.matricNumber,
            votes: selections,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit your vote. Please try again later.");
      }

      localStorage.setItem("mathsVoteRecord_v2", JSON.stringify(selections));
      addNotification("success", "Thank you for voting!");
      window.location.href = "/congratulations";
    } catch (error) {
      if (error instanceof Error) {
        addNotification("error", error.message);
      } else {
        addNotification("error", "An unknown error occurred.");
      }
    }
  };

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

  return (
    <main className="p-6 bg-gradient-to-r from-gray-100 via-white to-gray-100 min-h-screen">
      <motion.header
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl font-extrabold text-gray-800">
          🗳️ Cast Your Vote
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Your voice matters! Make your vote count.
        </p>
      </motion.header>

      <motion.section className="mt-6 bg-white shadow-lg rounded-lg p-6">
        <p className="text-gray-700 font-medium">
          Login Time Left:{" "}
          <span className="text-blue-500 font-bold">
            {formatTime(loginTimeLeft)}
          </span>
        </p>
        <p className="text-gray-700 font-medium mt-4">
          Voting Time Left:{" "}
          <span className="text-green-500 font-bold">
            {formatTime(votingTimeLeft)}
          </span>
        </p>
        {!isVotingOpen && (
          <p className="text-center text-red-600 font-semibold mt-4">
            🚫 Voting is currently closed!
          </p>
        )}
      </motion.section>

      <motion.section
        className="mt-8 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        {validCandidates.map((position: Position) => (
          <motion.div
            key={position.position}
            className="bg-white shadow-lg p-6 rounded-lg border border-gray-200 hover:shadow-xl transition"
            whileHover={{ scale: 1.02 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {position.position}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {position.candidates.map((candidate: Candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 p-4 rounded-lg transition shadow-sm"
                >
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
                  <div className="flex flex-row space-x-1">
                    <Image
                      src={candidate.imageUrl}
                      alt={`${candidate.name}'s photo`}
                      width={40}
                      height={25}
                      className="rounded-full"
                    />
                    <label className="text-gray-700 font-medium">
                      {candidate.name} <br /> {candidate.level}
                    </label>
                  </div>
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
        transition={{ delay: 1, duration: 0.8 }}
      >
        <button
          onClick={handleVote}
          className={`relative w-full sm:w-1/3 bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-bold transition duration-300 ease-in-out transform hover:scale-105 ${
            !isVotingOpen ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!isVotingOpen}
        >
          <span className="absolute inset-0 rounded-lg bg-green-500 opacity-0 group-hover:opacity-30 transition"></span>
          Cast Vote
        </button>
      </motion.div>
    </main>
  );
}
