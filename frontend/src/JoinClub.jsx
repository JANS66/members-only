import { useState } from "react";

function JoinClub({ setUser }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:3000/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ passcode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to join the club.");
      } else {
        setSuccess(data.message);
        setPasscode("");

        setUser((prevUser) => ({
          ...prevUser,
          isMember: true,
        }));
      }
    } catch (err) {
      setError("Unable to reach the backend server.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 bg-slate-900 text-white p-8 rounded-xl border border-slate-800 shadow-xl">
      <div className="text-center mb-6">
        <h2 className="text-xl font-black mt-2 tracking-wide uppercase">
          Enter the Inner Circle
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Only those with the secret passcode may read authors or timestamps.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded text-xs text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800 rounded text-xs text-emerald-400">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Secret Passcode
          </label>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-slate-500"
            placeholder="••••••••••••"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-2.5 rounded-lg text-xs tracking-wider uppercase transition-colors"
        >
          Unlock Membership
        </button>
      </form>
    </div>
  );
}

export default JoinClub;
