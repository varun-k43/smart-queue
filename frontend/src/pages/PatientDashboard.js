import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const WAIT_MINUTES_PER_PATIENT = 5;

function PatientDashboard() {
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  const queueId = sessionStorage.getItem("patientQueueId");
  const patientId = sessionStorage.getItem("patientId");
  const patientToken = sessionStorage.getItem("patientToken");
  const patientName = sessionStorage.getItem("patientName");

  const position = useMemo(() => {
    const index = queue.findIndex(
      (item) => item._id === patientId || item.token === patientToken,
    );
    return index === -1 ? null : index + 1;
  }, [patientId, patientToken, queue]);

  const estimatedWait = position
    ? Math.max(position - 1, 0) * WAIT_MINUTES_PER_PATIENT
    : 0;

  const fetchQueue = useCallback(async () => {
    if (!queueId) return;
    const res = await axios.get(`${API_BASE_URL}/queue/${queueId}`);
    setQueue(res.data);
  }, [queueId]);

  const fetchCurrent = useCallback(async () => {
    if (!queueId) return;
    const res = await axios.get(`${API_BASE_URL}/current/${queueId}`);
    setCurrent(res.data || null);
  }, [queueId]);

  useEffect(() => {
    if (!queueId || !patientToken) {
      navigate("/");
      return;
    }

    const socket = io(API_BASE_URL);

    const handleConnect = () => {
      socket.emit("joinRoom", queueId);
    };

    socket.on("connect", handleConnect);

    socketRef.current = socket;

    return () => {
      socket.off("connect", handleConnect);
      socket.disconnect();
    };
  }, [navigate, patientToken, queueId]);

  useEffect(() => {
    if (!socketRef.current || !queueId) return;

    fetchQueue();
    fetchCurrent();

    const handleQueueUpdated = async (data) => {
      if (data.queueId === queueId) {
        await fetchQueue();
      }
    };

    const handleNowServing = (data) => {
      if (data.queueId === queueId) {
        setCurrent({
          token: data.token,
          name: data.name,
        });
      }
    };

    socketRef.current.on("queueUpdated", handleQueueUpdated);
    socketRef.current.on("nowServing", handleNowServing);

    return () => {
      socketRef.current?.off("queueUpdated", handleQueueUpdated);
      socketRef.current?.off("nowServing", handleNowServing);
    };
  }, [fetchCurrent, fetchQueue, queueId]);

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="absolute top-5 right-6 flex gap-4 text-sm font-medium">
        <button
          onClick={() => navigate("/history")}
          className="text-slate-600 hover:text-blue-600"
        >
          Visit History
        </button>
      </div>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
            Hospital Queue
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Patient Dashboard
          </h1>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <section className="rounded-2xl border border-blue-100 bg-white p-7 shadow-xl shadow-blue-100/50">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-600">
              Your Token
            </p>
            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-7xl font-black leading-none tracking-tight text-blue-700 sm:text-8xl">
                  {patientToken || "--"}
                </p>
                <p className="mt-4 text-xl font-semibold text-slate-800">
                  {patientName || "Patient"}
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50 px-5 py-4 text-left sm:text-right">
                <p className="text-sm font-semibold text-slate-500">
                  Estimated wait time
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-950">
                  {estimatedWait} min
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/40">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
                Your Position
              </p>
              <p className="mt-5 text-6xl font-black text-slate-950">
                {position === null ? "Done" : position}
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/40">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
                Now Serving
              </p>
              <div className="mt-5 rounded-2xl bg-slate-50 px-5 py-4">
                <p className="text-3xl font-black text-slate-950">
                  {current?.token || "--"}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {current ? current.name : "Waiting for doctor"}
                </p>
              </div>
            </section>
          </div>
        </div>

        <section className="mt-5 rounded-2xl border border-blue-100 bg-white shadow-xl shadow-blue-100/40">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-950">
              Live Queue Status
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {queue.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm font-medium text-slate-500">
                Queue is empty.
              </p>
            ) : (
              queue.map((item) => {
                const isCurrentUser =
                  item._id === patientId || item.token === patientToken;

                return (
                  <div
                    key={item._id}
                    className={`grid grid-cols-[80px_minmax(0,1fr)] items-center gap-4 px-6 py-4 transition ${
                      isCurrentUser ? "bg-blue-50" : "bg-white"
                    }`}
                  >
                    <p
                      className={`rounded-xl px-3 py-2 text-center text-lg font-black ${
                        isCurrentUser
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.token}
                    </p>
                    <p className="truncate text-base font-semibold text-slate-800">
                      {item.name}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default PatientDashboard;
