import { useEffect, useState } from "react";
import { useNotification } from "../../context/NotificationContext";

const API_URL = import.meta.env.VITE_API_URL || "";

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

export default function AdminCandidatesPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPosition, setEditingPosition] = useState<string | null>(null);
  const [newCandidate, setNewCandidate] = useState({ name: "", level: "", image: null as File | null });
  const { addNotification } = useNotification();

  useEffect(() => { fetchCandidates(); }, []);

  const fetchCandidates = async () => {
    try {
      const response = await fetch(`${API_URL}/api/candidates`);
      const data = await response.json();
      setPositions(data);
    } catch {
      addNotification("error", "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "votingApp");

      const response = await fetch(`${API_URL}/api/upload/`, { method: "POST", body: formData });

      if (!response.ok) {
        const result = await response.json();
        addNotification("error", result.error || "Failed to upload image.");
        return null;
      }

      const result = await response.json();
      return result.url;
    } catch {
      addNotification("error", "Error uploading image.");
      return null;
    }
  };

  const handleAddCandidate = async (positionName: string) => {
    if (!newCandidate.name || !newCandidate.level || !newCandidate.image) {
      addNotification("error", "All fields are required");
      return;
    }

    try {
      const imageUrl = await uploadImage(newCandidate.image);
      if (!imageUrl) return;

      const newCandidateData = { id: Date.now(), name: newCandidate.name, level: newCandidate.level, imageUrl };

      setPositions((prev) =>
        prev.map((pos) =>
          pos.position === positionName
            ? { ...pos, candidates: [...pos.candidates, newCandidateData] }
            : pos
        )
      );

      setNewCandidate({ name: "", level: "", image: null });
      setEditingPosition(null);
      addNotification("success", "Candidate added successfully");
    } catch {
      addNotification("error", "Failed to add candidate");
    }
  };

  const handleDeleteCandidate = (positionName: string, candidateId: number) => {
    setPositions((prev) =>
      prev.map((pos) =>
        pos.position === positionName
          ? { ...pos, candidates: pos.candidates.filter((c) => c.id !== candidateId) }
          : pos
      )
    );
    addNotification("success", "Candidate removed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Candidates</h2>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
          Add New Position
        </button>
      </div>

      {positions.map((position) => (
        <div key={position.position} className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">{position.position}</h3>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded text-sm ${position.allowMultiple ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                {position.allowMultiple ? "Multiple votes" : "Single vote"}
              </span>
              <button
                onClick={() => setEditingPosition(editingPosition === position.position ? null : position.position)}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
              >
                Add Candidate
              </button>
            </div>
          </div>

          {editingPosition === position.position && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">Add New Candidate</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Candidate Name"
                  className="px-3 py-2 border rounded"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Level (e.g., 300L)"
                  className="px-3 py-2 border rounded"
                  value={newCandidate.level}
                  onChange={(e) => setNewCandidate({ ...newCandidate, level: e.target.value })}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="px-3 py-2 border rounded"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setNewCandidate({ ...newCandidate, image: file });
                  }}
                />
              </div>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() => handleAddCandidate(position.position)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add Candidate
                </button>
                <button
                  onClick={() => setEditingPosition(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {position.candidates.map((candidate) => (
              <div key={candidate.id} className="border rounded-lg p-4 flex items-center space-x-3">
                <img
                  src={candidate.imageUrl}
                  alt={candidate.name}
                  width={50}
                  height={50}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{candidate.name}</h4>
                  <p className="text-sm text-gray-600">{candidate.level}</p>
                </div>
                <button
                  onClick={() => handleDeleteCandidate(position.position, candidate.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
