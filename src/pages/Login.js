import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom"; 

export default function Login() {
  const [data, setData] = useState({ email: "", password: "" });

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", data);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role); 
      localStorage.setItem("username", res.data.username);
      
      alert("Login Successful!");
      window.location.href = "/dashboard";
    } catch (err) {
      alert(err.response?.data?.error || "Login Failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white shadow-lg rounded-xl w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        
        <input 
          type="email" 
          placeholder="Email Address" 
          className="w-full p-3 border rounded mb-4"
          onChange={(e) => setData({ ...data, email: e.target.value })} 
        />
        
        <input 
          type="password" 
          placeholder="Password" 
          className="w-full p-3 border rounded mb-6"
          onChange={(e) => setData({ ...data, password: e.target.value })} 
        />

        <button 
          onClick={handleLogin} 
          className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700"
        >
          Login
        </button>

        <p className="text-center mt-4">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-indigo-600 font-semibold">
            Signup
          </Link>
        </p>
      </div>
    </div>
  );
}