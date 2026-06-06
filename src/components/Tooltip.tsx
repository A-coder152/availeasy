"use client";

import { useState } from "react";

export default function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute z-50 w-48 p-2 text-xs text-white bg-gray-900 rounded shadow-xl -top-10 left-0 whitespace-normal">
          {text}
        </div>
      )}
    </div>
  );
}
