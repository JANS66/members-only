import { useState } from "react";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Send credential to login endpoint
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid username or password.");
      } else {
        setSuccess("Welcome back! Logging you in...");
        // Clear inputs on success
        setUsername("");
        setPassword("");

        // TODO custom event or state redirect
        console.log("Logged in user data:", data.user);
      }
    } catch (err) {
      setError("Cannot connect to the authentication server.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 bg-slate-900 text-white p-8 rounded-xl border border-slate-800 shadow-xl">
      <div className="text-center mb-6">
        <h2 className="text-xl font-black mt-2 tracking-wide uppercase">
          Sign In
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Access your club membership space
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
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-slate-500"
            placeholder="spider161"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-slate-500"
            placeholder="••••••••••••"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-xs tracking-wider uppercase transition-colors"
        >
          Log In
        </button>
      </form>
    </div>
  );
}

export default Login;
