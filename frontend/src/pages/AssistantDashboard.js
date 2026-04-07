import { useCallback, useEffect, useState } from "react";
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
  const navigate = useNavigate();
  const ASSISTANT_ID = localStorage.getItem("assistantId");

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
    localStorage.removeItem("assistantId");
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

    try {
      await axios.post(`${API_BASE_URL}/next`, { queueId: assignedQueueId });
    } catch (err) {
      console.error("Failed to call next");
    }
  };

  useEffect(() => {
    fetchAssistant();
  }, [fetchAssistant]);

  useEffect(() => {
    if (!socket) return;

    if (!assignedQueueId) {
      setQueue([]);
      setCurrent(null);
      return;
    }

    setCurrent(null);
    fetchQueue(assignedQueueId);
    socket.emit("joinRoom", assignedQueueId);

    const handleQueueUpdated = async (data) => {
      if (data.queueId === assignedQueueId) {
        await fetchQueue(assignedQueueId);
      }
    };

    const handleNowServing = (data) => {
      if (data.queueId === assignedQueueId) {
        setCurrent(data);
      }
    };

    socket.on("queueUpdated", handleQueueUpdated);
    socket.on("nowServing", handleNowServing);

    return () => {
      socket.off("queueUpdated", handleQueueUpdated);
      socket.off("nowServing", handleNowServing);
    };
  }, [assignedQueueId, socket]);

  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Arial",
        backgroundColor: "#f5f6fa",
        minHeight: "100vh",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Assistant Dashboard
      </h2>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            backgroundColor: "#2c3e50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {error && (
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto 20px",
            padding: "15px",
            backgroundColor: "#fff",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            color: "#e74c3c",
          }}
        >
          {error}
        </div>
      )}

      {assistant && (
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto 20px",
            padding: "20px",
            backgroundColor: "#fff",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <h3>{assistant.name}</h3>
          <p>Email: {assistant.email}</p>
          <p>Assigned Doctor: {assignedDoctor?.name || "Not assigned"}</p>
          <p>Queue ID: {assignedQueueId || "Not available"}</p>
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={callNext}
          disabled={!assignedQueueId || queue.length === 0}
          style={{
            padding: "10px 20px",
            backgroundColor:
              !assignedQueueId || queue.length === 0 ? "#ccc" : "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor:
              !assignedQueueId || queue.length === 0
                ? "not-allowed"
                : "pointer",
          }}
        >
          Call Next
        </button>
      </div>

      <div
        style={{
          textAlign: "center",
          padding: "15px",
          backgroundColor: "#fff",
          borderRadius: "10px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          maxWidth: "500px",
          margin: "0 auto 20px",
        }}
      >
        <h2>Now Serving: {current ? current.name : "None"}</h2>
        {current && <p>Wait Time: {current.waitTime} mins</p>}
      </div>

      <div
        style={{
          maxWidth: "500px",
          margin: "0 auto",
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        <h2>Queue</h2>

        {!assignedQueueId ? (
          <p>No doctor assigned to this assistant.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {queue.map((user, index) => (
              <li
                key={user._id}
                style={{
                  padding: "10px",
                  marginBottom: "8px",
                  backgroundColor: index === 0 ? "#f8d7da" : "#ecf0f1",
                  borderRadius: "5px",
                }}
              >
                {index + 1}. {user.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AssistantDashboard;
