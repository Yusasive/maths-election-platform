"use client";

import { useEffect, useState } from "react";

interface VoteData {
  position?: string;
  votes?: number[];
}

interface ProcessedVotes {
  [position: string]: {
    [candidateId: string]: number;
  };
}

export default function ResultsPage() {
  const [votes, setVotes] = useState<ProcessedVotes>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await fetch("https://65130c258e505cebc2e981a1.mockapi.io/votes");
  
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
  
        const data: VoteData[] = await response.json(); // Parse JSON response
  
        if (!data || data.length === 0) {
          throw new Error("No data available from the server.");
        }
  
        console.log("Fetched API data:", data); // Debug log
  
        // Process the data as you did with mock data
        const processedVotes = data.reduce<ProcessedVotes>((acc, vote) => {
          const position = vote.position || "Unknown Position";
          const userVotes = vote.votes || [];
  
          if (!acc[position]) {
            acc[position] = {};
          }
  
          userVotes.forEach((candidateId) => {
            if (!acc[position][candidateId]) {
              acc[position][candidateId] = 0;
            }
            acc[position][candidateId]++;
          });
  
          return acc;
        }, {});
  
        console.log("Processed Votes from API:", processedVotes); // Debug log
        setVotes(processedVotes);
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error fetching results:", error.message);
        } else {
          console.error("Unknown error occurred:", error);
        }
      } finally {
        setLoading(false); // Ensure loading state is turned off
      }
    };
  
    fetchResults();
  }, []);
  
  

  const renderResults = () => {
    if (Object.keys(votes).length === 0) {
      return (
        <div className="text-center mt-16">
          <p className="text-gray-500 text-lg">No results available at the moment. Please check back later.</p>
        </div>
      );
    }

    return Object.keys(votes).map((position) => {
      const candidates = votes[position];
      return (
        <div
          key={position}
          className="bg-white shadow-lg p-6 rounded-lg mb-6 border border-gray-200 hover:shadow-xl transition"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{position}</h2>
          <ul className="mt-4 space-y-2">
            {Object.entries(candidates).map(([candidateId, voteCount]) => (
              <li
                key={candidateId}
                className="flex justify-between items-center bg-gray-50 p-3 rounded-lg shadow-sm hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    {candidateId}
                  </div>
                  <span className="text-gray-700 font-medium">Candidate {candidateId}</span>
                </div>
                <span className="text-gray-600 font-bold">{voteCount} Votes</span>
              </li>
            ))}
          </ul>
        </div>
      );
    });
  };

  return (
    <main className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-6">🗳️ Election Results</h1>

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
