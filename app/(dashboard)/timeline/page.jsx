import CalendarBoard from "@/components/board/CalendarBoard";

export default function TimelinePage() {
  return (
    <div className="max-w-[1400px] mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">Timeline & Calendar</h1>
        <p className="text-slate-500 text-sm">View your tasks across dates.</p>
      </div>

      <div className="flex-1 bg-white/80 p-5 rounded-[20px] shadow-sm border border-white backdrop-blur-sm overflow-hidden flex flex-col">
        <CalendarBoard />
      </div>
    </div>
  );
}
