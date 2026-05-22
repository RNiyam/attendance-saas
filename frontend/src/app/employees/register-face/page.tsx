"use client";

import React, { useState } from "react";
import FaceCapture from "@/components/FaceCapture";
import { getFaceEmbedding } from "@/lib/face";

export default function RegisterFacePage() {
  const [status, setStatus] = useState<string>("Waiting for face capture...");

  const handleCapture = async (imageSrc: string) => {
    setStatus("Extracting face embedding...");
    const embedding = await getFaceEmbedding(imageSrc);

    if (!embedding) {
      setStatus("Error: No face detected. Please try again.");
      return;
    }

    setStatus("Registering face in database...");
    
    try {
      const response = await fetch("http://localhost:3001/employees/1/face", { // Hardcoded employeeId 1 for MVP
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer YOUR_TOKEN" },
        body: JSON.stringify({
          embedding,
          imageUrl: imageSrc,
        }),
      });

      if (response.ok) {
        setStatus("Face registered successfully!");
      } else {
        const data = await response.json();
        setStatus("Registration failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      setStatus("Network error during registration");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">Register Employee Face</h1>
      <FaceCapture onCapture={handleCapture} />
      <p className="mt-4 text-lg font-medium">{status}</p>
    </div>
  );
}
