"use client";

import React, { useState } from "react";
import FaceCapture from "@/components/FaceCapture";
import { getFaceEmbedding } from "@/lib/face";

export default function FaceCheckPage() {
  const [status, setStatus] = useState<string>("Waiting for face capture...");

  const handleCapture = async (imageSrc: string) => {
    setStatus("Extracting face embedding...");
    const embedding = await getFaceEmbedding(imageSrc);

    if (!embedding) {
      setStatus("Error: No face detected. Please try again.");
      return;
    }

    setStatus("Matching face with database...");
    
    try {
      const response = await fetch("http://localhost:3001/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer YOUR_TOKEN" }, // Need auth setup
        body: JSON.stringify({
          employeeId: 1, // hardcoded for MVP
          source: "face",
          embedding,
          selfieUrl: imageSrc,
        }),
      });

      if (response.ok) {
        setStatus("Attendance marked successfully!");
      } else {
        const data = await response.json();
        setStatus("Verification failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      setStatus("Network error during attendance marking");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">Face Recognition Attendance</h1>
      <FaceCapture onCapture={handleCapture} />
      <p className="mt-4 text-lg font-medium">{status}</p>
    </div>
  );
}
