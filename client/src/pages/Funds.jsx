import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import { HiPlus, HiX, HiLocationMarker, HiDownload, HiPencilAlt, HiTrash, HiSearch } from "react-icons/hi";

export default function Funds() {
  const [funds, setFunds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  const [isEditing, setIsEditing] = useState(false);
  const [currentFundId, setCurrentFundId] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");

  const [fundData, setFundData] = useState({
    name: "", type: "Venture", location: "", website: "", industry: "",
  });
  
  // 🌟 Live deployed backend API Base URL
  const BASE_URL = "https://crm-backend-live-4541.onrender.com";

  // 1. Fetch Funds Request
  const fetchFunds = async () => {
    try {
      setLoading(true);
      const currentToken = localStorage.getItem("token"); // 🌟 Fresh token read inside function
      const res = await axios.get(`${BASE_URL}/api/funds`, { 
        headers: { "Authorization": `Bearer ${currentToken}` } 
      });
      setFunds(res.data);
    } catch (err) {
      console.error("Error fetching funds", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFunds(); }, []);

  const filteredFunds = funds.filter(fund => {
    const nameMatch = fund.name ? fund.name.toLowerCase() : "";
    const locMatch = fund.location ? fund.location.toLowerCase() : "";
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = nameMatch.includes(searchLower) || locMatch.includes(searchLower);
    const matchesType = filterType === "All" || fund.type === filterType;

    if (activeTab === "AI based funds") {
      return matchesSearch && matchesType && fund.industry && (
        Array.isArray(fund.industry) 
          ? fund.industry.some(i => i.toLowerCase().includes('ai'))
          : String(fund.industry).toLowerCase().includes('ai')
      );
    }
    if (activeTab === "GeoPref") {
      return matchesSearch && matchesType && (fund.location && fund.location !== "---");
    }

    return matchesSearch && matchesType;
  });

  const handleEdit = (fund) => {
    setIsEditing(true);
    setCurrentFundId(fund.id);
    
    let industryString = "";
    if (fund.industry) {
      industryString = Array.isArray(fund.industry) ? fund.industry.join(', ') : fund.industry;
    }

    setFundData({
      name: fund.name || "",
      type: fund.type || "Venture",
      location: fund.location || "",
      website: fund.website || "",
      industry: industryString,
    });
    setShowModal(true);
  };

  // 2. Delete Request
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0047FF',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const currentToken = localStorage.getItem("token"); // 🌟 Fresh token read inside function
        await axios.delete(`${BASE_URL}/api/funds/${id}`, { 
          headers: { "Authorization": `Bearer ${currentToken}` } 
        });
        Swal.fire('Deleted!', 'Fund has been removed.', 'success');
        fetchFunds();
      } catch (err) {
        Swal.fire('Error!', 'Failed to delete fund.', 'error');
      }
    }
  };

  // 3. Submit Form Request (Add/Edit Fund)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let industryArray = [];
      if (typeof fundData.industry === 'string') {
        industryArray = fundData.industry ? fundData.industry.split(',').map(i => i.trim()).filter(Boolean) : [];
      } else if (Array.isArray(fundData.industry)) {
        industryArray = fundData.industry;
      }

      const payload = {
        name: fundData.name.trim(),
        type: fundData.type,
        location: fundData.location ? fundData.location.trim() : "",
        website: fundData.website ? fundData.website.trim() : "",
        industry: industryArray
      };

      const currentToken = localStorage.getItem("token"); // 🌟 Fresh token read inside function
      const requestConfig = { headers: { "Authorization": `Bearer ${currentToken}` } };

      if (isEditing) {
        await axios.put(`${BASE_URL}/api/funds/${currentFundId}`, payload, requestConfig);
        Swal.fire('Updated!', 'Fund details updated successfully.', 'success');
      } else {
        await axios.post(`${BASE_URL}/api/funds`, payload, requestConfig);
        Swal.fire('Success!', 'New fund created.', 'success');
      }

      closeModal();
      fetchFunds();
    } catch (err) {
      console.error(err);
      Swal.fire('Error!', err.response?.data?.error || 'Operation failed.', 'error');
    }
  };

  const handleImportClick = () => {
    document.getElementById('csvImportInput').click();
  };

  // 4. Import CSV File Request
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      return Swal.fire('Error', 'Please upload a valid CSV file', 'error');
    }

    const fileFormData = new FormData();
    fileFormData.append("file", file);

    Swal.fire({
      title: 'Importing...',
      text: 'Please wait while records are uploading',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const currentToken = localStorage.getItem("token"); // 🌟 Fresh token read inside function
      
      await axios.post(`${BASE_URL}/api/funds/import`, fileFormData, {
        headers: {
          "Authorization": `Bearer ${currentToken}`, // 🌟 Clean casing token validation
          "Content-Type": "multipart/form-data"
        }
      });
      
      Swal.fire('Success', 'Funds imported successfully!', 'success');
      
      e.target.value = "";
      fetchFunds();
    } catch (err) {
      console.error("Import Crash Error Trace:", err.response?.data);
      Swal.fire('Import Failed', err.response?.data?.error || 'Could not parse the CSV formatting structure', 'error');
      e.target.value = "";
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentFundId(null);
    setFundData({ name: "", type: "Venture", location: "", website: "", industry: "" });
  };

  return (
    <div className="p-10 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Funds</h1>
        <div className="flex items-center gap-3">

          <div className="relative group">
            <HiSearch className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search funds..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 outline-none hover:bg-slate-50 cursor-pointer transition-all"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Venture">Venture</option>
            <option value="Private Equity">Private Equity</option>
            <option value="Hedge Fund">Hedge Fund</option>
          </select>

          <input
            type="file"
            id="csvImportInput"
            className="hidden"
            accept=".csv"
            onChange={handleFileChange}
          />

          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <HiDownload className="text-slate-400" /> Import Funds
          </button>

          <button onClick={() => setShowModal(true)} className="bg-[#0047FF] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-all font-bold text-sm shadow-lg shadow-blue-100">
            <HiPlus size={20} /> Add Fund
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-slate-100 mb-8">
        {["All", "AI based funds", "GeoPref"].map(tab => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold cursor-pointer transition-all border-b-2 ${activeTab === tab ? "border-blue-600 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            {tab} {tab === "All" && <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[10px] ml-1">{funds.length}</span>}
          </div>
        ))}
      </div>

      <div className="overflow-visible border border-slate-100 rounded-2xl shadow-sm bg-white">
        {loading ? (
          <div className="p-20 text-center text-slate-400 text-sm font-semibold">Loading funds configuration...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Fund Name</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Location</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Website</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Industry</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredFunds.length > 0 ? (
                filteredFunds.map(fund => (
                  <tr key={fund.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="p-5 font-bold text-slate-900 text-[14px]">{fund.name}</td>
                    <td className="p-5 text-slate-600 text-sm">{fund.type}</td>
                    <td className="p-5 text-slate-500 text-sm flex items-center gap-1.5"><HiLocationMarker size={14} /> {fund.location || "---"}</td>
                    <td className="p-5 text-blue-600 text-sm font-medium hover:underline cursor-pointer">
                      {fund.website ? (
                        <a href={fund.website.startsWith('http') ? fund.website : `https://${fund.website}`} target="_blank" rel="noreferrer">
                          {fund.website}
                        </a>
                      ) : "---"}
                    </td>
                    <td className="p-5">
                      <div className="flex flex-wrap gap-1">
                        {fund.industry && (
                          Array.isArray(fund.industry) 
                            ? fund.industry.map((tag, i) => (
                                <span key={i} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{tag}</span>
                              ))
                            : String(fund.industry).split(',').map((tag, i) => (
                                <span key={i} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{tag.trim()}</span>
                              ))
                        )}
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(fund)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><HiPencilAlt size={18} /></button>
                        <button onClick={() => handleDelete(fund.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><HiTrash size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-20 text-center text-slate-400 font-medium italic">
                    No funds found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-10 rounded-[32px] w-full max-w-lg shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in duration-300">
            <button onClick={closeModal} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600"><HiX size={24} /></button>
            <h2 className="text-2xl font-black mb-1 text-slate-900">{isEditing ? "Edit Fund" : "New Fund"}</h2>
            <p className="text-slate-400 text-sm mb-6">Update all investment details below.</p>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fund Name</label>
                <input className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm font-semibold transition-all" value={fundData.name} onChange={(e) => setFundData({ ...fundData, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Type</label>
                <select className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold outline-none focus:bg-white transition-all" value={fundData.type} onChange={(e) => setFundData({ ...fundData, type: e.target.value })}>
                  <option value="Venture">Venture</option>
                  <option value="Private Equity">Private Equity</option>
                  <option value="Hedge Fund">Hedge Fund</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location</label>
                <input className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold outline-none focus:bg-white transition-all" value={fundData.location} onChange={(e) => setFundData({ ...fundData, location: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Website</label>
                <input className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold outline-none focus:bg-white transition-all" value={fundData.website} onChange={(e) => setFundData({ ...fundData, website: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Industry (comma separated)</label>
                <input className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold outline-none focus:bg-white transition-all" value={fundData.industry} onChange={(e) => setFundData({ ...fundData, industry: e.target.value })} placeholder="AI, SaaS, Tech" />
              </div>
              <button type="submit" className="col-span-2 mt-4 py-4 bg-[#0047FF] text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all text-sm uppercase tracking-widest">
                {isEditing ? "Save Changes" : "Create Fund"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}