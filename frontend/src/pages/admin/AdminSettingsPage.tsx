import { useState, useEffect } from "react";
import { useNotification } from "../../context/NotificationContext";

interface Settings {
  votingStartTime: string;
  votingEndTime: string;
  loginEndTime: string;
  electionName: string;
  electionDescription: string;
  adminEmails: string[];
  mongodbUri: string;
  apiUrl: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    votingStartTime: "",
    votingEndTime: "",
    loginEndTime: "",
    electionName: "Department of Mathematics Voting Platform",
    electionDescription: "",
    adminEmails: [],
    mongodbUri: "",
    apiUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    setSettings({
      votingStartTime: import.meta.env.VITE_VOTING_START_TIME || "",
      votingEndTime: import.meta.env.VITE_VOTING_END_TIME || "",
      loginEndTime: import.meta.env.VITE_LOGIN_END_TIME || "",
      electionName: "Department of Mathematics Voting Platform",
      electionDescription: "",
      adminEmails: [],
      mongodbUri: "",
      apiUrl: import.meta.env.VITE_API_URL || "",
    });
    setLoading(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addNotification("success", "Settings saved successfully!");
    } catch {
      addNotification("error", "Failed to save settings");
    } finally {
      setSaving(false);
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
        <h2 className="text-2xl font-bold">Settings</h2>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Election Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Election Name</label>
            <input type="text" name="electionName" value={settings.electionName} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Election Description</label>
            <textarea name="electionDescription" value={settings.electionDescription} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="Brief description of the election" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Voting Period</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Voting Start Time", name: "votingStartTime" },
            { label: "Login End Time", name: "loginEndTime" },
            { label: "Voting End Time", name: "votingEndTime" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
              <input type="datetime-local" name={field.name} value={(settings as any)[field.name]} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">System Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">MongoDB URI</label>
            <input type="password" name="mongodbUri" value={settings.mongodbUri} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="mongodb://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Base URL</label>
            <input type="url" name="apiUrl" value={settings.apiUrl} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="https://api.example.com" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Admin Management</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Emails (comma-separated)</label>
            <input
              type="text"
              value={settings.adminEmails.join(", ")}
              onChange={(e) => setSettings({ ...settings, adminEmails: e.target.value.split(",").map((e) => e.trim()) })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="admin1@example.com, admin2@example.com"
            />
          </div>
          <div className="flex space-x-4">
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Add New Admin</button>
            <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Remove Admin</button>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-800">Reset All Votes</p>
              <p className="text-sm text-red-600">This will permanently delete all votes. This action cannot be undone.</p>
            </div>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Reset Votes</button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-800">Clear All Data</p>
              <p className="text-sm text-red-600">This will delete all users, votes, and settings. Use with extreme caution.</p>
            </div>
            <button className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800">Clear All Data</button>
          </div>
        </div>
      </div>
    </div>
  );
}
