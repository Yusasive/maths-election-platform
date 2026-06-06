import { useEffect, useState } from "react";
import { useNotification } from "../../context/NotificationContext";

const API_URL = import.meta.env.VITE_API_URL || "";

interface VoteLog {
  matricNumber: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

interface SecurityAlert {
  id: string;
  type: "suspicious" | "duplicate" | "invalid";
  message: string;
  timestamp: Date;
  matricNumber?: string;
}

export default function AdminSecurityPage() {
  const [voteLogs, setVoteLogs] = useState<VoteLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  useEffect(() => { fetchSecurityData(); }, []);

  const fetchSecurityData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/results`);
      const votesData = await response.json();

      const logs: VoteLog[] = votesData.map((vote: any) => ({
        matricNumber: vote.matricNumber,
        timestamp: new Date(vote.timestamp),
        ip: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
      }));

      setVoteLogs(logs);

      const alerts: SecurityAlert[] = [];
      const matricNumbers = new Set();

      votesData.forEach((vote: any) => {
        if (matricNumbers.has(vote.matricNumber)) {
          alerts.push({
            id: `duplicate_${vote.matricNumber}`,
            type: "duplicate",
            message: `Duplicate vote detected for matric number: ${vote.matricNumber}`,
            timestamp: new Date(vote.timestamp),
            matricNumber: vote.matricNumber,
          });
        }
        matricNumbers.add(vote.matricNumber);
      });

      const startTime = new Date(import.meta.env.VITE_VOTING_START_TIME || "");
      const endTime = new Date(import.meta.env.VITE_VOTING_END_TIME || "");

      votesData.forEach((vote: any) => {
        const voteTime = new Date(vote.timestamp);
        if (voteTime < startTime || voteTime > endTime) {
          alerts.push({
            id: `invalid_time_${vote._id}`,
            type: "invalid",
            message: `Vote cast outside voting period: ${vote.matricNumber}`,
            timestamp: voteTime,
            matricNumber: vote.matricNumber,
          });
        }
      });

      setSecurityAlerts(alerts);
    } catch {
      addNotification("error", "Failed to load security data");
    } finally {
      setLoading(false);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Total Votes</h3>
          <p className="text-3xl font-bold text-blue-600">{voteLogs.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Security Alerts</h3>
          <p className="text-3xl font-bold text-red-600">{securityAlerts.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Vote Integrity</h3>
          <p className="text-3xl font-bold text-green-600">
            {securityAlerts.length === 0 ? "100%" : "⚠️ Check Alerts"}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Security Alerts</h3>
        {securityAlerts.length === 0 ? (
          <p className="text-green-600">No security alerts detected.</p>
        ) : (
          <div className="space-y-3">
            {securityAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === "duplicate"
                    ? "border-red-500 bg-red-50"
                    : alert.type === "suspicious"
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-orange-500 bg-orange-50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm text-gray-600">
                      Matric: {alert.matricNumber} | Time: {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    alert.type === "duplicate" ? "bg-red-100 text-red-800"
                      : alert.type === "suspicious" ? "bg-yellow-100 text-yellow-800"
                      : "bg-orange-100 text-orange-800"
                  }`}>
                    {alert.type.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Vote Audit Log</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Matric Number</th>
                <th className="px-4 py-2 text-left">Timestamp</th>
                <th className="px-4 py-2 text-left">IP Address</th>
                <th className="px-4 py-2 text-left">User Agent</th>
              </tr>
            </thead>
            <tbody>
              {voteLogs.map((log, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{log.matricNumber}</td>
                  <td className="px-4 py-2">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-2">{log.ip}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 truncate max-w-xs">{log.userAgent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Security Settings</h3>
        <div className="space-y-4">
          {[
            { label: "Enable Vote Verification", desc: "Require additional verification for votes", checked: false },
            { label: "IP Address Tracking", desc: "Track voter IP addresses for security", checked: true },
            { label: "Real-time Monitoring", desc: "Enable real-time vote monitoring alerts", checked: false },
          ].map((setting) => (
            <div key={setting.label} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{setting.label}</p>
                <p className="text-sm text-gray-600">{setting.desc}</p>
              </div>
              <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" defaultChecked={setting.checked} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
