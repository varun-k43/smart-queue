import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "100px",
        fontFamily: "Arial",
      }}
    >
      <h1>Smart Queue System</h1>

      <div style={{ marginTop: "30px" }}>
        <button
          onClick={() => navigate("/user")}
          style={{
            padding: "15px 25px",
            margin: "10px",
            backgroundColor: "#2ecc71",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Continue as User
        </button>

        <button
          onClick={() => navigate("/admin")}
          style={{
            padding: "15px 25px",
            margin: "10px",
            backgroundColor: "#3498db",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Admin Login
        </button>

        <button onClick={() => navigate("/assistant-login")}>
          Assistant Login
        </button>
      </div>
    </div>
  );
}

export default HomePage;
