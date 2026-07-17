import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

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

  const customSwal = Swal.mixin({
    customClass: {
      popup: "rounded-2xl border border-slate-100 shadow-2xl p-6 font-sans",
      title: "text-lg font-bold text-slate-900",
      htmlContainer: "text-xs text-slate-500 mt-1",
      confirmButton: "px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200"
    },
    buttonsStyling: false
  });

  const handleSignup = async (e) => {
    if (e) e.preventDefault();

    if (!data.username || !data.email || !data.password || !data.companyName || !data.companyAddress || !data.companyContact) {
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
        text: err.response?.data?.error || "Could not complete account creation setup.",
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0b1329] overflow-hidden font-sans p-4">
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d_1px,transparent_1px),linear-gradient(to_bottom,#1f293d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>
      
      <div className="absolute top-[-10%] left-[-10%] w-[50rem] h-[50rem] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45rem] h-[45rem] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none"></div>

      <div className="absolute inset-0 opacity-15 pointer-events-none hidden md:block">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0 300 Q 300 150 600 350 T 1200 200 T 1920 400" fill="none" stroke="#3b82f6" strokeWidth="3" />
          <path d="M 0 400 Q 400 250 800 450 T 1600 300 T 1920 500" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="8 4" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-lg p-8 mx-4 bg-[#131c35]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] my-8">
        
        <div className="flex flex-col items-center mb-6">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Create CRM Workspace</h2>
          <p className="text-xs text-slate-400 mt-1">Register your organization setup hub</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              <input 
                type="text" 
                required
                placeholder="John Doe" 
                className="w-full px-4 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                onChange={(e) => setData({ ...data, username: e.target.value })} 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Work Email</label>
              <input 
                type="email" 
                required
                placeholder="admin@company.com" 
                className="w-full px-4 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                onChange={(e) => setData({ ...data, email: e.target.value })} 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              required
              placeholder="••••••••" 
              className="w-full px-4 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
              onChange={(e) => setData({ ...data, password: e.target.value })} 
            />
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Company Framework</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Company Name</label>
            <input 
              type="text" 
              required
              placeholder="Enterprise Solutions Inc." 
              className="w-full px-4 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
              onChange={(e) => setData({ ...data, companyName: e.target.value })} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Company Address</label>
            <input 
              type="text" 
              required
              placeholder="Headquarters Ave, Suite 500" 
              className="w-full px-4 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
              onChange={(e) => setData({ ...data, companyAddress: e.target.value })} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Company Contact Number</label>
            <input 
              type="text" 
              required
              placeholder="+1 (555) 019-2834" 
              className="w-full px-4 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
              onChange={(e) => setData({ ...data, companyContact: e.target.value })} 
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 focus:ring-offset-[#131c35] transition-all duration-200 shadow-lg shadow-blue-600/20 flex items-center justify-center disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Register & Create Company"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 font-semibold hover:underline">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}