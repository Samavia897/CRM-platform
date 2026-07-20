import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import { HiPlus, HiX, HiLocationMarker, HiDownload, HiPencilAlt, HiTrash, HiSearch, HiOfficeBuilding } from "react-icons/hi";

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
      confirmButtonColor: '#3b82f6',
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

// --- FRONTEND: src/pages/Funds.jsx ---

const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
    return Swal.fire('Error', 'Please upload a valid CSV file', 'error');
  }

  const fileFormData = new FormData();
  fileFormData.append("file", file);

  Swal.fire({
    title: 'Processing CSV...',
    text: 'Uploading file and validating records in background...',
    allowOutsideClick: false,
    didOpen: () => { Swal.showLoading(); }
  });

  try {
    const currentToken = localStorage.getItem("token");
    
    const res = await axios.post(`${BASE_URL}/api/funds/import`, fileFormData, {
      headers: {
        "Authorization": `Bearer ${currentToken}`,
        "Content-Type": "multipart/form-data"
      }
    });
    
    const jobId = res.data?.jobId;

    if (jobId) {
      // Background worker ki finish hone ka wait karein (Polling)
      pollImportStatus(jobId, e);
    } else {
      Swal.fire('Success', 'Import requested successfully!', 'success');
      e.target.value = "";
      fetchFunds();
    }

  } catch (err) {
    console.error("Import Crash Error Trace:", err.response?.data);
    e.target.value = "";
    Swal.fire('Import Failed', err.response?.data?.message || 'Internal Server Error', 'error');
    fetchFunds();
  }
};

// Polling Helper Function: Har 2 second baad check karega report bani ya nahi
const pollImportStatus = (jobId, e, attempts = 0) => {
  const currentToken = localStorage.getItem("token");
  
  // Max 15 attempts (30 seconds total) to give the worker time to finish processing
  if (attempts > 15) {
    Swal.fire({
      title: 'Import Status',
      text: 'CSV processing taking longer than expected. Please check your funds table or refresh the page in a few moments.',
      icon: 'info',
      confirmButtonColor: '#3b82f6'
    });
    e.target.value = "";
    fetchFunds();
    return;
  }

  setTimeout(async () => {
    try {
      // Hit the endpoint to see if a failed job log entry exists
      const checkRes = await axios.get(`${BASE_URL}/api/funds/failed-report/${jobId}`, {
        headers: { "Authorization": `Bearer ${currentToken}` }
      });

      // If we get a 200 OK response, the report is ready! Show the download option.
      showPartialFailureModal(jobId);
      e.target.value = "";
      fetchFunds();

    } catch (err) {
      const statusCode = err.response?.status;
      
      // 404 means the worker hasn't created a failure log yet (either still running or 100% clean success)
      if (statusCode === 404) {
        if (attempts === 14) {
          // On the final check, if it's still 404, it means no bad rows were ever found!
          Swal.fire('Success', 'Funds imported successfully! No validation errors detected.', 'success');
          e.target.value = "";
          fetchFunds();
        } else {
          // Keep polling
          pollImportStatus(jobId, e, attempts + 1);
        }
      } 
      // 500 means the endpoint hit a database/parsing issue but the log DOES exist! 
      else if (statusCode === 500) {
        console.error("Log entry exists but backend CSV parsing failed:", err.response?.data);
        
        // Don't hide the button! Show the modal anyway so they can attempt the download action.
        showPartialFailureModal(jobId);
        e.target.value = "";
        fetchFunds();
      } 
      // Fallback for any other unexpected networking disconnects
      else {
        pollImportStatus(jobId, e, attempts + 1);
      }
    }
  }, 2000); // Check every 2 seconds
};
// Download Modal UI Logic
const showPartialFailureModal = (jobId) => {
  Swal.fire({
    title: 'Import Partial Failure',
    icon: 'warning',
    html: `
      <p style="color: #64748b; font-size: 13px; margin-bottom: 15px;">
        Some rows failed validation checks and were skipped. Valid rows were inserted.
      </p>
      <button 
        id="downloadReportBtn" 
        style="background-color: #ef4444; color: white; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer; border: none; margin-top: 10px; display: inline-flex; align-items: center; gap: 6px;"
      >
        📥 Download Error Report (CSV)
      </button>
    `,
    showConfirmButton: true,
    confirmButtonColor: '#3b82f6',
    confirmButtonText: 'Close',
    didOpen: () => {
      const btn = document.getElementById('downloadReportBtn');
      if (btn) {
        btn.addEventListener('click', async () => {
          try {
            Swal.showLoading();
            const currentToken = localStorage.getItem("token");
            const reportRes = await axios.get(`${BASE_URL}/api/funds/failed-report/${jobId}`, {
              headers: { "Authorization": `Bearer ${currentToken}` },
              responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([reportRes.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `failed_rows_report_${jobId}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            Swal.fire('Downloaded!', 'Your error report has been saved.', 'success');
          } catch (reportErr) {
            Swal.fire('Error', 'Could not download the csv report.', 'error');
          }
        });
      }
    }
  });
};

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentFundId(null);
    setFundData({ name: "", type: "Venture", location: "", website: "", industry: "" });
  };

  return (
    <div className="p-2 relative z-10 font-sans">
      
      {/* Top Header Block matching Investors */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Funds Matrix</h1>
          <p className="text-xs text-slate-400 mt-1">Manage fund classifications and data imports.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="file"
            id="csvImportInput"
            className="hidden"
            accept=".csv"
            onChange={handleFileChange}
          />

          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all duration-200"
          >
            <HiDownload className="text-slate-400" /> Import Funds
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-blue-500 flex items-center gap-2 shadow-lg shadow-blue-600/10 transition-all duration-200 active:scale-95"
          >
            <HiPlus className="text-sm" /> Add Fund
          </button>
        </div>
      </div>

      {/* Tabs Layout synchronized with dynamic counts */}
      <div className="flex gap-6 border-b border-slate-800/60 pl-1 mb-6">
        {["All", "AI based funds", "GeoPref"].map(tab => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3.5 text-xs font-bold cursor-pointer transition-all border-b-2 -mb-[2px] ${
              activeTab === tab 
                ? "border-blue-500 text-white" 
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab} 
            {tab === "All" && (
              <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-md text-[10px] font-black ml-1.5 border border-slate-700">
                {funds.length}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Main Container Core Box matching Investors */}
      <div className="bg-[#131c35]/80 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl">
        
        {/* Search & Type Filter Control Bar */}
        <div className="flex flex-wrap justify-between items-center p-4 gap-4 border-b border-slate-800/80 bg-[#11192e]/40">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative">
              <HiSearch className="absolute left-3 top-3 text-slate-500 text-sm" />
              <input
                type="text"
                placeholder="Search funds..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-xs focus:border-blue-500 outline-none transition-all w-60"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="All" className="bg-[#0f172a]">All Types</option>
              <option value="Venture" className="bg-[#0f172a]">Venture</option>
              <option value="Private Equity" className="bg-[#0f172a]">Private Equity</option>
              <option value="Hedge Fund" className="bg-[#0f172a]">Hedge Fund</option>
            </select>
          </div>
        </div>

        {/* Operational Grid Table layout */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-24 text-center text-slate-500 text-xs font-bold tracking-wide uppercase">Loading operational index...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-[#11192e]/60">
                  <th className="p-4 pl-6">Fund Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Website</th>
                  <th className="p-4">Industry</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredFunds.length > 0 ? (
                  filteredFunds.map((fund) => (
                    <tr key={fund.id} className="hover:bg-slate-800/30 transition-colors duration-150 group">
                      <td className="p-4 text-sm font-bold text-white pl-6">
                        <div className="flex items-center gap-2">
                          <HiOfficeBuilding className="text-slate-500 text-sm flex-shrink-0" />
                          {fund.name}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-400">{fund.type}</td>
                      <td className="p-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <HiLocationMarker size={13} className="text-slate-500" /> 
                          <span>{fund.location || "---"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-medium">
                        {fund.website ? (
                          <a 
                            href={fund.website.startsWith('http') ? fund.website : `https://${fund.website}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            {fund.website}
                          </a>
                        ) : (
                          <span className="text-slate-600">---</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {fund.industry && (
                            Array.isArray(fund.industry) 
                              ? fund.industry.map((tag, i) => (
                                  <span key={i} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase">{tag}</span>
                                ))
                              : String(fund.industry).split(',').map((tag, i) => (
                                  <span key={i} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase">{tag.trim()}</span>
                                ))
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(fund)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all"><HiPencilAlt size={16} /></button>
                          <button onClick={() => handleDelete(fund.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"><HiTrash size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-20 text-center text-slate-500 text-xs font-bold tracking-wide uppercase italic">
                      No funds registered matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Synchronized Form Modal Panel matching Investors design patterns */}
      {showModal && (
        <div className="fixed inset-0 bg-[#060b19]/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-[#131c35] border border-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center mb-5 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">{isEditing ? "Edit Particulars" : "Register Fund"}</h2>
                <p className="text-slate-500 text-[10px] mt-0.5">Fill out database records parameters.</p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-all">
                <HiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Fund Name</label>
                <input 
                  className="w-full px-3 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-xs focus:border-blue-500 outline-none" 
                  value={fundData.name} 
                  onChange={(e) => setFundData({ ...fundData, name: e.target.value })} 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Type</label>
                  <select 
                    className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-blue-500 transition-all cursor-pointer" 
                    value={fundData.type} 
                    onChange={(e) => setFundData({ ...fundData, type: e.target.value })}
                  >
                    <option value="Venture" className="bg-[#0f172a]">Venture</option>
                    <option value="Private Equity" className="bg-[#0f172a]">Private Equity</option>
                    <option value="Hedge Fund" className="bg-[#0f172a]">Hedge Fund</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Location</label>
                  <input 
                    className="w-full px-3 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-xs focus:border-blue-500 outline-none" 
                    value={fundData.location} 
                    onChange={(e) => setFundData({ ...fundData, location: e.target.value })} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Website</label>
                <input 
                  className="w-full px-3 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-xs focus:border-blue-500 outline-none" 
                  value={fundData.website} 
                  onChange={(e) => setFundData({ ...fundData, website: e.target.value })} 
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Industry Matrix (comma separated)</label>
                <input 
                  className="w-full px-3 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-xs focus:border-blue-500 outline-none" 
                  value={fundData.industry} 
                  onChange={(e) => setFundData({ ...fundData, industry: e.target.value })} 
                  placeholder="AI, SaaS, Fintech" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/10 hover:bg-blue-500 transition-all text-xs tracking-wider mt-2 uppercase"
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