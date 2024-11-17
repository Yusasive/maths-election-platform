"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [formData, setFormData] = useState({
    matricNumber: "",
    fullName: "",
    department: "",
    image: "",
  });

  // Voting start and end times (replace with actual times)
  const votingStartTime = new Date("2024-11-16T08:00:00");
  const votingEndTime = new Date("2024-11-17T23:50:00");

  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isVotingPeriod, setIsVotingPeriod] = useState(false);

  // Update the current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval); // Clean up on component unmount
  }, []);

  // Update the countdown timer and voting period status
  useEffect(() => {
    const updateCountdown = () => {
      if (currentTime.getTime() < votingStartTime.getTime()) {
        const timeDiff = votingStartTime.getTime() - currentTime.getTime();
        setTimeRemaining(formatTime(timeDiff));
        setIsVotingPeriod(false);
      } else if (
        currentTime.getTime() >= votingStartTime.getTime() &&
        currentTime.getTime() <= votingEndTime.getTime()
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
  }, [currentTime]);

  // Format time difference into hours, minutes, and seconds
  const formatTime = (ms: number) => {
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

  const handleLogin = async () => {
    if (!isVotingPeriod) {
      alert("You can only log in during the voting period.");
      return;
    }

    // Validate input fields
    if (!formData.matricNumber || !formData.fullName || !formData.department) {
      alert("All fields are required.");
      return;
    }

    const existingVote = localStorage.getItem("voteRecord");
    if (existingVote) {
      alert("You have already voted. Login is restricted.");
      return;
    }

    // Save data to localStorage
    localStorage.setItem("voterData", JSON.stringify(formData));

    // Save data to mock API
    await fetch("https://65130c258e505cebc2e981a1.mockapi.io/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matricNumber: formData.matricNumber.toLowerCase(),
        fullName: formData.fullName,
        department: formData.department,
        image: formData.image,
      }),
    });

    // Redirect to voting page
    window.location.href = "/vote";
  };

  return (
    <main className="flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl md:text-4xl text-blue-500 font-bold pt-12 text-center">
        Faculty of Physical Sciences Election Voting
      </h1>
      <img src="/physical.png" alt="" />
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
            {currentTime.getTime() < votingStartTime.getTime()
              ? `Voting has not started yet. Time remaining: `
              : `Voting has ended.`}
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
              <img
                src={formData.image}
                alt="Selected file preview"
                className="mt-2 h-24 w-24 object-cover rounded"
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
            onChange={(e) =>
              setFormData({
                ...formData,
                image: URL.createObjectURL(e.target.files?.[0]!),
              })
            }
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
