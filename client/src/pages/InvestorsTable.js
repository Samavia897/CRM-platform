import React, { useState, useEffect } from "react";
import axios from "axios";
import { HiPlus, HiSearch, HiX, HiOfficeBuilding } from "react-icons/hi";

export default function InvestorsTable() {
  const [investors, setInvestors] = useState([]);
  const [funds, setFunds] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [fundSearchTerm, setFundSearchTerm] = useState(""); // Fund search ke liye new state

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    officePhone: "",
    mobilePhone: "",
    jobTitle: "",
    pipelineId: "",
    fundId: "",
    status: ""
  });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const BASE_URL = "https://crm-backend-live-4541.onrender.com";

  const fetchPipelines = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/pipelines`, { headers });
      setPipelines(response.data);
    } catch (err) {
      console.error("Error fetching pipelines:", err);
    }
  };

  const fetchInvestors = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/investors`, { headers });
      setInvestors(res.data);
    } catch (err) {
      console.error("Fetch Error:", err.response?.data || err.message);
    }
  };

  const fetchFunds = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/funds`, { headers });
      setFunds(res.data);
    } catch (err) {
      console.error("Fetch funds error:", err);
    }
  };

  useEffect(() => {
    fetchInvestors();
    fetchFunds();
    fetchPipelines();
  }, []);

  const handleAddInvestor = async (e) => {
    e.preventDefault();

    if (!formData.fundId || formData.fundId === "") {
      alert("Error: Please select a Fund.");
      return;
    }
    if (!formData.pipelineId || formData.pipelineId === "") {
      alert("Error: Please select a Pipeline Board.");
      return;
    }
    if (!formData.status || formData.status === "") {
      alert("Error: Please select a Stage.");
      return;
    }

    const backendPayload = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      fundId: String(formData.fundId),      
      pipelineId: String(formData.pipelineId),
      status: formData.status.trim()
    };

    try {
      const response = await axios.post(`${BASE_URL}/api/investors`, backendPayload, { headers });

      if (response.status === 201 || response.status === 200) {
        alert("Investor added successfully!");
        setShowModal(false);
        setFormData({ firstName: "", lastName: "", email: "", officePhone: "", mobilePhone: "", jobTitle: "", pipelineId: "", fundId: "", status: "" });
        fetchInvestors();
      }
    } catch (err) {
      console.error("Backend Error:", err.response?.data);
      alert("Failed to add: " + (err.response?.data?.error || err.response?.data?.message || err.message));
    }
  };

  const toggleStatus = async (investor) => {
    const newStatus = investor.status === "New" ? "Follow-Up" : "New";
    try {
      await axios.patch(`${BASE_URL}/api/investors/status/${investor.id}`, { status: newStatus }, { headers });
      await fetchInvestors();
    } catch (err) {
      console.error("Status Update Error:", err);
      alert("Failed to update status. Please check backend route setup.");
    }
  };

  const filteredInvestors = investors.filter((inv) => {
    const fullName = `${inv.firstName || ''} ${inv.lastName || ''}`.toLowerCase();
    const email = (inv.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    // Fund Name match logic (supports nested models or standard key casing)
    const fundName = (inv.Fund?.name || inv.fund?.name || "").toLowerCase();
    const fundSearch = fundSearchTerm.toLowerCase();

    const matchesSearch = fullName.includes(search) || email.includes(search);
    const matchesFund = fundName.includes(fundSearch);

    return matchesSearch && matchesFund;
  });

  return (
    <div className="p-2 relative z-10 font-sans">
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Investors Directory</h1>
          <p className="text-xs text-slate-400 mt-1">Manage global pipeline assets and corporate backers</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-blue-500 flex items-center gap-2 shadow-lg shadow-blue-600/10 transition-all duration-200 active:scale-95"
        >
          <HiPlus className="text-sm" /> Add Investor
        </button>
      </div>

      <div className="bg-[#131c35]/80 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl">
        
        <div className="flex flex-wrap justify-between items-center p-4 gap-4 border-b border-slate-800/80 bg-[#11192e]/40">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Standard Name/Email Search */}
            <div className="relative">
              <HiSearch className="absolute left-3 top-3 text-slate-500 text-sm" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-xs focus:border-blue-500 outline-none transition-all w-60"
              />
            </div>
            
            {/* New Fund Search Input */}
            <div className="relative">
              <HiOfficeBuilding className="absolute left-3 top-3 text-slate-500 text-sm" />
              <input
                type="text"
                placeholder="Search by Fund..."
                value={fundSearchTerm}
                onChange={(e) => setFundSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-xs focus:border-blue-500 outline-none transition-all w-60"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-[#11192e]/60">
                <th className="p-4">Name</th>
                <th className="p-4">Job Title</th>
                <th className="p-4">Email</th>
                <th className="p-4">Office Phone</th>
                <th className="p-4">Mobile Phone</th>
                <th className="p-4">Fund</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInvestors.length > 0 ? (
                filteredInvestors.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors duration-150">
                    <td className="p-4 text-sm font-bold text-white">{inv.firstName} {inv.lastName}</td>
                    <td className="p-4 text-xs text-slate-400">{inv.jobTitle || inv.job_title || "N/A"}</td>
                    <td className="p-4 text-xs text-blue-400 font-medium">{inv.email}</td>
                    <td className="p-4 text-xs text-slate-400">{inv.officePhone || inv.office_phone || "N/A"}</td>
                    <td className="p-4 text-xs text-slate-400">{inv.mobilePhone || inv.mobile_phone || "N/A"}</td>
                    <td className="p-4 text-xs font-semibold text-slate-200">{inv.Fund?.name || inv.fund?.name || "N/A"}</td>
                    <td className="p-4 text-center">
                      <span
                        onClick={() => toggleStatus(inv)}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer select-none border transition-all duration-200 ${
                          inv.status === "New"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
                            : inv.status === "Follow-Up"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-xs text-slate-500">No records found matching criterion parameters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#060b19]/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#131c35] border border-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center mb-5 border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">New Investor Profile</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <HiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleAddInvestor} className="space-y-4">
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Select Fund *
                </label>
                <select
                  className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-blue-500 transition-all"
                  required
                  value={formData.fundId}
                  onChange={(e) => setFormData({ ...formData, fundId: e.target.value })}
                >
                  <option value="" className="bg-[#0f172a]">-- Choose a Fund --</option>
                  {funds && funds.length > 0 && funds.map((f) => (
                    <option key={f.id} value={f.id} className="bg-[#0f172a]">{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Assign to Pipeline Board *
                </label>
                <select
                  className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-blue-500 transition-all"
                  required
                  value={formData.pipelineId}
                  onChange={(e) => setFormData({ ...formData, pipelineId: e.target.value, status: "" })}
                >
                  <option value="" className="bg-[#0f172a]">-- Choose a Pipeline Board --</option>
                  {pipelines && pipelines.length > 0 && pipelines.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#0f172a]">{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Stage / Status *
                </label>
                <select
                  required
                  disabled={!formData.pipelineId}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 disabled:opacity-50 outline-none focus:border-blue-500 transition-all"
                >
                  <option value="" className="bg-[#0f172a]">-- Choose a Stage --</option>
                  {formData.pipelineId && (() => {
                    const activeBoard = pipelines.find(p => String(p.id) === String(formData.pipelineId));
                    if (activeBoard && activeBoard.stages) {
                      return activeBoard.stages.split(",").map((stage, idx) => (
                        <option key={idx} value={stage.trim()} className="bg-[#0f172a]">{stage.trim()}</option>
                      ));
                    }
                    return null;
                  })()}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">First Name</label>
                  <input required placeholder="John" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-3 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-xs focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Last Name</label>
                  <input required placeholder="Doe" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-3 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-xs focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Job Title</label>
                <input placeholder="Manager / Director" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full px-3 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-xs focus:border-blue-500 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address</label>
                <input required type="email" placeholder="example@mail.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-xs focus:border-blue-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Office Phone</label>
                  <input placeholder="Office No" value={formData.officePhone} onChange={(e) => setFormData({ ...formData, officePhone: e.target.value })} className="w-full px-3 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-xs focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mobile Phone</label>
                  <input placeholder="Mobile No" value={formData.mobilePhone} onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })} className="w-full px-3 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-xs focus:border-blue-500 outline-none" />
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/10 hover:bg-blue-500 transition-all text-xs tracking-wider mt-2 uppercase">
                Save & Update List
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}