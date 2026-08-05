import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "axios";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Pipeline from "./Pipeline";
import InvestorsTable from "./InvestorsTable";
import Funds from "./Funds";
import TasksTable from "./TasksTable";

import {
  HiUsers, HiChartBar, HiClipboardList, HiViewGrid,
  HiPlusCircle, HiUserCircle, HiOfficeBuilding, HiTrendingUp, 
  HiShieldCheck, HiMail, HiLockClosed, HiSparkles
} from "react-icons/hi";

export default function Dashboard() {
  const [role, setRole] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const navigate = useNavigate();

  const [counts, setCounts] = useState({
    investors: 0,
    funds: 0,
    pipelines: 0,
    tasks: 0
  });

  const [memberData, setMemberData] = useState({
    username: "", email: "", password: "", role: "user"
  });

  const customSwal = Swal.mixin({
    customClass: {
      popup: "rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl p-6 font-sans",
      title: "text-lg font-bold text-zinc-100",
      htmlContainer: "text-xs text-zinc-400 mt-1",
      confirmButton: "px-5 py-2 rounded-lg text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-all duration-200"
    },
    buttonsStyling: false
  });

  useEffect(() => {
    const currentRole = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    setRole(currentRole);
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchCounts = async () => {
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };
      try {
        const [investorsRes, fundsRes, pipelinesRes, tasksRes] = await Promise.allSettled([
          axiosInstance.get("http://localhost:5000/api/investors", authHeader),
          axiosInstance.get("http://localhost:5000/api/funds", authHeader),
          axiosInstance.get("http://localhost:5000/api/pipelines", authHeader),
          axiosInstance.get("http://localhost:5000/api/tasks", authHeader)
        ]);

        setCounts({
          investors: investorsRes.status === "fulfilled" ? (Array.isArray(investorsRes.value.data) ? investorsRes.value.data.length : investorsRes.value.data.count || 0) : 0,
          funds: fundsRes.status === "fulfilled" ? (Array.isArray(fundsRes.value.data) ? fundsRes.value.data.length : fundsRes.value.data.count || 0) : 0,
          pipelines: pipelinesRes.status === "fulfilled" ? (Array.isArray(pipelinesRes.value.data) ? pipelinesRes.value.data.length : pipelinesRes.value.data.count || 0) : 0,
          tasks: tasksRes.status === "fulfilled" ? (Array.isArray(tasksRes.value.data) ? tasksRes.value.data.length : tasksRes.value.data.count || 0) : 0
        });
      } catch (err) {
        console.error("Failed to fetch dynamic counts", err);
      }
    };

    fetchCounts();
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

  const stats = [
    { title: "Total Investors", count: counts.investors, icon: HiUsers, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { title: "Total Funds", count: counts.funds, icon: HiOfficeBuilding, color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
    { title: "Active Pipelines", count: counts.pipelines, icon: HiTrendingUp, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
    { title: "Pending Tasks", count: counts.tasks, icon: HiClipboardList, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">

      <div className="w-64 bg-zinc-900 text-zinc-100 flex flex-col p-5 border-r border-zinc-800 shadow-xl h-full z-20">
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => setActiveTab("Dashboard")}>
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
            <HiViewGrid className="text-xl text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold tracking-wider text-zinc-100 uppercase">CRM PORTAL</h2>
        </div>

        <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isActive ? "text-emerald-400 font-semibold" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-zinc-800 border border-zinc-700/60 rounded-xl"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <item.icon className="text-lg" />
                  <span>{item.name}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-3">
          <HiUserCircle className="text-3xl text-emerald-400" />
          <div className="overflow-hidden">
            <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Active Workspace</p>
            <p className="text-xs font-semibold text-zinc-200 truncate capitalize">{role}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8 relative">
          <AnimatePresence mode="wait">
            {activeTab === "Dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="max-w-6xl mx-auto space-y-8 relative z-10"
              >
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                  <div>
                    <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                      Admin Overview Environment
                      <HiSparkles className="text-emerald-400 text-xl" />
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">Configure company pipeline metrics and workspace access permissions.</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg w-fit shadow-sm">
                    <HiShieldCheck className="text-emerald-400 text-base" />
                    <span className="text-xs text-zinc-300 font-medium capitalize">Role: {role}</span>
                  </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {stats.map((stat, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02, y: -3 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl transition-colors hover:border-zinc-700 shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{stat.title}</p>
                          <h3 className="text-3xl font-extrabold text-zinc-100 mt-2">
                            {stat.count}
                          </h3>
                        </div>
                        <div className={`p-3 rounded-xl border ${stat.color}`}>
                          <stat.icon className="text-2xl" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {role === "admin" ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl"
                  >
                    <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-emerald-400">
                        <HiPlusCircle className="text-2xl" />
                        <h3 className="text-md font-bold text-zinc-100">Add Organization Member</h3>
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
                        Admin Privilege
                      </span>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <HiUsers className="text-zinc-500" />
                            Username
                          </label>
                          <input
                            className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500/70 rounded-xl text-zinc-100 placeholder-zinc-600 text-sm outline-none transition-all duration-200"
                            placeholder="operator_user"
                            value={memberData.username}
                            onChange={(e) => setMemberData({ ...memberData, username: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <HiMail className="text-zinc-500" />
                            Email Address
                          </label>
                          <input
                            className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500/70 rounded-xl text-zinc-100 placeholder-zinc-600 text-sm outline-none transition-all duration-200"
                            placeholder="name@company.com"
                            value={memberData.email}
                            onChange={(e) => setMemberData({ ...memberData, email: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <HiLockClosed className="text-zinc-500" />
                            Password
                          </label>
                          <input
                            type="password"
                            className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500/70 rounded-xl text-zinc-100 placeholder-zinc-600 text-sm outline-none transition-all duration-200"
                            placeholder="••••••••"
                            value={memberData.password}
                            onChange={(e) => setMemberData({ ...memberData, password: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <HiShieldCheck className="text-zinc-500" />
                            Role Authority
                          </label>
                          <select
                            className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500/70 rounded-xl text-zinc-100 text-sm outline-none transition-all duration-200"
                            value={memberData.role}
                            onChange={(e) => setMemberData({ ...memberData, role: e.target.value })}
                          >
                            <option value="user" className="bg-zinc-900">User</option>
                            <option value="manager" className="bg-zinc-900">Manager</option>
                          </select>
                        </div>

                      </div>

                      <div className="mt-6 flex justify-end">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={addMember}
                          className="w-full md:w-auto px-8 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                        >
                          <HiPlusCircle className="text-lg" />
                          <span>Save Workspace Member</span>
                        </motion.button>
                      </div>

                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 text-center">
                    <p className="text-zinc-400 text-sm font-medium">Limited Access View — Contact Admin to modify organization settings.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === "Investors" && <InvestorsTable />}
          {activeTab === "Funds" && <Funds />}
          {activeTab === "Pipelines" && <Pipeline />}
          {activeTab === "Tasks" && <TasksTable />}

        </main>
      </div>
    </div>
  );
}