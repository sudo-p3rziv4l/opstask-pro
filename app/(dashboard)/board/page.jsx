"use client";
import { useState, useEffect } from "react";
import KanbanBoard from "@/components/board/KanbanBoard";

export default function BoardPage() {
  const [summary, setSummary] = useState({ totalDone: 0, myDone7d: 0, totalLeft: 0, activeProjects: 0 });

  useEffect(() => {
    fetch("/api/tasks/summary?t=" + Date.now(), { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        // Antisipasi undefined kalo API error
        setSummary({
           totalDone: data.totalDone || 0,
           myDone7d: data.myDone7d || 0,
           totalLeft: data.totalLeft || 0,
           activeProjects: data.activeProjects || 0
        });
      })
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">My ToDos</h1>
        <p className="text-slate-500 text-sm">Drag and drop your tasks across stages.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          { title: summary.totalDone, subtitle: "Total Completed" },
          { title: summary.myDone7d, subtitle: "My Done Tasks (7d)" },
          { title: summary.totalLeft, subtitle: "Total Tasks Left" },
          { title: summary.activeProjects, subtitle: "Active Projects" }
        ].map((stat, i) => (
          <div key={i} className="bg-white/80 p-4 md:p-5 rounded-[20px] shadow-sm border border-white flex flex-col gap-1 hover:shadow-md transition-shadow backdrop-blur-sm">
            <h3 className="text-xl md:text-2xl font-bold text-sky-600 leading-none">{stat.title}</h3>
            <p className="text-[10px] md:text-xs font-medium text-slate-500">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      <KanbanBoard />
    </div>
  );
}
