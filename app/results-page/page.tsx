"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Candidate {
  id: number;
  name: string;
  level: string;
  imageUrl: string;
}

interface PositionData {
  position: string;
  allowMultiple: boolean;
  candidates: Candidate[];
}

interface MongoDBVote {
  matricNumber: string;
  votes: {
    [position: string]: string | string[];
  };
}

interface AggregatedVotes {
  [position: string]: {
    [candidateId: string]: number;
  };
}

export default function ResultsPage() {
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [voteResults, setVoteResults] = useState<AggregatedVotes>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const positionResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/candidates/`
        );
        if (!positionResponse.ok) {
          throw new Error(
            `Failed to fetch candidates: ${positionResponse.status}`
          );
        }
        const positionsData: PositionData[] = await positionResponse.json();
        setPositions(positionsData);

        const voteResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/results/`
        );
        if (!voteResponse.ok) {
          throw new Error(`Failed to fetch votes: ${voteResponse.status}`);
        }
        const rawVotes: MongoDBVote[] = await voteResponse.json();

        const aggregatedResults: AggregatedVotes = {};

        rawVotes.forEach((mathsVoteRecord) => {
          Object.entries(mathsVoteRecord.votes).forEach(
            ([position, candidateIds]) => {
              if (!aggregatedResults[position]) {
                aggregatedResults[position] = {};
              }

              const ids = Array.isArray(candidateIds)
                ? candidateIds
                : [candidateIds];

              ids.forEach((id) => {
                if (!aggregatedResults[position][id]) {
                  aggregatedResults[position][id] = 0;
                }
                aggregatedResults[position][id]++;
              });
            }
          );
        });

        setVoteResults(aggregatedResults);
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const renderResults = () => {
    if (positions.length === 0 || Object.keys(voteResults).length === 0) {
      return (
        <div className="text-center mt-16">
          <p className="text-gray-500 text-lg">
            No results available at the moment. Please check back later.
          </p>
        </div>
      );
    }

    return positions.map((position) => {
      const positionVotes = voteResults[position.position] || {};
      return (
        <div
          key={position.position}
          className="bg-white shadow-lg p-6 rounded-lg mb-6 border border-gray-200 hover:shadow-xl transition"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {position.position}
          </h2>
          <ul className="mt-4 space-y-2">
            {position.candidates.map((candidate) => {
              const voteCount = positionVotes[candidate.id] || 0;
              return (
                <li
                  key={candidate.id}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded-lg shadow-sm hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={candidate.imageUrl}
                      alt={candidate.name}
                      height={32}
                      width={32}
                      className="rounded-full"
                    />
                    <div>
                      <span className="text-gray-700 font-medium">
                        {candidate.name}
                      </span>
                      <br />
                      <span className="text-gray-500 text-sm">
                        {candidate.level}
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-600 font-bold">
                    {voteCount} Votes
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      );
    });
  };

  return (
    <main className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-6">
          🗳️ Election Results
        </h1>

        {loading ? (
          <div className="flex justify-center items-center mt-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">{renderResults()}</div>
        )}
      </div>
    </main>
  );
}
