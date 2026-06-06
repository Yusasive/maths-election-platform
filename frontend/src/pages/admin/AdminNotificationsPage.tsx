import { useEffect, useState } from "react";
import { useNotification } from "../../context/NotificationContext";

interface NotificationTemplate {
  id: string;
  title: string;
  message: string;
  type: "email" | "sms" | "push";
  recipient: "all_voters" | "admins" | "specific_users";
  status: "draft" | "sent" | "scheduled";
  scheduledFor?: Date;
  sentAt?: Date;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationTemplate[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "email" as const,
    recipient: "all_voters" as const,
    scheduledFor: "",
  });
  const { addNotification } = useNotification();

  useEffect(() => {
    setNotifications([
      {
        id: "1",
        title: "Election Starts Tomorrow",
        message: "Dear student, voting will begin tomorrow at 9 AM. Make sure to log in with your matric number.",
        type: "email",
        recipient: "all_voters",
        status: "sent",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
      {
        id: "2",
        title: "System Maintenance Notice",
        message: "The voting system will be under maintenance from 2 AM to 4 AM tonight.",
        type: "push",
        recipient: "all_voters",
        status: "scheduled",
        scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 2),
      },
    ]);
  }, []);

  const handleCreateNotification = () => {
    if (!newNotification.title || !newNotification.message) {
      addNotification("error", "Title and message are required");
      return;
    }

    const notification: NotificationTemplate = {
      id: Date.now().toString(),
      title: newNotification.title,
      message: newNotification.message,
      type: newNotification.type,
      recipient: newNotification.recipient,
      status: newNotification.scheduledFor ? "scheduled" : "sent",
      scheduledFor: newNotification.scheduledFor ? new Date(newNotification.scheduledFor) : undefined,
      sentAt: newNotification.scheduledFor ? undefined : new Date(),
    };

    setNotifications([notification, ...notifications]);
    setNewNotification({ title: "", message: "", type: "email", recipient: "all_voters", scheduledFor: "" });
    setShowCreateForm(false);
    addNotification("success", "Notification created successfully");
  };

  const handleSendNow = (id: string) => {
    setNotifications(notifications.map((n) =>
      n.id === id ? { ...n, status: "sent" as const, sentAt: new Date() } : n
    ));
    addNotification("success", "Notification sent successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          {showCreateForm ? "Cancel" : "Create Notification"}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Create New Notification</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={newNotification.title}
                onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Notification title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                value={newNotification.message}
                onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Notification message"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={newNotification.type}
                  onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push Notification</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                <select
                  value={newNotification.recipient}
                  onChange={(e) => setNewNotification({ ...newNotification, recipient: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="all_voters">All Voters</option>
                  <option value="admins">Admins Only</option>
                  <option value="specific_users">Specific Users</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule For (Optional)</label>
                <input
                  type="datetime-local"
                  value={newNotification.scheduledFor}
                  onChange={(e) => setNewNotification({ ...newNotification, scheduledFor: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Cancel
              </button>
              <button onClick={handleCreateNotification} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                Create Notification
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div key={notification.id} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{notification.title}</h3>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${notification.type === "email" ? "bg-blue-100 text-blue-800" : notification.type === "sms" ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"}`}>
                    {notification.type.toUpperCase()}
                  </span>
                  <span>Recipients: {notification.recipient.replace("_", " ")}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${notification.status === "sent" ? "bg-green-100 text-green-800" : notification.status === "scheduled" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}>
                    {notification.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                {notification.status === "draft" && (
                  <button onClick={() => handleSendNow(notification.id)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                    Send Now
                  </button>
                )}
                <button className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600">Edit</button>
                <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Delete</button>
              </div>
            </div>
            <p className="text-gray-700 mb-2">{notification.message}</p>
            <div className="text-sm text-gray-500">
              {notification.sentAt && <span>Sent: {new Date(notification.sentAt).toLocaleString()}</span>}
              {notification.scheduledFor && <span>Scheduled: {new Date(notification.scheduledFor).toLocaleString()}</span>}
            </div>
          </div>
        ))}
      </div>

      {notifications.length === 0 && !showCreateForm && (
        <div className="text-center py-12">
          <p className="text-gray-500">No notifications created yet.</p>
          <button onClick={() => setShowCreateForm(true)} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            Create Your First Notification
          </button>
        </div>
      )}
    </div>
  );
}
