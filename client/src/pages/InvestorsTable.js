import React, { useState, useEffect } from "react";
import axios from "axios";
import { HiPlus, HiSearch, HiFilter, HiX } from "react-icons/hi";

export default function InvestorsTable() {
  const [investors, setInvestors] = useState([]);
  const [funds, setFunds] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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

  const fetchPipelines = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/pipelines", { headers });
      setPipelines(response.data);
    } catch (err) {
      console.error("Error fetching pipelines:", err);
    }
  };

  const fetchInvestors = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/investors", { headers });
      setInvestors(res.data);
    } catch (err) {
      console.error("Fetch Error:", err.response?.data || err.message);
    }
  };

  const fetchFunds = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/funds", { headers });
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
  fundId: Number(formData.fundId),      
  pipelineId: Number(formData.pipelineId), 
  status: formData.status.trim()
};

    try {
      const response = await axios.post("http://localhost:5000/api/investors", backendPayload, { headers });

      if (response.status === 201) {
        alert("Investor added successfully!");
        setShowModal(false);
        setFormData({ firstName: "", lastName: "", email: "", officePhone: "", mobilePhone: "", jobTitle: "", pipelineId: "", fundId: "", status: "" });
        fetchInvestors();
      }
    } catch (err) {
      console.error("Backend Error:", err.response?.data);
      alert("Failed to add: " + (err.response?.data?.message || err.message));
    }
  };

  const toggleStatus = async (investor) => {
    const newStatus = investor.status === "New" ? "Follow-Up" : "New";
    try {
      await axios.patch(`http://localhost:5000/api/investors/status/${investor.id}`, { status: newStatus }, { headers });
      await fetchInvestors();
    } catch (err) {
      console.error("Status Update Error:", err);
    }
  };

  const filteredInvestors = investors.filter((inv) => {
    const fullName = `${inv.firstName || ''} ${inv.lastName || ''}`.toLowerCase();
    const email = (inv.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch = fullName.includes(search) || email.includes(search);
    const matchesStatus = statusFilter === "All" || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Investors Directory</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#00388D] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-md transition-all active:scale-95"
        >
          <HiPlus className="text-lg" /> Add Investor
        </button>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <HiSearch className="absolute left-3 top-3 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-72"
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <HiFilter className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="outline-none bg-transparent font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-Up">Follow-Up</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase">
                <th className="p-4">Name</th>
                <th className="p-4">Job Title</th>
                <th className="p-4">Email</th>
                <th className="p-4">Office Phone</th>
                <th className="p-4">Mobile Phone</th>
                <th className="p-4">Fund</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvestors.map((inv) => (
                <tr key={inv.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-4 text-sm font-bold text-gray-900">{inv.firstName} {inv.lastName}</td>
                  <td className="p-4 text-sm text-gray-600">{inv.jobTitle || inv.job_title || "N/A"}</td>
                  <td className="p-4 text-sm text-blue-600">{inv.email}</td>
                  <td className="p-4 text-sm text-gray-600">{inv.officePhone || inv.office_phone || "N/A"}</td>
                  <td className="p-4 text-sm text-gray-600">{inv.mobilePhone || inv.mobile_phone || "N/A"}</td>
                  <td className="p-4 text-sm font-semibold text-gray-800">{inv.Fund?.name || "N/A"}</td>
                  <td className="p-4 text-center">
                    <span
                      onClick={() => toggleStatus(inv)}
                      className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight cursor-pointer select-none bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">New Investor</h2>
              <button onClick={() => setShowModal(false)}><HiX className="text-gray-400 text-xl" /></button>
            </div>

            <form onSubmit={handleAddInvestor} className="space-y-3">

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Select Fund *
                </label>
                <select
                  className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={formData.fundId}
                  onChange={(e) => setFormData({ ...formData, fundId: e.target.value })}
                >
                  <option value="">-- Choose a Fund --</option>
                  {funds && funds.length > 0 ? (
                    funds.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))
                  ) : (
                    <option disabled value="">No funds available</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Assign to Pipeline Board *
                </label>
                <select
                  className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={formData.pipelineId}
                  onChange={(e) => setFormData({ ...formData, pipelineId: e.target.value, status: "" })}
                >
                  <option value="">-- Choose a Pipeline Board --</option>
                  {pipelines && pipelines.length > 0 ? (
                    pipelines.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))
                  ) : (
                    <option disabled value="">No pipeline boards found</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Stage / Status *
                </label>
                <select
                  required
                  disabled={!formData.pipelineId}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm font-semibold disabled:opacity-60 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose a Stage --</option>
                  {formData.pipelineId && (() => {
                    const activeBoard = pipelines.find(p => String(p.id) === String(formData.pipelineId));
                    if (activeBoard && activeBoard.stages) {
                      return activeBoard.stages.split(",").map((stage, idx) => (
                        <option key={idx} value={stage.trim()}>{stage.trim()}</option>
                      ));
                    }
                    return null;
                  })()}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">First Name</label>
                  <input required placeholder="John" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Last Name</label>
                  <input required placeholder="Doe" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Job Title</label>
                <input placeholder="Manager / Director" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email Address</label>
                <input required type="email" placeholder="example@mail.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Office Phone</label>
                  <input placeholder="Office No" value={formData.officePhone} onChange={(e) => setFormData({ ...formData, officePhone: e.target.value })} className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Mobile Phone</label>
                  <input placeholder="Mobile No" value={formData.mobilePhone} onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })} className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm" />
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-[#00388D] text-white font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all text-xs tracking-wider mt-2 uppercase">
                Save & Update List
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}