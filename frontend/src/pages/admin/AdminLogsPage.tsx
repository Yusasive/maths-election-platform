import { useEffect, useState } from "react";

interface LogEntry {
  id: string;
  timestamp: Date;
  level: "info" | "warning" | "error";
  message: string;
  user?: string;
  action: string;
  ip?: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "info" | "warning" | "error">("all");

  useEffect(() => {
    const mockLogs: LogEntry[] = [
      { id: "1", timestamp: new Date(Date.now() - 1000 * 60 * 5), level: "info", message: "User logged in successfully", user: "john.doe@school.edu", action: "LOGIN", ip: "192.168.1.100" },
      { id: "2", timestamp: new Date(Date.now() - 1000 * 60 * 10), level: "info", message: "Vote submitted for President position", user: "CSC/2020/001", action: "VOTE", ip: "192.168.1.101" },
      { id: "3", timestamp: new Date(Date.now() - 1000 * 60 * 15), level: "warning", message: "Failed login attempt - invalid credentials", user: "unknown", action: "LOGIN_FAILED", ip: "192.168.1.102" },
      { id: "4", timestamp: new Date(Date.now() - 1000 * 60 * 20), level: "error", message: "Database connection timeout", action: "SYSTEM_ERROR", ip: "127.0.0.1" },
      { id: "5", timestamp: new Date(Date.now() - 1000 * 60 * 25), level: "info", message: "Admin updated election settings", user: "admin@school.edu", action: "SETTINGS_UPDATE", ip: "192.168.1.1" },
    ];
    setLogs(mockLogs);
    setLoading(false);
  }, []);

  const filteredLogs = logs.filter((log) => filter === "all" || log.level === filter);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error": return "text-red-600 bg-red-100";
      case "warning": return "text-yellow-600 bg-yellow-100";
      case "info": return "text-blue-600 bg-blue-100";
      default: return "text-gray-600 bg-gray-100";
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
        <h2 className="text-2xl font-bold">System Logs</h2>
        <div className="flex space-x-4">
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="px-3 py-2 border rounded-lg">
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Export Logs</button>
          <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">Clear Logs</button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Activity Logs</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredLogs.map((log) => (
            <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{log.action}</span>
                </div>
                <span className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-700">{log.message}</p>
                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                  {log.user && <span>User: {log.user}</span>}
                  {log.ip && <span>IP: {log.ip}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredLogs.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">No logs found for the selected filter.</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: "📋", label: "Total Logs", count: logs.length, bg: "bg-blue-100" },
          { icon: "ℹ️", label: "Info", count: logs.filter((l) => l.level === "info").length, bg: "bg-green-100" },
          { icon: "⚠️", label: "Warnings", count: logs.filter((l) => l.level === "warning").length, bg: "bg-yellow-100" },
          { icon: "❌", label: "Errors", count: logs.filter((l) => l.level === "error").length, bg: "bg-red-100" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className={`p-2 ${stat.bg} rounded-lg`}><span className="text-2xl">{stat.icon}</span></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
