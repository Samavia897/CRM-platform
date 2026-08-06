import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "axios";
import Swal from "sweetalert2";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import Navbar from "../components/Navbar";
import Pipeline from "./Pipeline";
import InvestorsTable from "./InvestorsTable";
import Funds from "./Funds";
import TasksTable from "./TasksTable";

import {
  HiUsers, HiChartBar, HiClipboardList, HiViewGrid,
  HiPlusCircle, HiUserCircle, HiOfficeBuilding, HiTrendingUp, 
  HiShieldCheck, HiMail, HiLockClosed, HiSparkles, HiLightningBolt,
  HiArrowSmUp
} from "react-icons/hi";

function AnimatedNumber({ value }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

export default function Dashboard() {
  const [role, setRole] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const navigate = useNavigate();

  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  // Smooth springs for custom cursor motion
  const cursorX = useSpring(mousePos.x, { stiffness: 400, damping: 28 });
  const cursorY = useSpring(mousePos.y, { stiffness: 400, damping: 28 });

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
      popup: "rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl p-6 font-sans backdrop-blur-lg",
      title: "text-lg font-bold text-zinc-100",
      htmlContainer: "text-xs text-zinc-400 mt-1",
      confirmButton: "px-5 py-2 rounded-lg text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-all duration-200"
    },
    buttonsStyling: false
  });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    setMousePos({ x: clientX, y: clientY });
    cursorX.set(clientX);
    cursorY.set(clientY);


    const target = e.target;
    const isInteractive = target.closest("button, a, input, select, .cursor-pointer, [role='button']");
    setIsHovered(!!isInteractive);
  };

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
    { title: "Total Investors", count: counts.investors, growth: "+12.5%", icon: HiUsers, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { title: "Total Funds", count: counts.funds, growth: "+8.2%", icon: HiOfficeBuilding, color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
    { title: "Active Pipelines", count: counts.pipelines, growth: "+24.0%", icon: HiTrendingUp, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
    { title: "Pending Tasks", count: counts.tasks, growth: "-3.1%", icon: HiClipboardList, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 20 } }
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans relative selection:bg-emerald-500/30 selection:text-emerald-200 cursor-none"
    >


      <div 
        className="pointer-events-none fixed top-0 left-0 z-50 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"
        style={{
          transform: `translate3d(${mousePos.x - 4}px, ${mousePos.y - 4}px, 0)`
        }}
      />


      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-50 rounded-full border border-emerald-400/60"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%"
        }}
        animate={{
          width: isHovered ? 48 : 28,
          height: isHovered ? 48 : 28,
          backgroundColor: isHovered ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.02)",
          borderColor: isHovered ? "rgba(52, 211, 153, 0.9)" : "rgba(52, 211, 153, 0.4)",
          scale: isHovered ? 1.2 : 1
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />


      <div 
        className="pointer-events-none fixed -inset-px z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.06), transparent 80%)`
        }}
      />

      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 blur-[130px] pointer-events-none rounded-full" 
      />


      <aside className="w-64 bg-zinc-900/80 backdrop-blur-xl text-zinc-100 flex flex-col p-5 border-r border-zinc-800/80 shadow-2xl h-full z-40">
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer group" onClick={() => setActiveTab("Dashboard")}>
          <motion.div 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 p-2.5 rounded-xl border border-emerald-500/30 group-hover:border-emerald-400 shadow-lg shadow-emerald-500/10"
          >
            <HiLightningBolt className="text-xl text-emerald-400" />
          </motion.div>
          <div>
            <h2 className="text-lg font-black tracking-wider text-zinc-100 uppercase bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              NEXUS <span className="text-emerald-400 font-light text-sm">// CRM</span>
            </h2>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`relative flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-sm font-medium ${
                  isActive ? "text-emerald-400 font-semibold" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-zinc-800/90 border border-zinc-700/60 rounded-xl shadow-inner"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <item.icon className={`text-lg transition-colors ${isActive ? "text-emerald-400" : "text-zinc-400"}`} />
                  <span>{item.name}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex items-center gap-3 backdrop-blur-sm">
          <HiUserCircle className="text-3xl text-emerald-400" />
          <div className="overflow-hidden">
            <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Active Workspace</p>
            <p className="text-xs font-semibold text-zinc-200 truncate capitalize">{role}</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950/90 relative z-20">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8 relative">
          <AnimatePresence mode="wait">
            {activeTab === "Dashboard" && (
              <motion.div
                key="dashboard"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                className="max-w-6xl mx-auto space-y-8"
              >

                <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
                  <div>
                    <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                      Admin Control Hub
                      <motion.span
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <HiSparkles className="text-emerald-400 text-xl" />
                      </motion.span>
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">Real-time pipeline analytics & enterprise access control.</p>
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900/90 border border-zinc-800/90 rounded-xl w-fit shadow-md backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <HiShieldCheck className="text-emerald-400 text-base ml-1" />
                    <span className="text-xs text-zinc-300 font-medium capitalize">Role: {role}</span>
                  </div>
                </motion.header>

                <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {stats.map((stat, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.04, y: -6 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/90 p-5 rounded-2xl transition-all duration-300 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 group cursor-pointer"
                    >

                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full group-hover:translate-x-full transform duration-1000" />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{stat.title}</p>
                          <h3 className="text-3xl font-black text-zinc-100 mt-2 tracking-tight">
                            <AnimatedNumber value={stat.count} />
                          </h3>
                        </div>
                        <div className={`p-3 rounded-xl border transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${stat.color}`}>
                          <stat.icon className="text-2xl" />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-[11px] font-medium border-t border-zinc-800/60 pt-3">
                        <span className="text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <HiArrowSmUp className="text-sm" />
                          {stat.growth}
                        </span>
                        <span className="text-zinc-500 text-[10px]">vs last month</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>


                {role === "admin" ? (
                  <motion.div 
                    variants={itemVariants}
                    className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/90 rounded-2xl overflow-hidden shadow-2xl relative"
                  >
                    <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
                      <div className="flex items-center gap-2.5 text-emerald-400">
                        <HiPlusCircle className="text-2xl" />
                        <h3 className="text-md font-bold text-zinc-100">Add Organization Member</h3>
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-800/80 px-3 py-1 rounded-full border border-zinc-700/60">
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
                            className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-zinc-100 placeholder-zinc-600 text-sm outline-none transition-all duration-300"
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
                            className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-zinc-100 placeholder-zinc-600 text-sm outline-none transition-all duration-300"
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
                            className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-zinc-100 placeholder-zinc-600 text-sm outline-none transition-all duration-300"
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
                            className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-zinc-100 text-sm outline-none transition-all duration-300"
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
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={addMember}
                          className="w-full md:w-auto px-8 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 text-zinc-950 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 relative overflow-hidden group"
                        >
                          <HiPlusCircle className="text-lg" />
                          <span>Save Workspace Member</span>
                        </motion.button>
                      </div>

                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-zinc-900/60 p-8 rounded-2xl border border-zinc-800 text-center">
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