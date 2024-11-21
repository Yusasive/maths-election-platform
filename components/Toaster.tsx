"use client";

import React from "react";
import { useNotification } from "@/context/NotificationContext";

const Toaster: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 space-y-4 z-50">
      {notifications.map(({ id, type, message }) => (
        <div
          key={id}
          className={`flex items-center p-4 rounded-lg shadow-md text-white ${
            type === "success"
              ? "bg-green-500"
              : type === "error"
              ? "bg-red-500"
              : type === "info"
              ? "bg-blue-500"
              : "bg-yellow-500"
          }`}
        >
          <span className="mr-2">
            {type === "success" && "✅"}
            {type === "error" && "❌"}
            {type === "info" && "ℹ️"}
            {type === "warning" && "⚠️"}
          </span>
          <span>{message}</span>
          <button
            onClick={() => removeNotification(id)}
            className="ml-auto text-lg font-bold px-2"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toaster;
