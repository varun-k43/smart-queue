import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-white to-blue-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
            Hospital Smart Queue
          </span>
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/90 p-8 shadow-xl shadow-sky-100 backdrop-blur-sm sm:p-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-3xl shadow-sm">
            🏥
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Hospital Smart Queue
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Skip the wait. Track your turn in real-time.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => navigate("/user")}
              className="w-full rounded-xl bg-sky-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition duration-200 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2"
            >
              Join Queue
            </button>

            <button
              onClick={() => navigate("/admin")}
              className="w-full rounded-xl bg-slate-200 px-4 py-3 text-base font-semibold text-slate-800 hover:bg-slate-300"
            >
              Admin Login
            </button>

            <button
              onClick={() => navigate("/assistant-login")}
              className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-base font-semibold text-sky-700 transition duration-200 hover:border-sky-300 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-2"
            >
              Assistant Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
