import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom"; 
import Swal from "sweetalert2"; 

const BASE_URL = process.env.REACT_APP_API_URL || "https://crm-backend-live-4541.onrender.com";

export default function Login() {
  const [data, setData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const customSwal = Swal.mixin({
    customClass: {
      popup: "rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl p-6 font-sans text-zinc-100",
      title: "text-lg font-bold text-zinc-100",
      htmlContainer: "text-xs text-zinc-400 mt-1",
      confirmButton: "px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:opacity-90 transition-all duration-200"
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
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 overflow-hidden font-sans text-zinc-100">
      
      {/* Animated Glowing Gradient Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45rem] h-[45rem] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none animate-pulse duration-[7000ms]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45rem] h-[45rem] rounded-full bg-teal-500/10 blur-[130px] pointer-events-none animate-pulse duration-[10000ms]"></div>

      {/* Grid Pattern with Radial Mask */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>

      {/* Animated Subtle Ambient Curved Lines */}
      <div className="absolute inset-0 opacity-20 pointer-events-none hidden md:block">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0 300 Q 300 150 600 350 T 1200 200 T 1920 400" fill="none" stroke="#10b981" strokeWidth="2" className="animate-pulse" />
          <path d="M 0 400 Q 400 250 800 450 T 1600 300 T 1920 500" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="6 4" />
        </svg>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl backdrop-blur-xl shadow-2xl shadow-emerald-950/20 transition-all duration-300 hover:border-zinc-800">
        
        {/* Header Icon & Titles */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-3 group transition-transform duration-300 hover:scale-105">
            <svg className="w-6 h-6 text-emerald-400 group-hover:rotate-6 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-100 tracking-tight">CRM Analytics Portal</h2>
          <p className="text-xs text-zinc-400 mt-1">Enter workspace environment credentials</p>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="operator@crm.com" 
              className="w-full px-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all duration-200"
              onChange={(e) => setData({ ...data, email: e.target.value })} 
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Password</label>
            </div>
            <input 
              type="password" 
              required
              placeholder="••••••••" 
              className="w-full px-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all duration-200"
              onChange={(e) => setData({ ...data, password: e.target.value })} 
            />
          </div>

          {/* Action Trigger Button */}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 text-zinc-950 py-3 rounded-xl font-semibold text-sm hover:opacity-90 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-emerald-500/10 flex items-center justify-center disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Sign In to Pipeline"
            )}
          </button>
        </form>

        {/* Link Footer */}
        <p className="text-center text-xs text-zinc-400 mt-6">
          Not part of a corporate hub?{" "}
          <Link to="/signup" className="text-emerald-400 font-semibold hover:underline transition-all">
            Register Company
          </Link>
        </p>

      </div>
    </div>
  );
}