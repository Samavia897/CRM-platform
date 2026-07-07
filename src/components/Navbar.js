import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();


  const username = localStorage.getItem("username");

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex justify-between items-center p-4 bg-black text-white">
      <h1 className="text-xl font-bold">My App</h1>

      <div className="flex items-center gap-4">
        {username && <span className="font-semibold text-blue-400 capitalize">{username}</span>}

        <button
          onClick={logout}
          className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}