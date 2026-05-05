import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const WAIT_MINUTES_PER_PATIENT = 5;

function PatientJoinPage() {
  const [name, setName] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [queueId, setQueueId] = useState("");
  const [queueLength, setQueueLength] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const estimatedWait = useMemo(
    () => queueLength * WAIT_MINUTES_PER_PATIENT,
    [queueLength],
  );

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/doctor`);
        setDoctors(res.data);
        if (res.data.length > 0) {
          setQueueId(res.data[0].queueId);
        }
      } catch (err) {
        setError("Unable to load doctors right now.");
      }
    };

    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!queueId) return;

    const fetchQueueLength = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/queue/${queueId}`);
        setQueueLength(res.data.length);
      } catch (err) {
        setQueueLength(0);
      }
    };

    fetchQueueLength();
  }, [queueId]);

  const handleJoinQueue = async (event) => {
    event.preventDefault();
    setError("");

    if (!name.trim() || !queueId) {
      setError("Please enter your name and select a doctor.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/join-queue`, {
        name: name.trim(),
        queueId,
      });

      sessionStorage.setItem("patientToken", res.data.token);
      sessionStorage.setItem("patientQueueId", queueId);
      sessionStorage.setItem("patientId", res.data.user._id);
      sessionStorage.setItem("patientName", res.data.user.name);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to join queue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 via-white to-slate-50 px-4 py-10 text-slate-900">
      <div className="absolute top-5 right-6 flex gap-4 text-sm font-medium">
        <button
          onClick={() => navigate("/history")}
          className="text-slate-600 hover:text-blue-600"
        >
          Visit History
        </button>
      </div>
      <section className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-7 shadow-xl shadow-blue-100/60 sm:p-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
            Patient Queue
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Hospital Smart Queue
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Join your doctor's live queue and track your turn from anywhere in
            the hospital.
          </p>
        </div>

        <form onSubmit={handleJoinQueue} className="mt-7 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Patient Name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Enter patient name"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Select Doctor
            </span>
            <select
              value={queueId}
              onChange={(event) => setQueueId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {doctors.length === 0 ? (
                <option value="">No doctors available</option>
              ) : (
                doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor.queueId}>
                    {doctor.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            Estimated wait time: {queueLength === 0 ? 0 : estimatedWait} min
          </p>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || doctors.length === 0}
            className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {loading ? "Joining..." : "Join Queue"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default PatientJoinPage;
