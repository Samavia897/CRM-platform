import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { motion, useSpring } from "framer-motion";
import {
  HiLightningBolt,
  HiMail,
  HiLockClosed,
  HiSparkles,
  HiShieldCheck,
  HiArrowRight
} from "react-icons/hi";

const BASE_URL = process.env.REACT_APP_API_URL || "https://crm-backend-live-4541.onrender.com";

export default function Login() {
  const [data, setData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  

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
    const isInteractive = target.closest("button, a, input, select, .cursor-pointer, [role='button']");
    setIsHovered(!!isInteractive);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const customSwal = Swal.mixin({
    customClass: {
      popup: "rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl p-6 font-sans backdrop-blur-lg",
      title: "text-lg font-bold text-zinc-100",
      htmlContainer: "text-xs text-zinc-400 mt-1",
      confirmButton: "px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:opacity-90 transition-all duration-200"
    },
    buttonsStyling: false
  });

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!data.email || !data.password) {
      customSwal.fire({
        title: "Missing Fields",
        text: "Please fill in all authenticated inputs.",
        icon: "warning",
        background: "#09090b",
        color: "#f43f5e"
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, data, {
        withCredentials: true
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("username", res.data.username);

      customSwal.fire({
        title: "Authenticated",
        text: `Welcome back, ${res.data.username}`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
        background: "#09090b",
        color: "#10b981"
      }).then(() => {
        window.location.href = "/dashboard";
      });
    } catch (err) {
      customSwal.fire({
        title: "Error",
        text: err.response?.data?.error || "Invalid CRM credentials.",
        icon: "error",
        background: "#09090b",
        color: "#f43f5e"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { type: "spring", stiffness: 260, damping: 20 } 
    }
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="relative flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100 overflow-hidden font-sans cursor-none select-none selection:bg-emerald-500/30 selection:text-emerald-200"
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
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.08), transparent 80%)`
        }}
      />

      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/20 blur-[130px] pointer-events-none rounded-full" 
      />
      <motion.div 
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 right-1/4 w-96 h-96 bg-teal-500/20 blur-[130px] pointer-events-none rounded-full" 
      />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-40 w-full max-w-md p-8 mx-4 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl shadow-emerald-950/30 transition-all duration-300 hover:border-zinc-700/80"
      >
        

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-pulse" />

        <div className="flex flex-col items-center mb-8">
          <motion.div 
            whileHover={{ rotate: 180, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 p-3.5 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-500/10 mb-3 cursor-pointer"
          >
            <HiLightningBolt className="text-3xl text-emerald-400" />
          </motion.div>

          <h2 className="text-2xl font-black tracking-wider text-zinc-100 uppercase bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent flex items-center gap-2">
            NEXUS <span className="text-emerald-400 font-light text-base">// CRM</span>
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <HiSparkles className="text-emerald-400 text-lg" />
            </motion.span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-medium">Enter workspace environment credentials</p>
        </div>


        <form onSubmit={handleLogin} className="space-y-5">

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <HiMail className="text-emerald-400 text-sm" /> Email Address
            </label>
            <input 
              type="email" 
              required
              placeholder="operator@nexus.com" 
              className="w-full px-4 py-3 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-zinc-100 placeholder-zinc-600 text-sm outline-none transition-all duration-300 cursor-none"
              onChange={(e) => setData({ ...data, email: e.target.value })} 
            />
          </div>


          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <HiLockClosed className="text-emerald-400 text-sm" /> Password
            </label>
            <input 
              type="password" 
              required
              placeholder="••••••••" 
              className="w-full px-4 py-3 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-zinc-100 placeholder-zinc-600 text-sm outline-none transition-all duration-300 cursor-none"
              onChange={(e) => setData({ ...data, password: e.target.value })} 
            />
          </div>


          <motion.button 
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 text-zinc-950 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 uppercase tracking-wider cursor-none disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Pipeline</span>
                <HiArrowRight className="text-lg" />
              </>
            )}
          </motion.button>
        </form>


        <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
            <HiShieldCheck className="text-emerald-400 text-base" />
            <span>Encrypted Corporate Access</span>
          </div>

          <p className="text-xs text-zinc-400 font-medium">
            Not part of a corporate hub?{" "}
            <Link 
              to="/signup" 
              className="text-emerald-400 font-semibold hover:text-emerald-300 hover:underline transition-all cursor-none"
            >
              Register Company
            </Link>
          </p>
        </div>

      </motion.div>
    </div>
  );
}