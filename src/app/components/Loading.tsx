import React from "react";

export default function Loading() {
  return (
    <div className="flex flex-col justify-center items-center h-screen z-50">
      {/* ทำให้ ... มีอนิเมชัน */}
      <div className="loading-dots">
        <span className="dot">.</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
      </div>
    </div>
  );
}
