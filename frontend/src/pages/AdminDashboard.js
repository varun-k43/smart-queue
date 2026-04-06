import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const API_BASE_URL = "http://localhost:5000";

function AdminDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [analytics, setAnalytics] = useState([]);
  const [doctorForm, setDoctorForm] = useState({ name: "" });
  const [assistantForm, setAssistantForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [assistantAssignments, setAssistantAssignments] = useState({});
  const [doctorMessage, setDoctorMessage] = useState("");
  const [doctorError, setDoctorError] = useState("");
  const [assistantMessage, setAssistantMessage] = useState("");
  const [assistantError, setAssistantError] = useState("");
  const [socket] = useState(() => io(API_BASE_URL));
  const navigate = useNavigate();

  const fetchQueue = async (queueId) => {
    if (!queueId) {
      setQueue([]);
      return;
    }

    const res = await axios.get(`${API_BASE_URL}/queue/${queueId}`);
    setQueue(res.data);
  };

  const fetchAnalytics = async (queueId) => {
    if (!queueId) {
      setAnalytics([]);
      return;
    }

    const res = await axios.get(`${API_BASE_URL}/analytics/${queueId}`);
    setAnalytics(res.data);
  };

  const fetchDoctors = async () => {
    const res = await axios.get(`${API_BASE_URL}/doctor`);
    const doctorList = res.data;

    setDoctors(doctorList);
    setSelectedDoctor((currentDoctor) => {
      const hasCurrentDoctor = doctorList.some(
        (doctor) => doctor.queueId === currentDoctor,
      );

      if (hasCurrentDoctor) {
        return currentDoctor;
      }

      return doctorList[0]?.queueId || "";
    });
  };

  const fetchAssistants = async () => {
    const res = await axios.get(`${API_BASE_URL}/assistant`);
    const assistantList = res.data;

    setAssistants(assistantList);
    setAssistantAssignments((currentAssignments) => {
      const nextAssignments = { ...currentAssignments };

      assistantList.forEach((assistant) => {
        nextAssignments[assistant._id] =
          currentAssignments[assistant._id] ||
          assistant.assignedDoctorId?._id ||
          "";
      });

      return nextAssignments;
    });
  };

  const callNext = async () => {
    if (!selectedDoctor || queue.length === 0) return;

    await axios.post(`${API_BASE_URL}/next`, { queueId: selectedDoctor });
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/");
  };

  const handleDoctorInputChange = (event) => {
    const { name, value } = event.target;

    setDoctorForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAssistantInputChange = (event) => {
    const { name, value } = event.target;

    setAssistantForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddDoctor = async (event) => {
    event.preventDefault();
    setDoctorMessage("");
    setDoctorError("");

    try {
      await axios.post(`${API_BASE_URL}/doctor`, {
        name: doctorForm.name.trim(),
      });

      setDoctorForm({ name: "" });
      setDoctorMessage("Doctor added successfully.");
      await fetchDoctors();
    } catch (error) {
      setDoctorError(error.response?.data?.message || "Failed to add doctor.");
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    setDoctorMessage("");
    setDoctorError("");

    try {
      await axios.delete(`${API_BASE_URL}/doctor/${doctorId}`);
      setDoctorMessage("Doctor deleted successfully.");
      await fetchDoctors();
    } catch (error) {
      setDoctorError(
        error.response?.data?.message || "Failed to delete doctor.",
      );
    }
  };

  const handleAddAssistant = async (event) => {
    event.preventDefault();
    setAssistantMessage("");
    setAssistantError("");

    try {
      await axios.post(`${API_BASE_URL}/assistant`, {
        name: assistantForm.name.trim(),
        email: assistantForm.email.trim(),
        password: assistantForm.password,
      });

      setAssistantForm({ name: "", email: "", password: "" });
      setAssistantMessage("Assistant added successfully.");
      await fetchAssistants();
    } catch (error) {
      setAssistantError(
        error.response?.data?.message || "Failed to add assistant.",
      );
    }
  };

  const handleAssistantDoctorChange = (assistantId, doctorId) => {
    setAssistantAssignments((prev) => ({
      ...prev,
      [assistantId]: doctorId,
    }));
  };

  const handleAssignDoctor = async (assistantId) => {
    const doctorId = assistantAssignments[assistantId];

    if (!doctorId) {
      setAssistantError("Please select a doctor before assigning.");
      setAssistantMessage("");
      return;
    }

    setAssistantMessage("");
    setAssistantError("");

    try {
      await axios.put(`${API_BASE_URL}/assistant/${assistantId}/assign`, {
        doctorId,
      });

      setAssistantMessage("Doctor assigned successfully.");
      await fetchAssistants();
    } catch (error) {
      setAssistantError(
        error.response?.data?.message || "Failed to assign doctor.",
      );
    }
  };

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");

    if (!isAdmin) {
      navigate("/admin");
      return;
    }

    fetchDoctors();
    fetchAssistants();
  }, [navigate]);

  useEffect(() => {
    if (!selectedDoctor) {
      setCurrent(null);
      setQueue([]);
      setAnalytics([]);
      return;
    }

    setCurrent(null);
    fetchQueue(selectedDoctor);
    fetchAnalytics(selectedDoctor);
    socket.emit("joinRoom", selectedDoctor);

    const handleQueueUpdated = async (data) => {
      console.log("QUEUE UPDATE:", data);
      if (data.queueId === selectedDoctor) {
        await fetchQueue(selectedDoctor);
        await fetchAnalytics(selectedDoctor);
      }
    };

    const handleNowServing = async (data) => {
      console.log("ADMIN RECIEVED:", data);
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>Admin Dashboard</h2>

        <button
          onClick={handleLogout}
          style={{
            padding: "8px 15px",
            backgroundColor: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <h2>Manage Doctors</h2>

          <form onSubmit={handleAddDoctor}>
            <input
              name="name"
              value={doctorForm.name}
              onChange={handleDoctorInputChange}
              placeholder="Doctor name"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />

            <button
              type="submit"
              style={{
                padding: "10px 20px",
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Add Doctor
            </button>
          </form>

          {doctorMessage && (
            <p style={{ color: "#27ae60", marginTop: "12px" }}>
              {doctorMessage}
            </p>
          )}

          {doctorError && (
            <p style={{ color: "#e74c3c", marginTop: "12px" }}>{doctorError}</p>
          )}
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <h2>Manage Assistants</h2>

          <form onSubmit={handleAddAssistant}>
            <input
              name="name"
              value={assistantForm.name}
              onChange={handleAssistantInputChange}
              placeholder="Assistant name"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />

            <input
              name="email"
              type="email"
              value={assistantForm.email}
              onChange={handleAssistantInputChange}
              placeholder="Assistant email"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />

            <input
              name="password"
              type="password"
              value={assistantForm.password}
              onChange={handleAssistantInputChange}
              placeholder="Assistant password"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />

            <button
              type="submit"
              style={{
                padding: "10px 20px",
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Add Assistant
            </button>
          </form>

          {assistantMessage && (
            <p style={{ color: "#27ae60", marginTop: "12px" }}>
              {assistantMessage}
            </p>
          )}

          {assistantError && (
            <p style={{ color: "#e74c3c", marginTop: "12px" }}>
              {assistantError}
            </p>
          )}
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <h2>Doctor List</h2>

          {doctors.length === 0 ? (
            <p>No doctors added yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {doctors.map((doctor) => (
                <li
                  key={doctor._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid #ecf0f1",
                  }}
                >
                  <div>
                    <strong>{doctor.name}</strong>
                    <p style={{ margin: "5px 0 0", color: "#555" }}>
                      Queue ID: {doctor.queueId}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteDoctor(doctor._id)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#e74c3c",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <h2>Assistant List</h2>

          {assistants.length === 0 ? (
            <p>No assistants added yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {assistants.map((assistant) => (
                <li
                  key={assistant._id}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #ecf0f1",
                  }}
                >
                  <div style={{ marginBottom: "10px" }}>
                    <strong>{assistant.name}</strong>
                    <p style={{ margin: "5px 0", color: "#555" }}>
                      {assistant.email}
                    </p>
                    <p style={{ margin: 0, color: "#555" }}>
                      Assigned Doctor:{" "}
                      {assistant.assignedDoctorId?.name || "Not assigned"}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <select
                      value={assistantAssignments[assistant._id] || ""}
                      onChange={(event) =>
                        handleAssistantDoctorChange(
                          assistant._id,
                          event.target.value,
                        )
                      }
                      style={{
                        padding: "10px",
                        borderRadius: "5px",
                        minWidth: "180px",
                      }}
                    >
                      <option value="">Select doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          {doctor.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleAssignDoctor(assistant._id)}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#2ecc71",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Assign Doctor
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            disabled={doctors.length === 0}
            style={{
              padding: "10px",
              borderRadius: "5px",
              minWidth: "220px",
            }}
          >
            {doctors.length === 0 ? (
              <option value="">No doctors available</option>
            ) : (
              doctors.map((doctor) => (
                <option key={doctor._id} value={doctor.queueId}>
                  {doctor.name} ({doctor.queueId})
                </option>
              ))
            )}
          </select>
        </div>

        <button
          onClick={callNext}
          disabled={!selectedDoctor || queue.length === 0}
          style={{
            padding: "10px 20px",
            backgroundColor:
              !selectedDoctor || queue.length === 0 ? "#ccc" : "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor:
              !selectedDoctor || queue.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          Call Next
        </button>
      </div>

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

        {selectedDoctor ? (
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
        ) : (
          <p>Add a doctor to start managing queues.</p>
        )}
      </div>

      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "10px",
          maxWidth: "400px",
          margin: "30px auto",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        <h2>Analytics</h2>

        {analytics.length === 0 ? (
          <p>No analytics available.</p>
        ) : (
          analytics.map((item) => (
            <div key={item._id} style={{ marginBottom: "10px" }}>
              <strong>{item._id.toUpperCase()}</strong>
              <p>Total Patients: {item.totalPatients}</p>
              <p>Avg Wait Time: {Math.round(item.avgWaitTime || 0)} mins</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
