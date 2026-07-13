import { useEffect, useState } from "react";
import SignUp from "./SignUp";
import JoinClub from "./JoinClub";
import Login from "./Login";
import CreateMessage from "./CreateMessage";

function App() {
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null); // Global user state (null = logged out)
  const [loading, setLoading] = useState(true); // Prevent flash of logged out layout while checking session

  // Helper function to load message list (reusable)
  const fetchMessages = () => {
    fetch("http://localhost:3000/api/messages", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch((err) => console.error("Error fetching messages:", err));
  };

  const handleDelete = async (messageId) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this message?",
      )
    )
      return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/messages/${messageId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (response.ok) {
        fetchMessages();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to delete message.");
      }
    } catch (err) {
      console.error("Network error on deletion:", err);
    }
  };

  // Check auth status and on mount
  useEffect(() => {
    // Ask backend if this browser currently holds a valid session cookie
    fetch("http://localhost:3000/api/auth-status", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        }
      })
      .catch((err) => console.error("Session verficiation failed:", err))
      .finally(() => setLoading(false));
  }, []);

  // Refetch the message stream anytime login state changes
  useEffect(() => {
    if (!loading) {
      fetchMessages();
    }
  }, [user, loading]); // Triggers a fresh fetch immediately when user changes from null to loggedin

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium animate-pulse">
          Loading clubhouse session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4 text-center">
          The Exclusive Clubhouse
        </h1>

        {/* Display Status Banner */}
        {user && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium text-center">
            Welcome back, <span className="font-bold">{user.username}</span>!
          </div>
        )}

        {/* Auth Forms Section (Only show if logged out) */}
        {!user ? (
          <>
            <Login onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />
            <hr className="border-slate-200 my-8" />
            <SignUp />
          </>
        ) : (
          <>
            {/* Create new content section (Only show if logged in) */}
            <CreateMessage user={user} onMessagePosted={fetchMessages} />
            <hr className="border-slate-200 my-8" />
            <JoinClub setUser={setUser} />
          </>
        )}

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
                className=" relative bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition hover:shadow-md"
              >
                {/* Admin Delete Button Container */}
                {user?.isAdmin && (
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="absolute top-4 right-4 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                )}

                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {msg.title}
                </h2>
                <p className="text-slate-600 leading-relaxed mb-4 whitespace-pre-line">
                  {msg.text}
                </p>

                {/* Footer info container with dynamic author data and timestamps */}
                <div className="text-xs text-slate-400 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span>
                    Posted by:{" "}
                    <strong className="text-slate-700 font-semibold">
                      {msg.author}
                    </strong>
                  </span>
                  <span>
                    {msg.timestamp ? (
                      <span>
                        {new Date(msg.timestamp).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : (
                      <span className="text-slate-300 italic">Date hidden</span>
                    )}
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
