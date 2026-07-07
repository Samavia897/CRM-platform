import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Signup() {
  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
    companyName: "",
    companyAddress: "",
    companyContact: "",
  });

  const signup = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/signup", data);
      alert("Account & Company Created Successfully! You are now the Admin.");
      window.location.href = "/login";
    } catch (err) {
      alert(err.response?.data?.error || "Signup Failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">Signup</h2>

        <input className="w-full p-3 border rounded mb-3" placeholder="Full Name"
          onChange={(e) => setData({ ...data, username: e.target.value })} />

        <input className="w-full p-3 border rounded mb-3" placeholder="Email (Work Email)"
          onChange={(e) => setData({ ...data, email: e.target.value })} />

        <input type="password" className="w-full p-3 border rounded mb-3" placeholder="Password"
          onChange={(e) => setData({ ...data, password: e.target.value })} />

        <hr className="my-4" />
        <p className="text-sm text-gray-500 mb-2">Company Details:</p>

        <input className="w-full p-3 border rounded mb-3" placeholder="Company Name"
          onChange={(e) => setData({ ...data, companyName: e.target.value })} />

        <input className="w-full p-3 border rounded mb-3" placeholder="Company Address"
          onChange={(e) => setData({ ...data, companyAddress: e.target.value })} />

        <input className="w-full p-3 border rounded mb-4" placeholder="Company Contact Number"
          onChange={(e) => setData({ ...data, companyContact: e.target.value })} />

        <button onClick={signup} className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700 font-bold">
          Register & Create Company
        </button>

        <p className="text-center mt-4">
          Already have an account? <Link to="/login" className="text-green-600 font-semibold">Login</Link>
        </p>
      </div>
    </div>
  );
}