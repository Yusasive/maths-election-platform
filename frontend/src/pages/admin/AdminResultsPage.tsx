import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

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
  votes: { [position: string]: string | string[] };
}

interface AggregatedVotes {
  [position: string]: { [candidateId: string]: number };
}

export default function AdminResultsPage() {
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [voteResults, setVoteResults] = useState<AggregatedVotes>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const positionResponse = await fetch(`${API_URL}/api/candidates/`);
        if (!positionResponse.ok) throw new Error(`Failed to fetch candidates: ${positionResponse.status}`);
        const positionsData: PositionData[] = await positionResponse.json();
        setPositions(positionsData);

        const voteResponse = await fetch(`${API_URL}/api/results/`);
        if (!voteResponse.ok) throw new Error(`Failed to fetch votes: ${voteResponse.status}`);
        const rawVotes: MongoDBVote[] = await voteResponse.json();

        const aggregated: AggregatedVotes = {};
        rawVotes.forEach((record) => {
          Object.entries(record.votes).forEach(([position, candidateIds]) => {
            if (!aggregated[position]) aggregated[position] = {};
            const ids = Array.isArray(candidateIds) ? candidateIds : [candidateIds];
            ids.forEach((id) => { aggregated[position][id] = (aggregated[position][id] || 0) + 1; });
          });
        });

        setVoteResults(aggregated);
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
          <p className="text-gray-500 text-lg">No results available at the moment.</p>
        </div>
      );
    }

    return positions.map((position) => {
      const positionVotes = voteResults[position.position] || {};
      const totalForPosition = Object.values(positionVotes).reduce((sum, c) => sum + c, 0);
      const sortedCandidates = position.candidates
        .map((c) => ({ ...c, voteCount: positionVotes[c.id] || 0 }))
        .sort((a, b) => b.voteCount - a.voteCount);

      return (
        <div key={position.position} className="bg-white shadow-lg p-6 rounded-lg mb-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">{position.position}</h2>
            <span className="text-sm text-gray-600">Total votes: {totalForPosition}</span>
          </div>

          <div className="space-y-4">
            {sortedCandidates.map((candidate) => {
              const percentage = totalForPosition > 0 ? (candidate.voteCount / totalForPosition) * 100 : 0;
              return (
                <div key={candidate.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <img src={candidate.imageUrl} alt={candidate.name} height={50} width={50} className="rounded-full" />
                    <div>
                      <span className="text-gray-700 font-medium">{candidate.name}</span>
                      <br />
                      <span className="text-gray-500 text-sm">{candidate.level}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-600 font-bold text-lg">{candidate.voteCount} votes</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Election Results</h2>
        <div className="flex space-x-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Export Results</button>
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Publish Results</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center mt-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">{renderResults()}</div>
      )}
    </div>
  );
}
