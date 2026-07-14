import { useState } from "react";

export default function CreateMessage({ user, onMessagePosted }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  // If the parent component hasnt loaded a user, dont show the form at all
  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Critical line so the connect.sid cookie passes through
          body: JSON.stringify({ title, text }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // Clear the form fields on success
      setTitle("");
      setText("");
      if (onMessagePosted) onMessagePosted(); // TODO Refresh main message list
      alert("Message posted!");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
      <h3 className="text-xl font-semibold text-slate-800 mb-4">
        Create a New Message
      </h3>

      {error && (
        <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg mb-4">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
            placeholder="Give your message a title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Message Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            rows="4"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            placeholder="What's on your mind?"
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors duration-150 cursor-pointer"
        >
          Post Message
        </button>
      </form>
    </div>
  );
}
