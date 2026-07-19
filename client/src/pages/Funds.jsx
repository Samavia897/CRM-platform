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

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");

  const [fundData, setFundData] = useState({
    name: "", type: "Venture", location: "", website: "", industry: "",
  });
  
  const BASE_URL = "https://crm-backend-live-4541.onrender.com";

  const fetchFunds = async () => {
    try {
      setLoading(true);
      const currentToken = localStorage.getItem("token");
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
        const currentToken = localStorage.getItem("token");
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

      const currentToken = localStorage.getItem("token");
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
      const currentToken = localStorage.getItem("token");
      
      await axios.post(`${BASE_URL}/api/funds/import`, fileFormData, {
        headers: {
          "Authorization": `Bearer ${currentToken}`,
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
    <div className="p-8 bg-slate-50/50 min-h-screen">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">Funds Matrix</h1>
            <p className="text-slate-500 text-xs mt-0.5">Manage fund classifications and data imports.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <HiSearch className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search funds..."
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 w-64 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none hover:bg-slate-50 cursor-pointer focus:ring-4 focus:ring-blue-50 transition-all"
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
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all focus:ring-4 focus:ring-slate-100"
            >
              <HiDownload className="text-slate-400" size={14} /> Import Funds
            </button>

            <button 
              onClick={() => setShowModal(true)} 
              className="bg-[#0047FF] text-white px-5 py-2 rounded-xl flex items-center gap-1.5 hover:bg-blue-700 transition-all font-bold text-xs shadow-sm"
            >
              <HiPlus size={16} /> Add Fund
            </button>
          </div>
        </div>

        <div className="flex gap-6 border-b border-slate-200/60 pl-1">
          {["All", "AI based funds", "GeoPref"].map(tab => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3.5 text-xs font-bold cursor-pointer transition-all border-b-2 -mb-[2px] ${activeTab === tab ? "border-blue-600 text-slate-950" : "border-transparent text-slate-400 hover:text-slate-600"}`}
            >
              {tab} 
              {tab === "All" && (
                <span className="bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded-md text-[10px] font-black ml-1.5">
                  {funds.length}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="overflow-hidden border border-slate-200/60 rounded-2xl shadow-sm bg-white">
          {loading ? (
            <div className="p-24 text-center text-slate-400 text-xs font-bold tracking-wide uppercase">Loading operational index...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/70 border-b border-slate-100">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider pl-6">Fund Name</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Location</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Website</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Industry</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFunds.length > 0 ? (
                    filteredFunds.map(fund => (
                      <tr key={fund.id} className="hover:bg-slate-50/40 transition-all group">
                        <td className="p-4 font-bold text-slate-950 text-xs pl-6">{fund.name}</td>
                        <td className="p-4 text-slate-600 text-xs font-medium">{fund.type}</td>
                        <td className="p-4 text-slate-500 text-xs font-medium">
                          <div className="flex items-center gap-1">
                            <HiLocationMarker size={13} className="text-slate-400" /> 
                            <span>{fund.location || "---"}</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-semibold">
                          {fund.website ? (
                            <a 
                              href={fund.website.startsWith('http') ? fund.website : `https://${fund.website}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              {fund.website}
                            </a>
                          ) : (
                            <span className="text-slate-300 font-normal">---</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {fund.industry && (
                              Array.isArray(fund.industry) 
                                ? fund.industry.map((tag, i) => (
                                    <span key={i} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase">{tag}</span>
                                  ))
                                : String(fund.industry).split(',').map((tag, i) => (
                                    <span key={i} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase">{tag.trim()}</span>
                                  ))
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right pr-6">
                          <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(fund)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><HiPencilAlt size={16} /></button>
                            <button onClick={() => handleDelete(fund.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><HiTrash size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-20 text-center text-slate-400 text-xs font-bold tracking-wide uppercase italic">
                        No funds registered matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-[24px] w-full max-w-md shadow-xl border border-slate-100 transform transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-950 tracking-tight">{isEditing ? "Edit Particulars" : "Register Fund"}</h2>
                <p className="text-slate-400 text-[11px] mt-0.5">Fill out database records parameters.</p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition-all"><HiX size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 pl-0.5">Fund Name</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200/70 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none text-xs font-bold text-slate-800 transition-all" 
                  value={fundData.name} 
                  onChange={(e) => setFundData({ ...fundData, name: e.target.value })} 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 pl-0.5">Type</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all cursor-pointer" 
                    value={fundData.type} 
                    onChange={(e) => setFundData({ ...fundData, type: e.target.value })}
                  >
                    <option value="Venture">Venture</option>
                    <option value="Private Equity">Private Equity</option>
                    <option value="Hedge Fund">Hedge Fund</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 pl-0.5">Location</label>
                  <input 
                    className="w-full p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all" 
                    value={fundData.location} 
                    onChange={(e) => setFundData({ ...fundData, location: e.target.value })} 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 pl-0.5">Website</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all" 
                  value={fundData.website} 
                  onChange={(e) => setFundData({ ...fundData, website: e.target.value })} 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 pl-0.5">Industry Matrix (comma separated)</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all" 
                  value={fundData.industry} 
                  onChange={(e) => setFundData({ ...fundData, industry: e.target.value })} 
                  placeholder="AI, SaaS, Fintech" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full mt-2 py-3 bg-[#0047FF] text-white font-black rounded-xl hover:bg-blue-700 transition-all text-xs uppercase tracking-widest shadow-sm"
              >
                {isEditing ? "Update Instance" : "Execute Entry"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}