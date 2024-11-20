"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

const votingStartTimeEnv = process.env.NEXT_PUBLIC_VOTING_START_TIME;
const votingEndTimeEnv = process.env.NEXT_PUBLIC_VOTING_END_TIME;

export default function HomePage() {
  const [formData, setFormData] = useState({
    matricNumber: "",
    fullName: "",
    department: "",
    image: "",
  });

  const votingStartTime = useMemo(() => new Date(votingStartTimeEnv || ""), []);
  const votingEndTime = useMemo(() => new Date(votingEndTimeEnv || ""), []);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isVotingPeriod, setIsVotingPeriod] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval); 
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      if (currentTime < votingStartTime) {
        const timeDiff = votingStartTime.getTime() - currentTime.getTime();
        setTimeRemaining(formatTime(timeDiff));
        setIsVotingPeriod(false);
      } else if (
        currentTime >= votingStartTime &&
        currentTime <= votingEndTime
      ) {
        const timeDiff = votingEndTime.getTime() - currentTime.getTime();
        setTimeRemaining(formatTime(timeDiff));
        setIsVotingPeriod(true);
      } else {
        setTimeRemaining("Voting has ended.");
        setIsVotingPeriod(false);
      }
    };

    updateCountdown();
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

  const uploadImage = async (file: File): Promise<string> => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "your_upload_preset"); 
    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/your_cloud_name/image/upload",
        { method: "POST", body: formData }
      );
      const data = await response.json();
      return data.secure_url;
    } catch {
      alert("Image upload failed.");
      return "";
    } finally {
      setUploading(false);
    }
  };

  const handleLogin = async () => {
    if (!isVotingPeriod) {
      alert("You can only log in during the voting period.");
      return;
    }

    if (
      !formData.matricNumber ||
      !formData.fullName ||
      !formData.department ||
      !formData.image
    ) {
      alert("All fields are required.");
      return;
    }

    try {
      const imageUrl = await uploadImage(formData.image as unknown as File);
      if (!imageUrl) return;

      const response = await fetch("/api/login", {
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
        alert(result.error || "Failed to log in.");
        return;
      }

      localStorage.setItem("voterData", JSON.stringify(formData));
      window.location.href = "/vote";
    } catch (error) {
      alert("An error occurred while logging in.");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl md:text-4xl text-blue-500 font-bold pt-12 text-center">
        Department of Mathematics Election Voting
      </h1>
      <Image
        src="/maths.png"
        alt="Mathematics Department"
        width={100}
        height={80}
      />
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
                className="w-6 h-6 mr-2">
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
          <p className="text-red-600">
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
        }}>
        <input
          type="text"
          name="matricNumber"
          placeholder="Matric Number"
          className="w-full mb-4 px-4 py-2 border rounded-lg text-gray-600  font-semibold"
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
            className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg text-gray-600 font-semibold bg-white cursor-pointer hover:bg-gray-50 focus:ring-2 focus:ring-blue-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-blue-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 16v6m0 0l-4-4m4 4l4-4m-4-2a9 9 0 110-18 9 9 0 010 18z"
              />
            </svg>
            {formData.image ? (
              <Image
                src={formData.image}
                alt="Selected file preview"
                className="object-cover rounded"
                width={96}
                height={96}
              />
            ) : (
              <span className="text-gray-600">
                Upload ID Card or Course Form
              </span>
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
                setFormData({
                  ...formData,
                  image: URL.createObjectURL(file),
                });
              }
            }}
          />
        </div>

        <button
          type="submit"
          className={`w-full bg-blue-500 font-semibold text-white py-2 px-4 rounded-lg ${
            !isVotingPeriod ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!isVotingPeriod}>
          Login & Vote
        </button>
      </form>
    </main>
  );
}
