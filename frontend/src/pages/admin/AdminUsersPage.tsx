import { useEffect, useState } from "react";
import { useNotification } from "../../context/NotificationContext";

const API_URL = import.meta.env.VITE_API_URL || "";

interface Voter {
  _id: string;
  matricNumber: string;
  fullName: string;
  department: string;
  image: string;
  createdAt: Date;
  hasVoted?: boolean;
}

export default function AdminUsersPage() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"voters" | "admins">("voters");
  const { addNotification } = useNotification();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const votersResponse = await fetch(`${API_URL}/api/admin/users`);
      if (votersResponse.ok) setVoters(await votersResponse.json());

      const adminsResponse = await fetch(`${API_URL}/api/admin/list`);
      if (adminsResponse.ok) setAdmins(await adminsResponse.json());
    } catch {
      addNotification("error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoter = async (matricNumber: string) => {
    if (!confirm("Are you sure you want to delete this voter?")) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${matricNumber}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setVoters(voters.filter((v) => v.matricNumber !== matricNumber));
        addNotification("success", "Voter deleted successfully");
      } else {
        addNotification("error", "Failed to delete voter");
      }
    } catch {
      addNotification("error", "Failed to delete voter");
    }
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
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex space-x-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Export Users</button>
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Send Notification</button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(["voters", "admins"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab === "voters" ? `Voters (${voters.length})` : `Admins (${admins.length})`}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "voters" && (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">Registered Voters</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Voter", "Matric Number", "Department", "Registration Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {voters.map((voter) => (
                  <tr key={voter._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img src={voter.image} alt={voter.fullName} width={40} height={40} className="rounded-full" />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{voter.fullName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{voter.matricNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{voter.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(voter.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${voter.hasVoted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {voter.hasVoted ? "Voted" : "Registered"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => handleDeleteVoter(voter.matricNumber)} className="text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "admins" && (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium">Administrators</h3>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Add Admin</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Name", "Email", "Role", "Created", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((admin) => (
                  <tr key={admin._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{admin.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
