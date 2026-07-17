import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "axios";
import Swal from "sweetalert2";
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

  const customSwal = Swal.mixin({
    customClass: {
      popup: "rounded-2xl border border-slate-800 bg-[#131c35] text-white shadow-2xl p-6 font-sans",
      title: "text-lg font-bold text-white",
      htmlContainer: "text-xs text-slate-400 mt-1",
      confirmButton: "px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200"
    },
    buttonsStyling: false
  });

  useEffect(() => {
    setRole(localStorage.getItem("role"));
    if (!localStorage.getItem("token")) navigate("/login");
  }, [navigate]);

  const addMember = async () => {
    if (!memberData.username || !memberData.email || !memberData.password) {
      customSwal.fire({
        title: "Validation Error",
        text: "Please fulfill all required fields before saving.",
        icon: "warning"
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axiosInstance.post("http://localhost:5000/api/auth/add-member", memberData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      customSwal.fire({
        title: "Success",
        text: "Member added successfully to corporate workspace!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
      
      setMemberData({ username: "", email: "", password: "", role: "user" });
    } catch (err) {
      customSwal.fire({
        title: "Addition Failed",
        text: err.response?.data?.error || "Failed to append organization member.",
        icon: "error"
      });
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
    <div className="flex h-screen bg-[#0b1329] text-slate-100 overflow-hidden font-sans">

      <div className="w-64 bg-[#11192e] text-white flex flex-col p-5 border-r border-slate-800/60 shadow-2xl h-full">
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => setActiveTab("Dashboard")}>
          <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <HiViewGrid className="text-xl text-white" />
          </div>
          <h2 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">CRM PORTAL</h2>
        </div>

        <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                activeTab === item.name
                  ? "bg-blue-600 shadow-lg shadow-blue-600/20 text-white"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              <item.icon className="text-lg" />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto p-3 bg-[#131c35]/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <HiUserCircle className="text-3xl text-blue-500" />
          <div className="overflow-hidden">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Active Workspace</p>
            <p className="text-xs font-semibold text-slate-200 truncate capitalize">{role}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0b1329]">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d_1px,transparent_1px),linear-gradient(to_bottom,#1f293d_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none"></div>

          {activeTab === "Dashboard" && (
            <div className="max-w-xl mx-auto mt-6 relative z-10">
              <header className="mb-8 text-center">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Environment</h1>
                <p className="text-xs text-slate-400 mt-1.5">Configure company pipeline access control matrices.</p>
              </header>

              {role === "admin" ? (
                <div className="bg-[#131c35]/80 border border-slate-800/80 p-8 rounded-2xl backdrop-blur-xl shadow-xl">
                  <div className="flex items-center gap-2 mb-6 text-blue-500 border-b pb-4 border-slate-800">
                    <HiPlusCircle className="text-2xl" />
                    <h3 className="text-md font-bold text-white">Add New Member</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
                      <input className="w-full px-4 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:border-blue-500 outline-none transition-all" placeholder="operator_user" value={memberData.username} onChange={(e) => setMemberData({ ...memberData, username: e.target.value })} />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                      <input className="w-full px-4 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:border-blue-500 outline-none transition-all" placeholder="name@company.com" value={memberData.email} onChange={(e) => setMemberData({ ...memberData, email: e.target.value })} />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                      <input className="w-full px-4 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:border-blue-500 outline-none transition-all" type="password" placeholder="••••••••" value={memberData.password} onChange={(e) => setMemberData({ ...memberData, password: e.target.value })} />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Authority</label>
                      <select className="w-full px-4 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-sm focus:border-blue-500 outline-none transition-all" value={memberData.role} onChange={(e) => setMemberData({ ...memberData, role: e.target.value })}>
                        <option value="user" className="bg-[#0f172a]">User</option>
                        <option value="manager" className="bg-[#0f172a]">Manager</option>
                      </select>
                    </div>

                    <button onClick={addMember} className="w-full mt-2 bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-500 shadow-lg shadow-blue-600/10 transition-all">Save Member</button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#1c1212]/40 p-8 rounded-2xl border border-red-950/50 text-center backdrop-blur-sm">
                  <p className="text-red-400 text-sm font-medium">Limited Access View</p>
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