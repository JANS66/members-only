import { useEffect, useState } from "react";
import SignUp from "./SignUp";

function App() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/messages")
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch((err) => console.error("Error fetching messages:", err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4 text-center">
          The Exclusive Clubhouse
        </h1>

        <SignUp />

        <hr className="border-slate-200 my-8" />

        {/* Feed COntainer */}
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-slate-500 italic text-center py-8">
              No messages to display yet.
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition hover:shadow-md"
              >
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {msg.title}
                </h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  {msg.text}
                </p>
                <div className="text-xs text-slate-400 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span>
                    Posted by:{" "}
                    <strong className="text-slate-700 font-semibold">
                      {msg.author}
                    </strong>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
