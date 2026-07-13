export default function StatusBanner({ user }) {
  return (
    <>
      {user && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium text-center">
          Welcome back, <span className="font-bold">{user.username}</span>!
        </div>
      )}
    </>
  );
}
