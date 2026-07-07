import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Pipeline from "./Pipeline";
import InvestorsTable from "./InvestorsTable";
import Funds from "./Funds";
import TasksTable from "./TasksTable";

import {
  HiUsers, HiChartBar, HiClipboardList, HiViewGrid,
  HiPlusCircle, HiUserCircle, HiOfficeBuilding
} from "react-icons/hi";

export default function Dashboard() {
  const [role, setRole] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const navigate = useNavigate();

  const [memberData, setMemberData] = useState({
    username: "", email: "", password: "", role: "user"
  });

  useEffect(() => {
    setRole(localStorage.getItem("role"));
    if (!localStorage.getItem("token")) navigate("/login");
  }, [navigate]);

  const addMember = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/auth/add-member", memberData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Member added successfully!");
      setMemberData({ username: "", email: "", password: "", role: "user" });
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add member");
    }
  };

  const menuItems = [
    { name: "Dashboard", icon: HiViewGrid },
    { name: "Investors", icon: HiUsers },
    { name: "Funds", icon: HiOfficeBuilding },
    { name: "Pipelines", icon: HiChartBar },
    { name: "Tasks", icon: HiClipboardList },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-slate-800 overflow-hidden">

      <div className="w-64 bg-slate-900 text-white flex flex-col p-5 shadow-2xl h-full">
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => setActiveTab("Dashboard")}>
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
            <HiViewGrid className="text-2xl text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">CRM PANEL</h2>
        </div>

        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === item.name
                  ? "bg-blue-600 shadow-lg shadow-blue-900/50 text-white"
                  : "hover:bg-slate-800 text-slate-400 hover:text-white"
                }`}
            >
              <item.icon className="text-xl" />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 flex items-center gap-3">
          <HiUserCircle className="text-3xl text-blue-400" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold">Admin Panel</p>
            <p className="text-sm font-semibold text-white capitalize">{role}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6">

          {activeTab === "Dashboard" && (
            <div className="max-w-2xl mx-auto mt-10">
              <header className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-slate-900">Admin Controls</h1>
                <p className="text-slate-500 mt-2">Manage your team and company access.</p>
              </header>

              {role === "admin" ? (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-8 text-blue-600 border-b pb-4 border-slate-100">
                    <HiPlusCircle className="text-3xl" />
                    <h3 className="text-xl font-bold text-slate-800">Add New Member</h3>
                  </div>
                  <div className="space-y-4">
                    <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Username" value={memberData.username} onChange={(e) => setMemberData({ ...memberData, username: e.target.value })} />
                    <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email" value={memberData.email} onChange={(e) => setMemberData({ ...memberData, email: e.target.value })} />
                    <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" type="password" placeholder="Password" value={memberData.password} onChange={(e) => setMemberData({ ...memberData, password: e.target.value })} />
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={memberData.role} onChange={(e) => setMemberData({ ...memberData, role: e.target.value })}>
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                    </select>
                    <button onClick={addMember} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">Save Member</button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 p-10 rounded-3xl border border-amber-200 text-center">
                  <p className="text-amber-800 font-semibold">Limited Access View</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "Investors" && <InvestorsTable />}

          {activeTab === "Funds" && <Funds />}

          {activeTab === "Pipelines" && <Pipeline />}

          {activeTab === "Tasks" && <TasksTable />}

        </main>
      </div>
    </div>
  );
}