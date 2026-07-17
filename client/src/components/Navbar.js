import { useNavigate } from "react-router-dom";
import { HiLogout, HiUserCircle } from "react-icons/hi";

export default function Navbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="w-full border-b border-gray-800 bg-neutral-950 px-6 py-4 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
          <h1 className="text-xl font-bold tracking-wider uppercase text-neutral-100">
            CRM <span className="text-blue-500">Platform</span>
          </h1>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          {username && (
            <div className="flex items-center gap-2 rounded-full border border-gray-800 bg-neutral-900 px-3 py-1.5 shadow-inner">
              <HiUserCircle className="h-5 w-5 text-blue-400" />
              <span className="text-sm font-medium tracking-wide text-neutral-300 capitalize">
                {username}
              </span>
            </div>
          )}

          <button
            onClick={logout}
            className="group flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-2 text-sm font-semibold text-red-400 transition-all duration-200 hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            <span>Logout</span>
            <HiLogout className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
        
      </div>
    </nav>
  );
}