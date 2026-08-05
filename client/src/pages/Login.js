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
      popup: "rounded-2xl border border-slate-100 shadow-2xl p-6 font-sans",
      title: "text-lg font-bold text-slate-900",
      htmlContainer: "text-xs text-slate-500 mt-1",
      confirmButton: "px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200"
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
      }).then(() => {
        window.location.href = "/dashboard";
      });
    } catch (err) {
      customSwal.fire({
        title: "Error",
        text: err.response?.data?.error || "Invalid CRM credentials.",
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0b1329] overflow-hidden font-sans">
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d_1px,transparent_1px),linear-gradient(to_bottom,#1f293d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>
      
      <div className="absolute top-[-10%] left-[-10%] w-[50rem] h-[50rem] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45rem] h-[45rem] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none"></div>

      <div className="absolute inset-0 opacity-15 pointer-events-none hidden md:block">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0 300 Q 300 150 600 350 T 1200 200 T 1920 400" fill="none" stroke="#3b82f6" strokeWidth="3" />
          <path d="M 0 400 Q 400 250 800 450 T 1600 300 T 1920 500" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="8 4" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md p-8 mx-4 bg-[#131c35]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        <div className="flex flex-col items-center mb-8">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">CRM Analytics Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Enter workspace environment credentials</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="operator@crm.com" 
              className="w-full px-4 py-3 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
              onChange={(e) => setData({ ...data, email: e.target.value })} 
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
            </div>
            <input 
              type="password" 
              required
              placeholder="••••••••" 
              className="w-full px-4 py-3 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
              onChange={(e) => setData({ ...data, password: e.target.value })} 
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 focus:ring-offset-[#131c35] transition-all duration-200 shadow-lg shadow-blue-600/20 flex items-center justify-center disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Sign In to Pipeline"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Not part of a corporate hub?{" "}
          <Link to="/signup" className="text-blue-400 font-semibold hover:underline">
            Register Company
          </Link>
        </p>

      </div>
    </div>
  );
}