import { useNavigate } from "react-router-dom";
import { HiLogout, HiUserCircle, HiLightningBolt } from "react-icons/hi";
import { motion } from "framer-motion";

export default function Navbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-8 py-4 text-zinc-100 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Brand Identity matched with Dashboard */}
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <h1 className="text-lg font-black tracking-wider uppercase bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            NEXUS <span className="text-emerald-400 font-light text-sm">// CONTROL</span>
          </h1>
        </div>

        {/* User Badge & Logout Button */}
        <div className="flex items-center gap-5">
          {username && (
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 shadow-md backdrop-blur-md"
            >
              <HiUserCircle className="h-5 w-5 text-emerald-400" />
              <span className="text-xs font-semibold tracking-wide text-zinc-200 capitalize">
                {username}
              </span>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={logout}
            className="group flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 transition-all duration-300 hover:bg-rose-500 hover:text-zinc-950 hover:shadow-lg hover:shadow-rose-500/20"
          >
            <span>Logout</span>
            <HiLogout className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </motion.button>
        </div>
        
      </div>
    </nav>
  );
}