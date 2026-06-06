import { useEffect, useMemo, useState } from "react";
import { useNotification } from "../context/NotificationContext";

const API_URL = import.meta.env.VITE_API_URL || "";
const votingStartTimeEnv = import.meta.env.VITE_VOTING_START_TIME;
const votingEndTimeEnv = import.meta.env.VITE_VOTING_END_TIME;

interface FormData {
  matricNumber: string;
  fullName: string;
  department: string;
  image: File | string;
}

export default function HomePage() {
  const { addNotification } = useNotification();

  const [formData, setFormData] = useState<FormData>({
    matricNumber: "",
    fullName: "",
    department: "",
    image: "",
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const votingStartTime = useMemo(() => new Date(votingStartTimeEnv || ""), []);
  const votingEndTime = useMemo(() => new Date(votingEndTimeEnv || ""), []);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isVotingPeriod, setIsVotingPeriod] = useState(false);
  const [, setUploading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentTime < votingStartTime) {
      const timeDiff = votingStartTime.getTime() - currentTime.getTime();
      setTimeRemaining(formatTime(timeDiff));
      setIsVotingPeriod(false);
    } else if (currentTime >= votingStartTime && currentTime <= votingEndTime) {
      const timeDiff = votingEndTime.getTime() - currentTime.getTime();
      setTimeRemaining(formatTime(timeDiff));
      setIsVotingPeriod(true);
    } else {
      setTimeRemaining("Voting has ended.");
      setIsVotingPeriod(false);
    }
  }, [currentTime, votingStartTime, votingEndTime]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    if (formData.image instanceof File) {
      const objectUrl = URL.createObjectURL(formData.image);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (typeof formData.image === "string") {
      setPreviewUrl(formData.image);
    } else {
      setPreviewUrl(null);
    }
  }, [formData.image]);

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "votingApp");

      const response = await fetch(`${API_URL}/api/upload/`, {
        method: "POST",
        body: data,
      });

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
    } finally {
      setUploading(false);
    }
  };

  const handleLogin = async () => {
    if (localStorage.getItem("mathsVoteRecord_v2") === "true") {
      addNotification("info", "You have already voted on this device.");
      return;
    }

<<<<<<< HEAD:frontend/src/pages/HomePage.tsx
    if (localStorage.getItem("mathsVoterData") && !localStorage.getItem("mathsVoteRecord")) {
=======
    if (
      localStorage.getItem("mathsVoterData_v2") &&
      !localStorage.getItem("mathsVoteRecord_v2")
    ) {
>>>>>>> 0be7d29fe94aec1aec8884fa0b40bb9655297213:app/page.tsx
      addNotification("info", "You've logged in before. Proceed to vote.");
      window.location.href = "/vote";
      return;
    }

    if (!isVotingPeriod) {
      addNotification("error", "You can only log in during the voting period.");
      return;
    }

    if (!formData.matricNumber || !formData.fullName || !formData.department || !formData.image) {
      addNotification("error", "All fields are required.");
      return;
    }

    try {
      const imageFile = formData.image instanceof File ? formData.image : null;
      const imageUrl = imageFile ? await uploadImage(imageFile) : formData.image;

      if (!imageUrl) {
        addNotification("error", "Image upload failed. Please try again.");
        return;
      }

      const response = await fetch(`${API_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matricNumber: formData.matricNumber.toLowerCase(),
          fullName: formData.fullName,
          department: formData.department,
          image: imageUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        addNotification("error", result.error || "Failed to log in.");
        return;
      }

      const mathsVoterData = {
        matricNumber: formData.matricNumber.toLowerCase(),
        fullName: formData.fullName,
        department: formData.department,
        image: imageUrl,
      };

<<<<<<< HEAD:frontend/src/pages/HomePage.tsx
      localStorage.setItem("mathsVoterData", JSON.stringify(mathsVoterData));
=======
      localStorage.setItem("mathsVoterData_v2", JSON.stringify(mathsVoterData));

>>>>>>> 0be7d29fe94aec1aec8884fa0b40bb9655297213:app/page.tsx
      addNotification("success", "Login successful! Proceed to vote.");
      window.location.href = "/vote";
    } catch (error) {
      // console.error("Login error:", error);
      addNotification("error", "An error occurred while logging in.");
    }
  }; 

  return (
    <main className="flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl md:text-4xl text-blue-500 font-bold pt-12 text-center">
        Department of Mathematics Bye-Election Voting Platform
      </h1>
      <a
        href="/admin/login"
        className="text-sm text-gray-600 hover:text-blue-600 underline mt-2"
      >
        Admin Login
      </a>
      <img src="/maths.png" alt="Mathematics Department" width={100} height={80} />
      <div className="mt-4">
        {isVotingPeriod ? (
          <p className="text-center mt-4 flex items-center justify-center space-x-2">
            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-lg font-bold shadow-sm animate-pulse flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 mr-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6l4 2m-4-8.5A8.5 8.5 0 1112 3a8.5 8.5 0 010 17z"
                />
              </svg>
              Time Remaining: <strong>{timeRemaining}</strong>
            </span>
          </p>
        ) : (
          <p className="text-red-600 text-center mx-8">
            {currentTime < votingStartTime
              ? `Voting has not started yet. Time remaining: `
              : `.`}
            <strong>{timeRemaining}</strong>
          </p>
        )}
      </div>
      <form
        className="bg-gray50 shadow-sm rounded px-8 pt-6 pb-8 mt-6 w-full max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
      >
        <input
          type="text"
          name="matricNumber"
          placeholder="Matric Number"
          className="w-full mb-4 px-4 py-2 border rounded-lg text-gray-600 font-semibold"
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          className="w-full mb-4 px-4 py-2 border rounded-lg text-gray-600 font-semibold"
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="department"
          placeholder="Department"
          className="w-full mb-4 px-4 py-2 border rounded-lg text-gray-600 font-semibold"
          onChange={handleInputChange}
        />
        <div className="relative w-full mb-4">
          <label
            htmlFor="image"
            className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg text-gray-600 font-semibold bg-white cursor-pointer hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-blue-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 16v6m0 0l-4-4m4 4l4-4m-4-2a9 9 0 110-18 9 9 0 010 18z"
              />
            </svg>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected file preview"
                className="object-cover rounded"
                width={96}
                height={96}
              />
            ) : (
              <span className="text-gray-600">Upload ID Card or Course Form</span>
            )}
          </label>
          <input
            id="image"
            type="file"
            name="image"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setFormData({ ...formData, image: file });
              }
            }}
          />
        </div>

        <button
          type="submit"
          className={`w-full bg-blue-500 font-semibold text-white py-2 px-4 rounded-lg ${
            !isVotingPeriod ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!isVotingPeriod}
        >
          Login & Vote
        </button>
      </form>
    </main>
  );
}
