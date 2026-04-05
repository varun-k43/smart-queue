import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

function UserPage() {
  const [name, setName] = useState("");
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [position, setPosition] = useState(null);
  const [myId, setMyId] = useState(null);
  const [token, setToken] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [socket] = useState(() => io("http://localhost:5000"));

  // Fetch queue
  const fetchQueue = async () => {
    const res = await axios.get(
      `http://localhost:5000/queue/${selectedDoctor}`,
    );
    setQueue(res.data);
  };

  // Join queue
  const joinQueue = async () => {
    if (!name) return;

    const res = await axios.post("http://localhost:5000/join-queue", {
      name,
      queueId: selectedDoctor,
    });

    setPosition(res.data.position);
    setToken(res.data.token);
    setMyId(res.data.user._id); // store unique ID
    sessionStorage.setItem("myId", res.data.user._id);
    await fetchQueue();
    setName(""); // clear input
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      const res = await axios.get("http://localhost:5000/doctor");
      setDoctors(res.data);

      if (res.data.length > 0) {
        setSelectedDoctor(res.data[0].queueId);
      }
    };
    fetchDoctors();
  }, []);

  // Real-time listener
  useEffect(() => {
    if (!selectedDoctor) return;
    setCurrent(null);
    socket.emit("joinRoom", selectedDoctor);

    const loadData = async () => {
      if (!selectedDoctor) return;

      const res = await axios.get(
        `http://localhost:5000/queue/${selectedDoctor}`,
      );
      setQueue(res.data);

      const storedId = sessionStorage.getItem("myId");

      if (storedId) {
        setMyId(storedId);

        const index = res.data.findIndex((u) => u._id === storedId);

        if (index !== -1) {
          setPosition(index + 1);
        } else {
          setPosition(null);
          sessionStorage.removeItem("myId");
        }
      }
    };

    loadData();

    const handleQueueUpdated = async (data) => {
      if (data.queueId === selectedDoctor) {
        const res = await axios.get(
          `http://localhost:5000/queue/${selectedDoctor}`,
        );

        setQueue(res.data);

        const storedId = sessionStorage.getItem("myId");

        if (storedId) {
          const index = res.data.findIndex((u) => u._id === storedId);

          if (index !== -1) {
            setPosition(index + 1);
          } else {
            setPosition(null);
            sessionStorage.removeItem("myId");
          }
        }
      }
    };

    const handleNowServing = (data) => {
      if (data.queueId === selectedDoctor) {
        setCurrent(data);
      }
    };

    socket.on("queueUpdated", handleQueueUpdated);
    socket.on("nowServing", handleNowServing);

    return () => {
      socket.off("queueUpdated", handleQueueUpdated);
      socket.off("nowServing", handleNowServing);
    };
  }, [selectedDoctor, socket]);

  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Arial",
        backgroundColor: "#f5f6fa",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ textAlign: "center" }}>Smart Queue System</h1>

      {/* Join Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <select
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          style={{
            padding: "10px",
            marginRight: "10px",
            borderRadius: "5px",
          }}
        >
          {doctors.map((doc) => (
            <option key={doc._id} value={doc.queueId}>
              {doc.name}
            </option>
          ))}
        </select>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name"
          style={{
            padding: "10px",
            fontSize: "16px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={joinQueue}
          style={{
            marginLeft: "10px",
            padding: "10px 15px",
            backgroundColor: "#2ecc71",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Join Queue
        </button>
      </div>

      {position && (
        <h3 style={{ textAlign: "center" }}>Your Position: {position}</h3>
      )}
      {token && <h3 style={{ textAlign: "center" }}>Your Token: {token}</h3>}

      {/* Now Serving */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: "#fff",
          borderRadius: "10px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        <h2>Now Serving: {current ? current.name : "None"}</h2>

        {current && <p>Wait Time: {current.waitTime} mins</p>}
      </div>

      {/* Queue List */}
      <div
        style={{
          maxWidth: "400px",
          margin: "0 auto",
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        <h2>Queue</h2>

        <ul style={{ listStyle: "none", padding: 0 }}>
          {queue.map((user, index) => (
            <li
              key={user._id}
              style={{
                padding: "10px",
                marginBottom: "8px",
                backgroundColor: index === 0 ? "#d1f7c4" : "#ecf0f1",
                borderRadius: "5px",
              }}
            >
              {index + 1}. {user.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default UserPage;
