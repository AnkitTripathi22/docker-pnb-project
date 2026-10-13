"use client";

import { useEffect, useState } from "react";

interface Country {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

interface DbInfo {
  status: string;
  database: string;
  host: string;
  port: string;
  table: string;
  total_records: number;
  delete_allowed: boolean;
}

// Using relative path so client browser always queries the same origin
// Next.js Server Route Handler (/api/[...path]) securely proxies to FastAPI backend
const API_BASE_URL = "";

export default function Home() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [newCountryName, setNewCountryName] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // DB Info aur Countries fetch karna
  const fetchData = async () => {
    setRefreshing(true);
    try {
      // 1. Fetch DB Status
      try {
        const resInfo = await fetch(`${API_BASE_URL}/api/db-info`, { cache: "no-store" });
        if (resInfo.ok) {
          const info = await resInfo.json();
          setDbInfo(info);
        } else {
          console.error("DB info fetch failed:", resInfo.status);
        }
      } catch (err) {
        console.error("Error fetching db-info:", err);
      }

      // 2. Fetch Countries list
      try {
        const resCountries = await fetch(`${API_BASE_URL}/api/countries`, { cache: "no-store" });
        if (resCountries.ok) {
          const list = await resCountries.json();
          setCountries(list);
        } else {
          console.error("Countries fetch failed:", resCountries.status);
          setMessage({
            text: `Data fetch failed (Status ${resCountries.status})`,
            type: "error",
          });
        }
      } catch (err) {
        console.error("Error fetching countries:", err);
        setMessage({
          text: "Backend API se connection nahi ho paya. Refresh karein.",
          type: "error",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Naya Country add karna (POST /api/countries)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountryName.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/countries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCountryName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewCountryName("");
        setMessage({ text: `Country "${data.name}" successfully add ho gayi!`, type: "success" });
        fetchData();
      } else {
        setMessage({ text: data.detail || "Error adding country", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Server error occurred", type: "error" });
    }
  };

  // Country update karna (PUT /api/countries/{id})
  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/countries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingId(null);
        setMessage({ text: `Country #${id} updated successfully!`, type: "success" });
        fetchData();
      } else {
        setMessage({ text: data.detail || "Error updating country", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Server error occurred", type: "error" });
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🐳</span>
              <h1 className="text-2xl font-bold text-white tracking-wide">
                Dockerized PNB Database Dashboard
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Production Stack: Live PostgreSQL (<code className="text-cyan-400 font-mono">jrp_pnb</code>) ⇄ FastAPI Backend ⇄ Next.js Frontend
            </p>
          </div>

          {/* Database Live Status Badge */}
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-xs">
            <span className={`w-3 h-3 rounded-full ${dbInfo?.status === "connected" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <div>
              <div className="font-semibold text-white">
                {dbInfo?.status === "connected" ? "PostgreSQL Connected" : "Connecting to DB..."}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {dbInfo ? `${dbInfo.database} @ ${dbInfo.host}` : "Connecting to 13.234.155.172"}
              </div>
            </div>
          </div>
        </div>

        {/* Safety Alert (NO DELETE) */}
        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 flex items-center gap-3 text-xs md:text-sm text-emerald-200">
          <span className="text-xl">🛡️</span>
          <div>
            <strong>Safety Mode Active:</strong> Working database (<code className="font-mono text-emerald-300">jrp_pnb</code>) ke data ko protect karne ke liye <strong>DELETE API completely disable</strong> hai. Aap sirf data Read, Create (POST) aur Update (PUT) kar sakte hain.
          </div>
        </div>

        {/* Notifications */}
        {message && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex justify-between items-center ${
              message.type === "success"
                ? "bg-emerald-900/60 text-emerald-200 border border-emerald-700"
                : "bg-rose-900/60 text-rose-200 border border-rose-700"
            }`}
          >
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-white ml-2 text-base cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Add Country Form (POST) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            ➕ Add Country to Working Database (<code className="text-xs text-cyan-400 font-mono">POST /api/countries</code>)
          </h2>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Country Name (e.g. Canada, Germany, Australia)"
              value={newCountryName}
              onChange={(e) => setNewCountryName(e.target.value)}
              required
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl text-sm transition-all shadow-md cursor-pointer whitespace-nowrap active:scale-95"
            >
              Add Country
            </button>
          </form>
        </div>

        {/* Countries List Table (READ & UPDATE) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                📋 Table: <code className="text-cyan-400 font-mono">masters_country</code> ({countries.length} records)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Live records directly queried from PostgreSQL database
              </p>
            </div>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <span className={refreshing ? "animate-spin" : ""}>🔄</span>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm flex flex-col items-center gap-2">
              <span className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              Loading records from PostgreSQL database...
            </div>
          ) : countries.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm space-y-2">
              <div>Koi record nahi mila ya connection pending hai.</div>
              <button
                onClick={fetchData}
                className="px-4 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs rounded-lg"
              >
                Retry Fetching
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Country Name</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Action (Update Only)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {countries.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-cyan-400 text-xs">
                        #{c.id}
                      </td>
                      <td className="py-3 px-4">
                        {editingId === c.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="px-3 py-1 bg-slate-950 border border-cyan-500 rounded text-white text-xs"
                            />
                            <button
                              onClick={() => handleUpdate(c.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="font-medium text-white">{c.name}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 font-mono" suppressHydrationWarning>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingId !== c.id && (
                          <button
                            onClick={() => {
                              setEditingId(c.id);
                              setEditName(c.name);
                            }}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg cursor-pointer transition-colors"
                          >
                            Edit Name
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
