import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    // simple hardcoded login
    if (email === "admin@gmail.com" && password === "1234") {
      localStorage.setItem("isAdmin", "true");
      navigate("/admin-dashboard");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-100 via-white to-blue-50 px-4 py-12">
      <div className="absolute inset-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-[-7rem] right-[-5rem] h-80 w-80 rounded-full bg-blue-100/60 blur-3xl" />
      </div>

      <div className="absolute left-6 top-6 z-10 flex items-center gap-3 text-slate-800 sm:left-8 sm:top-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 shadow-sm ring-1 ring-sky-100">
          <svg
            className="h-5 w-5 text-sky-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3v18" />
            <path d="M3 12h18" />
            <path d="M7 7h10v10H7z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-slate-900">
            MedQueue Admin
          </p>
          <p className="text-xs text-slate-500">Hospital Operations Portal</p>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.28)] backdrop-blur-sm sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 shadow-sm ring-1 ring-sky-100">
              <svg
                className="h-8 w-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="11" width="16" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                <circle cx="12" cy="15.5" r="1" />
              </svg>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Admin Login
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Access the queue management system
            </p>
          </div>

          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </span>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100">
                <svg
                  className="h-5 w-5 flex-none text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 6h16v12H4z" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
                <input
                  type="email"
                  placeholder="admin@medqueue.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </span>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100">
                <svg
                  className="h-5 w-5 flex-none text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="4" y="11" width="16" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                </svg>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            <div className="flex items-center justify-between gap-4 text-sm">
              <label className="flex items-center gap-3 text-slate-600">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>Keep me signed in</span>
              </label>
              <button
                type="button"
                className="font-medium text-sky-600 transition hover:text-sky-700"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 hover:shadow-xl hover:shadow-sky-200/80 focus:outline-none focus:ring-4 focus:ring-sky-200"
            >
              Login &rarr;
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm font-medium text-slate-600 transition hover:text-sky-700"
            >
              &larr; Back to Home
            </button>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-5 text-center">
            <p className="text-xs tracking-wide text-slate-400">
              HIPAA Compliant &bull; Secure Data
            </p>
          </div>
        </div>
      </div>

      <p className="absolute bottom-6 z-10 text-center text-xs text-slate-400 sm:bottom-8">
        &copy; 2024 MedQueue Admin &bull; v2.4.0
      </p>
    </div>
  );
}

export default AdminLogin;
