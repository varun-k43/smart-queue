import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000";

function AssistantDashboard() {
  const [assistant, setAssistant] = useState(null);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [error, setError] = useState("");
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const queueRef = useRef([]);
  const navigate = useNavigate();
  const ASSISTANT_ID = sessionStorage.getItem("assistantId");

  useEffect(() => {
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const assignedDoctor = assistant?.assignedDoctorId || null;
  const assignedQueueId = assignedDoctor?.queueId || "";

  const fetchAssistant = useCallback(async () => {
    if (!ASSISTANT_ID) {
      navigate("/assistant-login");
      setAssistant(null);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/assistant/${ASSISTANT_ID}`);
      setAssistant(res.data);
      setError("");
    } catch (fetchError) {
      setAssistant(null);
      setError(
        fetchError.response?.data?.message ||
          "Failed to load assistant details.",
      );
    }
  }, [ASSISTANT_ID, navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("assistantId");
    navigate("/");
  };

  const fetchQueue = async (queueId) => {
    if (!queueId) {
      setQueue([]);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/queue/${queueId}`);
      setQueue(res.data);
    } catch (err) {
      console.error("Queue fetch failed");
    }
  };

  const callNext = async () => {
    if (!assignedQueueId || queue.length === 0) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/next`, {
        queueId: assignedQueueId,
      });
    } catch (err) {
      console.error("Failed to call next");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPatient = async (queueId) => {
    try {
      if (!queueId) return;
      const res = await axios.get(`${API_BASE_URL}/current/${queueId}`);
      setCurrent(res.data || null);
    } catch (err) {
      console.error("Failed to fetch current patient");
    }
  };

  useEffect(() => {
    fetchAssistant();
  }, [fetchAssistant]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    if (!socket) return;

    if (!assignedQueueId) {
      setQueue([]);
      setCurrent(null);
      return;
    }

    (async () => {
      await fetchQueue(assignedQueueId);
      await fetchCurrentPatient(assignedQueueId);
    })();
    socket.emit("joinRoom", assignedQueueId);

    const handleQueueUpdated = async (data) => {
      if (data.queueId === assignedQueueId) {
        await fetchQueue(assignedQueueId);
      }
    };

    const handleNowServing = (data) => {
      if (data.queueId === assignedQueueId) {
        setCurrent({
          token: data.token,
          name: data.name,
        });
      }
    };

    socket.on("queueUpdated", handleQueueUpdated);
    socket.on("nowServing", handleNowServing);

    return () => {
      socket.off("queueUpdated", handleQueueUpdated);
      socket.off("nowServing", handleNowServing);
    };
  }, [assignedQueueId, socket]);

  const nextPatient = queue[0] || null;
  const currentToken = current?.token || "--";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-5 py-6 shadow-sm md:flex md:flex-col">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              Smart Queue
            </p>
            <h1 className="mt-2 text-xl font-bold">Assistant</h1>
          </div>

          <nav className="space-y-2">
            <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              Dashboard
            </div>
            <button
              onClick={handleLogout}
              className="w-full rounded-lg px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Logout
            </button>
          </nav>
        </aside>

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-5">
            <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm md:hidden">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Smart Queue
                </p>
                <h1 className="text-lg font-bold">Assistant</h1>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Logout
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-red-100 bg-white px-5 py-4 text-sm font-medium text-red-600 shadow-sm">
                {error}
              </div>
            )}

            <section className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Doctor Info
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-500">Doctor</p>
                  <p className="mt-1 text-lg font-bold">
                    {assignedDoctor?.name || "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Assistant</p>
                  <p className="mt-1 text-lg font-bold">
                    {assistant?.name || "Loading"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Queue</p>
                  <p className="mt-1 text-lg font-bold">
                    {assignedQueueId || "Not available"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg bg-white p-6 text-center shadow-lg sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-600">
                Now Serving
              </p>
              <div className="mt-5 flex min-h-52 flex-col items-center justify-center rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-8">
                {current ? (
                  <>
                    <p className="text-6xl font-black leading-none text-blue-700 sm:text-8xl">
                      {currentToken}
                    </p>
                    <p className="mt-5 text-xl font-semibold text-slate-600 sm:text-2xl">
                      {current.name}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-6xl font-black leading-none text-slate-300 sm:text-8xl">
                      --
                    </p>
                    <p className="mt-5 text-xl font-semibold text-slate-500">
                      No patient called
                    </p>
                  </>
                )}
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <section className="rounded-lg bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Up Next
                </p>

                <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-5">
                  {nextPatient ? (
                    <>
                      <p className="text-4xl font-black text-slate-950">
                        {nextPatient.token}
                      </p>
                      <p className="mt-2 text-base font-medium text-slate-500">
                        {nextPatient.name}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-4xl font-black text-slate-300">--</p>
                      <p className="mt-2 text-base font-medium text-slate-500">
                        No patient waiting
                      </p>
                    </>
                  )}
                </div>

                <button
                  onClick={callNext}
                  disabled={loading || !assignedQueueId || queue.length === 0}
                  className="mt-5 w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                >
                  {loading ? "Calling..." : "Call Next Patient"}
                </button>
              </section>

              <section className="rounded-lg bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                    Queue List
                  </p>
                  <p className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
                    {queue.length}
                  </p>
                </div>

                <div className="mt-5 max-h-80 overflow-y-auto pr-1">
                  {!assignedQueueId ? (
                    <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm font-medium text-slate-500">
                      No doctor assigned to this assistant.
                    </p>
                  ) : queue.length === 0 ? (
                    <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm font-medium text-slate-500">
                      Queue is empty.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {queue.map((user) => (
                        <li
                          key={user._id}
                          className="rounded-lg border border-slate-100 bg-white px-4 py-3 shadow-sm"
                        >
                          <p className="text-lg font-black text-slate-950">
                            {user.token}
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-500">
                            {user.name}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AssistantDashboard;
