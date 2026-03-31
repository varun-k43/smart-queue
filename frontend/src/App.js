import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const [name, setName] = useState("");
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [position, setPosition] = useState(null);
  const [myId, setMyId] = useState(null);

  // Fetch queue
  const fetchQueue = async () => {
    const res = await axios.get("http://localhost:5000/queue");
    setQueue(res.data);
  };

  // Join queue
  const joinQueue = async () => {
    if (!name) return;

    const res = await axios.post("http://localhost:5000/join-queue", { name });

    setPosition(res.data.position);
    setMyId(res.data.user._id); // store unique ID
    localStorage.setItem("myId", res.data.user._id);
    await fetchQueue();
    setName(""); // clear input
  };

  //  Call next
  const callNext = async () => {
    if (queue.length === 0) return;
    await axios.post("http://localhost:5000/next");
  };

  // Real-time listener
  useEffect(() => {
    const loadData = async () => {
      const res = await axios.get("http://localhost:5000/queue");
      setQueue(res.data);

      const storedId = localStorage.getItem("myId");

      if (storedId) {
        setMyId(storedId);

        // restore position after refresh
        const index = res.data.findIndex((u) => u._id === storedId);

        if (index !== -1) {
          setPosition(index + 1);
        } else {
          setPosition(null);
          localStorage.removeItem("myId");
        }
      }
    };

    loadData();

    socket.on("queueUpdated", async () => {
      const res = await axios.get("http://localhost:5000/queue");
      setQueue(res.data);

      if (!myId) return;

      const index = res.data.findIndex((u) => u._id === myId);

      if (index !== -1) {
        setPosition(index + 1);
      } else {
        setPosition(null);
        localStorage.removeItem("myId"); // clear when served
      }
    });

    socket.on("nowServing", (data) => {
      setCurrent(data);
    });

    return () => {
      socket.off("queueUpdated");
      socket.off("nowServing");
    };
  }, [myId]);

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

        <button
          onClick={callNext}
          disabled={queue.length === 0}
          style={{
            marginLeft: "10px",
            padding: "10px 15px",
            backgroundColor: queue.length === 0 ? "#ccc" : "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Call Next
        </button>
      </div>

      {position && (
        <h3 style={{ textAlign: "center" }}>Your Position: {position}</h3>
      )}

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

export default App;
