import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

const BASE_URL = process.env.REACT_APP_API_URL || "https://crm-backend-live-4541.onrender.com";

export default function Login() {
  const [data, setData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom Cursor Mouse Tracker State
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const customSwal = Swal.mixin({
    customClass: {
      popup: "rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl p-6 font-sans text-zinc-100",
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

  return (
    // 'cursor-none' class hides the default mouse pointer across the screen
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 overflow-hidden font-sans text-zinc-100 cursor-none select-none">
      
      {/* 🟢 CUSTOM ANIMATED CURSOR (Dashboard Style) */}
      <div 
        className="fixed pointer-events-none z-50 transition-transform duration-75 ease-out -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      >
        {/* Inner Glowing Cursor Dot */}
        <div className={`w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_15px_#10b981] transition-all duration-200 ${isHovered ? 'scale-150 bg-teal-300' : 'scale-100'}`} />
        {/* Outer Ring Animation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-emerald-400/40 animate-ping pointer-events-none" />
      </div>

      {/* 🌟 SPOTLIGHT MOUSE FOLLOW GLOW */}
      <div 
        className="fixed pointer-events-none z-0 transition-opacity duration-300 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/15 blur-[120px]"
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      />

      {/* 🚀 ANIMATED BACKGROUND ELEMENTS */}
      
      {/* 1. Ambient Rotating Orbs */}
      <div className="absolute w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-emerald-500/10 via-teal-500/10 to-violet-500/10 blur-[140px] pointer-events-none animate-[spin_25s_linear_infinite]" />
      
      {/* 2. Floating Animated Particles */}
      <div className="absolute top-1/4 left-10 w-2 h-2 rounded-full bg-emerald-400/60 blur-[1px] animate-bounce duration-[3000ms]" />
      <div className="absolute bottom-1/3 right-12 w-3 h-3 rounded-full bg-teal-400/50 blur-[1px] animate-bounce duration-[4500ms]" />
      <div className="absolute top-2/3 left-1/3 w-2 h-2 rounded-full bg-violet-400/50 blur-[1px] animate-pulse duration-[2000ms]" />

      {/* 3. Tech Mesh Grid with Masking */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

      {/* 4. Animated Vector Waves */}
      <div className="absolute inset-0 opacity-20 pointer-events-none hidden md:block">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M 0 300 Q 300 150 600 350 T 1200 200 T 1920 400" 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="2" 
            className="animate-[pulse_3s_ease-in-out_infinite]" 
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

      {/* 💳 MAIN GLASSMORPHIC CARD */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all duration-300 hover:border-zinc-700/80">
        
        {/* Animated Top Glow Border Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-pulse" />

        {/* Logo Badge & Headings */}
        <div className="flex flex-col items-center mb-8">
          <div 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-3 group hover:scale-110 hover:rotate-6 transition-all duration-300 cursor-none"
          >
            <svg className="w-7 h-7 text-emerald-400 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">CRM Analytics Portal</h2>
          <p className="text-xs text-zinc-400 mt-1 font-medium">Enter workspace environment credentials</p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="operator@crm.com" 
              onFocus={() => setIsHovered(true)}
              onBlur={() => setIsHovered(false)}
              className="w-full px-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 outline-none transition-all duration-200 cursor-none"
              onChange={(e) => setData({ ...data, email: e.target.value })} 
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              required
              placeholder="••••••••" 
              onFocus={() => setIsHovered(true)}
              onBlur={() => setIsHovered(false)}
              className="w-full px-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 outline-none transition-all duration-200 cursor-none"
              onChange={(e) => setData({ ...data, password: e.target.value })} 
            />
          </div>

          {/* Action Trigger Button */}
          <button 
            type="submit"
            disabled={isLoading}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="w-full mt-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 text-zinc-950 py-3 rounded-xl font-bold text-sm hover:opacity-90 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center justify-center disabled:opacity-60 uppercase tracking-wider cursor-none"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              "Sign In to Pipeline"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-400 mt-6 font-medium">
          Not part of a corporate hub?{" "}
          <Link 
            to="/signup" 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="text-emerald-400 font-semibold hover:text-emerald-300 hover:underline transition-all cursor-none"
          >
            Register Company
          </Link>
        </p>

      </div>
    </div>
  );
}