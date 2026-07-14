import { useState, useEffect } from "react";
import Header from "./components/Header";
import StatusBanner from "./components/StatusBanner";
import MessageFeed from "./components/MessageFeed";
import Login from "./Login";
import SignUp from "./SignUp";
import CreateMessage from "./CreateMessage";
import JoinClub from "./JoinClub";

export default function App() {
  const [user, setUser] = useState(null); // Global user state (null = logged out)
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true); // Prevent flash of logged out layout while checking session

  // 1. Fetch Auth Session on Mount
  useEffect(() => {
    // Ask backend if this browser currently holds a valid session cookie
    fetch(`${import.meta.env.VITE_API_URL}/api/auth-status`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        }
      })
      .catch((err) => console.error("Session check failed:", err))
      .finally(() => setLoading(false));
  }, []);

  // 2. Fetch Messages
  const fetchMessages = () => {
    fetch(`${import.meta.env.VITE_API_URL}/api/messages`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch((err) => console.error("Error loading feed:", err));
  };

  // Refetch the message stream anytime login state changes
  useEffect(() => {
    if (!loading) fetchMessages();
  }, [user, loading]); // Triggers a fresh fetch immediately when user changes from null to loggedin

  // 3. Handle Admin Message Deletion
  const handleDelete = async (msgId) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this message?",
      )
    )
      return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/messages/${messageId}`,
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

  // Guard Clause for Initial Load State
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
        <Header />
        <StatusBanner user={user} />

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

        <MessageFeed messages={messages} user={user} onDelete={handleDelete} />
      </div>
    </div>
  );
}
