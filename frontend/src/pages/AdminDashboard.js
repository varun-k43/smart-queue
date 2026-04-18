import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

const navItems = ["Dashboard", "Doctors", "Assistants", "Reports"];

function AdminDashboard() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [doctors, setDoctors] = useState([]);
  const [assistants, setAssistants] = useState([]);
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
  const navigate = useNavigate();

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/doctor`);
      setDoctors(res.data);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  }, []);

  const fetchAssistants = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/assistant`);
      const assistantList = res.data;

      setAssistants(assistantList);
      setAssistantAssignments((currentAssignments) => {
        const nextAssignments = {};

        assistantList.forEach((assistant) => {
          nextAssignments[assistant._id] =
            assistant.assignedDoctorId?._id ||
            currentAssignments[assistant._id] ||
            "";
        });

        return nextAssignments;
      });
    } catch (err) {
      console.error("Error fetching assistants:", err);
    }
  }, []);

  const refreshManagementData = useCallback(async () => {
    try {
      await Promise.all([fetchDoctors(), fetchAssistants()]);
    } catch (err) {
      console.error("Error refreshing data:", err);
    }
  }, [fetchDoctors, fetchAssistants]);

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
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    setDoctorMessage("");
    setDoctorError("");

    try {
      await axios.delete(`${API_BASE_URL}/doctor/${doctorId}`);
      setDoctorMessage("Doctor deleted successfully.");
      await refreshManagementData();
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

  const handleDeleteAssistant = async (assistantId) => {
    if (!window.confirm("Are you sure you want to delete this assistant?"))
      return;
    setAssistantMessage("");
    setAssistantError("");

    try {
      await axios.delete(`${API_BASE_URL}/assistant/${assistantId}`);
      setAssistantMessage("Assistant deleted successfully.");
      await fetchAssistants();
    } catch (error) {
      setAssistantError(
        error.response?.data?.message || "Failed to delete assistant.",
      );
    }
  };

  const handleAssistantDoctorChange = (assistantId, doctorId) => {
    setAssistantAssignments((prev) => ({
      ...prev,
      [assistantId]: doctorId,
    }));
  };

  const assignDoctor = async (assistantId, doctorId) => {
    if (!assistantId || !doctorId) {
      setAssistantError(
        "Please select an assistant and doctor before assigning.",
      );
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
      setAssistantAssignments((prev) => ({
        ...prev,
        [assistantId]: "",
      }));
    } catch (error) {
      setAssistantError(
        error.response?.data?.message || "Failed to assign doctor.",
      );
    }
  };

  const handleAssignDoctor = async (assistantId) => {
    await assignDoctor(assistantId, assistantAssignments[assistantId]);
  };

  const renderStatusMessage = (message, error) => (
    <>
      {message && (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </>
  );

  const inputClass =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const primaryButtonClass =
    "rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300";
  const secondaryButtonClass =
    "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700";
  const dangerButtonClass =
    "rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50";

  const dashboardContent = (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Doctors</p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            {doctors.length}
          </p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Assistants</p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            {assistants.length}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Add Doctor</h2>
          <form onSubmit={handleAddDoctor} className="mt-5 space-y-4">
            <input
              className={inputClass}
              name="name"
              value={doctorForm.name}
              onChange={handleDoctorInputChange}
              placeholder="Doctor name"
            />
            <button type="submit" className={primaryButtonClass}>
              Add Doctor
            </button>
          </form>
          {renderStatusMessage(doctorMessage, doctorError)}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Add Assistant
          </h2>
          <form
            onSubmit={handleAddAssistant}
            className="mt-5 grid gap-4 sm:grid-cols-2"
          >
            <input
              className={inputClass}
              name="name"
              value={assistantForm.name}
              onChange={handleAssistantInputChange}
              placeholder="Assistant name"
            />
            <input
              className={inputClass}
              name="email"
              type="email"
              value={assistantForm.email}
              onChange={handleAssistantInputChange}
              placeholder="Assistant email"
            />
            <input
              className={`${inputClass} sm:col-span-2`}
              name="password"
              type="password"
              value={assistantForm.password}
              onChange={handleAssistantInputChange}
              placeholder="Assistant password"
            />
            <button type="submit" className={`${primaryButtonClass} sm:w-fit`}>
              Add Assistant
            </button>
          </form>
          {renderStatusMessage(assistantMessage, assistantError)}
        </section>
      </div>
    </div>
  );

  const doctorsContent = (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Doctors</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Queue ID</th>
              <th className="px-5 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doctors.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-slate-500" colSpan="3">
                  No doctors added yet.
                </td>
              </tr>
            ) : (
              doctors.map((doctor) => (
                <tr key={doctor._id} className="bg-white">
                  <td className="px-5 py-4 font-medium text-slate-900">
                    {doctor.name}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{doctor.queueId}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      className={dangerButtonClass}
                      onClick={() => handleDeleteDoctor(doctor._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-5 pb-5">
        {renderStatusMessage(doctorMessage, doctorError)}
      </div>
    </section>
  );

  const assistantsContent = (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Assistants</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[860px] divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Assigned Doctor</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assistants.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-slate-500" colSpan="4">
                  No assistants added yet.
                </td>
              </tr>
            ) : (
              assistants.map((assistant) => (
                <tr key={assistant._id} className="bg-white align-middle">
                  <td className="px-5 py-4 font-medium text-slate-900">
                    {assistant.name}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {assistant.email}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {assistant.assignedDoctorId?.name || "Not assigned"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <select
                        className="min-w-44 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        value={assistantAssignments[assistant._id] || ""}
                        onChange={(event) =>
                          handleAssistantDoctorChange(
                            assistant._id,
                            event.target.value,
                          )
                        }
                      >
                        <option value="">Select doctor</option>
                        {doctors.map((doctor) => (
                          <option key={doctor._id} value={doctor._id}>
                            {doctor.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={() => handleAssignDoctor(assistant._id)}
                      >
                        Assign
                      </button>
                      <button
                        type="button"
                        className={dangerButtonClass}
                        onClick={() => handleDeleteAssistant(assistant._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-5 pb-5">
        {renderStatusMessage(assistantMessage, assistantError)}
      </div>
    </section>
  );

  const reportsContent = (
    <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <span className="text-lg font-bold">R</span>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">Reports</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Management reports will be available here.
        </p>
      </div>
    </section>
  );

  const pageContent = {
    Dashboard: dashboardContent,
    Doctors: doctorsContent,
    Assistants: assistantsContent,
    Reports: reportsContent,
  }[activePage];

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      navigate("/admin");
      return;
    }
    refreshManagementData();
  }, [navigate, refreshManagementData]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-x-0 top-0 z-20 border-b border-blue-100 bg-white/95 shadow-sm backdrop-blur lg:inset-y-0 lg:left-0 lg:right-auto lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-5 lg:h-auto lg:flex-col lg:items-start lg:gap-8 lg:px-6 lg:py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Hospital Admin
            </p>
            <h1 className="text-lg font-bold text-slate-950">Smart Queue</h1>
          </div>
          <button
            type="button"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 lg:hidden"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-5 pb-3 lg:flex-col lg:px-4 lg:pb-0">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setActivePage(item)}
              className={`whitespace-nowrap rounded-md px-4 py-2.5 text-left text-sm font-semibold transition ${
                activePage === item
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="mt-auto hidden p-4 lg:block">
          <button
            type="button"
            className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="px-4 pb-10 pt-36 sm:px-6 lg:ml-64 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Admin Management
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                {activePage}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              Manage doctors, assistants, and assignments from one clean
              workspace.
            </p>
          </div>

          {pageContent}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
