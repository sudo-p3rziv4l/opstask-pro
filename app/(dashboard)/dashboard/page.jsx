"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leaders, setLeaders] = useState([]);
  const [loadingLeaders, setLoadingLeaders] = useState(true);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/reports/data", {
          headers: {
            "authorization": "Bearer cloe_secret"
          }
        });
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(res => res.json())
      .then(data => {
        setLeaders(data.leaderboard || []);
        setLoadingLeaders(false);
      })
      .catch(err => {
        console.error("Failed to load leaderboard:", err);
        setLoadingLeaders(false);
      });
  }, []);

  
  if (loading) return <div className="p-8">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  // Process data for charts
  const statusCounts = {};
  (Array.isArray(data) ? data : []).forEach(item => {
    const status = item.status || "Unknown";
    statusCounts[status] = (statusCounts[status] || 0) + parseInt(item.total_tasks, 10);
  });

  const pieData = Object.keys(statusCounts).map(status => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: statusCounts[status]
  }));

  const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Dummy line chart data since we only have aggregate data from API
  // In a real scenario, API would return daily task counts
  const lineData = [
    { name: 'Mon', created: 4, completed: 2 },
    { name: 'Tue', created: 3, completed: 4 },
    { name: 'Wed', created: 7, completed: 3 },
    { name: 'Thu', created: 2, completed: 8 },
    { name: 'Fri', created: 5, completed: 5 },
    { name: 'Sat', created: 1, completed: 0 },
    { name: 'Sun', created: 0, completed: 1 },
  ];

  

  return (
    <div className="max-w-6xl mx-auto p-4 fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Dashboard</h1>
        <p className="text-slate-500">Overview of task statuses and daily activity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-700 mb-6">Task Status Composition</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-700 mb-6">Daily Tasks Activity</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend />
                <Line type="monotone" dataKey="created" name="Created" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-700 mb-6">Team Leaderboard</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 border-b border-slate-100">
              <th className="pb-3 font-medium px-4">Rank</th>
              <th className="pb-3 font-medium">User</th>
              <th className="pb-3 font-medium">Tasks Done</th>
            </tr>
          </thead>
          <tbody>
            {loadingLeaders ? (
              <tr><td colSpan="3" className="py-8 text-center text-slate-400">Loading data...</td></tr>
            ) : leaders.length === 0 ? (
              <tr><td colSpan="3" className="py-8 text-center text-slate-400">No completed tasks yet.</td></tr>
            ) : (
              leaders.map((user, idx) => (
                <tr key={user.username} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="py-4 font-bold text-sky-600 px-4">#{idx + 1}</td>
                  <td className="py-4 font-bold text-slate-700 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs">
                      {user.username.substring(0,2).toUpperCase()}
                    </div>
                    {user.username}
                  </td>
                  <td className="py-4 font-bold text-emerald-600">{user.done_count} Tasks</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}