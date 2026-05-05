import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import PatientJoinPage from "./pages/PatientJoinPage";
import PatientDashboard from "./pages/PatientDashboard";
import VisitHistory from "./pages/VisitHistory";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AssistantDashboard from "./pages/AssistantDashboard";
import AssistantLogin from "./pages/AssistantLogin";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/user" element={<PatientJoinPage />} />
        <Route path="/dashboard" element={<PatientDashboard />} />
        <Route path="/history" element={<VisitHistory />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/assistant-login" element={<AssistantLogin />} />
        <Route path="/assistant" element={<AssistantDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
