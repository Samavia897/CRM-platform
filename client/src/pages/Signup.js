import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { motion, useSpring } from "framer-motion";
import {
  HiOfficeBuilding,
  HiUser,
  HiMail,
  HiLockClosed,
  HiLocationMarker,
  HiPhone,
  HiLightningBolt,
  HiSparkles,
} from "react-icons/hi";

export default function Signup() {
  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
    companyName: "",
    companyAddress: "",
    companyContact: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // --- CUSTOM DUAL-RING CURSOR & MOUSE TRACKING (MATCHING DASHBOARD) ---
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  const cursorX = useSpring(mousePos.x, { stiffness: 400, damping: 28 });
  const cursorY = useSpring(mousePos.y, { stiffness: 400, damping: 28 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    setMousePos({ x: clientX, y: clientY });
    cursorX.set(clientX);
    cursorY.set(clientY);

    const target = e.target;
    const isInteractive = target.closest(
      "button, a, input, select, .cursor-pointer, [role='button']"
    );
    setIsHovered(!!isInteractive);
  };

  // --- SWEETALERT CUSTOM MATCHING DASHBOARD ZINC & EMERALD STYLE ---
  const customSwal = Swal.mixin({
    customClass: {
      popup:
        "rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl p-6 font-sans backdrop-blur-lg",
      title: "text-lg font-bold text-zinc-100",
      htmlContainer: "text-xs text-zinc-400 mt-1",
      confirmButton:
        "px-5 py-2 rounded-lg text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-all duration-200",
    },
    buttonsStyling: false,
  });

  const handleSignup = async (e) => {
    if (e) e.preventDefault();

    if (
      !data.username ||
      !data.email ||
      !data.password ||
      !data.companyName ||
      !data.companyAddress ||
      !data.companyContact
    ) {
      customSwal.fire({
        title: "Missing Information",
        text: "Please populate all fields to register your corporation workspace.",
        icon: "warning",
      });
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/signup", data);

      customSwal.fire({
        title: "Workspace Created",
        text: "Account & Company Created Successfully! You are now the Admin.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
      }).then(() => {
        window.location.href = "/login";
      });
    } catch (err) {
      customSwal.fire({
        title: "Registration Failed",
        text:
          err.response?.data?.error ||
          "Could not complete account creation setup.",
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Animated Entrance Variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 240, damping: 22 },
    },
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100 overflow-hidden font-sans p-4 selection:bg-emerald-500/30 selection:text-emerald-200 cursor-none select-none"
    >
      {/* 🟢 CUSTOM CURSOR 1: INNER DOT */}
      <div
        className="pointer-events-none fixed top-0 left-0 z-50 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"
        style={{
          transform: `translate3d(${mousePos.x - 4}px, ${mousePos.y - 4}px, 0)`,
        }}
      />

      {/* 🟢 CUSTOM CURSOR 2: OUTER SPRING RING WITH HOVER DYNAMICS */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-50 rounded-full border border-emerald-400/60"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: isHovered ? 48 : 28,
          height: isHovered ? 48 : 28,
          backgroundColor: isHovered
            ? "rgba(16, 185, 129, 0.15)"
            : "rgba(16, 185, 129, 0.02)",
          borderColor: isHovered
            ? "rgba(52, 211, 153, 0.9)"
            : "rgba(52, 211, 153, 0.4)",
          scale: isHovered ? 1.2 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />

      {/* 🌟 SPOTLIGHT RADIAL GRADIENT (Dashboard Matching) */}
      <div
        className="pointer-events-none fixed -inset-px z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.08), transparent 80%)`,
        }}
      />

      {/* 🔮 AMBIENT PULSING GLOW ORBS */}
      <motion.div
        animate={{ scale: [1, 1.25, 1], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[45rem] h-[45rem] rounded-full bg-emerald-500/20 blur-[140px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.18, 0.1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[45rem] h-[45rem] rounded-full bg-teal-500/15 blur-[140px] pointer-events-none"
      />

      {/* 📐 HIGH-TECH MESH GRID MASK */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

      {/* 🌊 ANIMATED VECTOR STROKE PATHS */}
      <div className="absolute inset-0 opacity-20 pointer-events-none hidden md:block">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 0 300 Q 300 150 600 350 T 1200 200 T 1920 400"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            className="animate-[pulse_4s_ease-in-out_infinite]"
          />
          <path
            d="M 0 400 Q 400 250 800 450 T 1600 300 T 1920 500"
            fill="none"
            stroke="#2dd4bf"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
        </svg>
      </div>

      {/* 💳 MAIN SIGNUP CARD (NEXUS CRM MATCHING) */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-lg p-8 mx-4 bg-zinc-900/80 border border-zinc-800/90 rounded-2xl backdrop-blur-xl shadow-2xl my-8 transition-all duration-300 hover:border-zinc-700/90"
      >
        {/* Animated Top Emerald Border Glow Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-pulse" />

        {/* Branding Badge & Title matching Dashboard Sidebar Header */}
        <div className="flex flex-col items-center mb-6">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.4 }}
            className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-3 group"
          >
            <HiLightningBolt className="text-2xl text-emerald-400" />
          </motion.div>

          <h2 className="text-2xl font-black tracking-wider text-zinc-100 uppercase flex items-center gap-1.5">
            NEXUS{" "}
            <span className="text-emerald-400 font-light text-base">// REGISTER</span>
            <HiSparkles className="text-emerald-400 text-lg ml-1 animate-pulse" />
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            Deploy corporate workspace environment & admin settings
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <HiUser className="text-zinc-500" />
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="John Doe"
                className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-zinc-100 placeholder-zinc-600 text-sm outline-none transition-all duration-300 cursor-none"
                onChange={(e) => setData({ ...data, username: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <HiMail className="text-zinc-500" />
                Work Email
              </label>
              <input
                type="email"
                required
                placeholder="admin@company.com"
                className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-zinc-100 placeholder-zinc-600 text-sm outline-none transition-all duration-300 cursor-none"
                onChange={(e) => setData({ ...data, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <HiLockClosed className="text-zinc-500" />
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-zinc-100 placeholder-zinc-600 text-sm outline-none transition-all duration-300 cursor-none"
              onChange={(e) => setData({ ...data, password: e.target.value })}
            />
          </div>

          {/* Glowing Section Separator */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-800/80"></div>
            <span className="flex-shrink mx-4 text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Company Framework
            </span>
            <div className="flex-grow border-t border-zinc-800/80"></div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <HiOfficeBuilding className="text-zinc-500" />
              Company Name
            </label>
            <input
              type="text"
              required
              placeholder="Enterprise Solutions Inc."
              className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-zinc-100 placeholder-zinc-600 text-sm outline-none transition-all duration-300 cursor-none"
              onChange={(e) => setData({ ...data, companyName: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <HiLocationMarker className="text-zinc-500" />
              Company Address
            </label>
            <input
              type="text"
              required
              placeholder="Headquarters Ave, Suite 500"
              className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-zinc-100 placeholder-zinc-600 text-sm outline-none transition-all duration-300 cursor-none"
              onChange={(e) =>
                setData({ ...data, companyAddress: e.target.value })
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <HiPhone className="text-zinc-500" />
              Company Contact Number
            </label>
            <input
              type="text"
              required
              placeholder="+1 (555) 019-2834"
              className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-zinc-100 placeholder-zinc-600 text-sm outline-none transition-all duration-300 cursor-none"
              onChange={(e) =>
                setData({ ...data, companyContact: e.target.value })
              }
            />
          </div>

          {/* Action Trigger Button with Framer Motion hover & tap */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 text-zinc-950 py-3 rounded-xl font-bold text-sm hover:opacity-95 transition-all duration-300 shadow-xl shadow-emerald-500/20 flex items-center justify-center disabled:opacity-60 cursor-none uppercase tracking-wider"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Register & Create Company"
            )}
          </motion.button>
        </form>

        <p className="text-center text-xs text-zinc-400 mt-6 font-medium">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-emerald-400 font-semibold hover:text-emerald-300 hover:underline transition-all cursor-none"
          >
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}