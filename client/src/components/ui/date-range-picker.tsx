import React from "react";
import { Calendar, X } from "lucide-react";

interface Props {
  start: string;
  end: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  className?: string;
}

export default function DateRangePicker({ start, end, onStart, onEnd, className = "" }: Props) {
  const showClear = !!start || !!end;
  
  return (
    <div
      className={`flex items-center bg-slate-100 rounded-full shadow-sm focus-within:ring-2 focus-within:ring-medical-blue px-4 ${className}`}
    >
      <Calendar className="w-4 h-4 text-slate-400" />
      <input
        type="date"
        value={start}
        onChange={(e) => onStart(e.target.value)}
        className="bg-transparent outline-none px-2 py-2 text-sm w-28 md:w-36"
      />
      <span className="text-slate-400 mx-1">–</span>
      <input
        type="date"
        value={end}
        onChange={(e) => onEnd(e.target.value)}
        className="bg-transparent outline-none px-2 py-2 text-sm w-28 md:w-36"
      />
      {showClear && (
        <button
          type="button"
          onClick={() => {
            onStart("");
            onEnd("");
          }}
          className="ml-2 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
} 