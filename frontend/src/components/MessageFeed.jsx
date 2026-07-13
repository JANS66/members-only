export default function MessageFeed({ messages, user, onDelete }) {
  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <p className="text-slate-500 italic text-center py-8">
          No messages to display yet.
        </p>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className="relative bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition hover:shadow-md"
          >
            {/* Admin Delete Button Container */}
            {user?.isAdmin && (
              <button
                onClick={() => onDelete(msg.id)}
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
  );
}
