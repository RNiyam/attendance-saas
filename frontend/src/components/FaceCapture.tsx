"use client";

import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

export default function FaceCapture({ onCapture }: { onCapture: (imageSrc: string) => void }) {
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const capture = useCallback(() => {
    const src = webcamRef.current?.getScreenshot();
    if (src) {
      setImageSrc(src);
      onCapture(src);
    }
  }, [webcamRef, onCapture]);

  return (
    <div className="flex flex-col items-center gap-4">
      {!imageSrc ? (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            className="rounded-lg shadow-md max-w-sm w-full"
          />
          <button
            onClick={capture}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Capture Face
          </button>
        </>
      ) : (
        <>
          <img src={imageSrc} alt="Captured face" className="rounded-lg shadow-md max-w-sm w-full" />
          <button
            onClick={() => setImageSrc(null)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
          >
            Retake
          </button>
        </>
      )}
    </div>
  );
}
