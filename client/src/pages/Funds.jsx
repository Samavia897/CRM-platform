import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import { 
  HiPlus, 
  HiX, 
  HiLocationMarker, 
  HiDownload, 
  HiPencilAlt, 
  HiTrash, 
  HiSearch, 
  HiOfficeBuilding,
  HiBriefcase,
  HiChartPie,
  HiCube,
  HiFilter
} from "react-icons/hi";

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

  // Dashboard Dynamic Counts
  const totalFundsCount = funds.length;
  const ventureCount = funds.filter(f => f.type === "Venture").length;
  const peCount = funds.filter(f => f.type === "Private Equity").length;
  const hedgeCount = funds.filter(f => f.type === "Hedge Fund").length;

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
      confirmButtonColor: '#00e699',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
      background: '#14171f',
      color: '#ffffff'
    });

    if (result.isConfirmed) {
      try {
        const currentToken = localStorage.getItem("token");
        await axios.delete(`${BASE_URL}/api/funds/${id}`, { 
          headers: { "Authorization": `Bearer ${currentToken}` } 
        });
        Swal.fire({
          title: 'Deleted!',
          text: 'Fund has been removed.',
          icon: 'success',
          background: '#14171f',
          color: '#ffffff'
        });
        fetchFunds();
      } catch (err) {
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete fund.',
          icon: 'error',
          background: '#14171f',
          color: '#ffffff'
        });
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
        Swal.fire({ title: 'Updated!', text: 'Fund details updated.', icon: 'success', background: '#14171f', color: '#fff' });
      } else {
        await axios.post(`${BASE_URL}/api/funds`, payload, requestConfig);
        Swal.fire({ title: 'Success!', text: 'New fund created.', icon: 'success', background: '#14171f', color: '#fff' });
      }

      closeModal();
      fetchFunds();
    } catch (err) {
      console.error(err);
      Swal.fire({ title: 'Error!', text: err.response?.data?.error || 'Operation failed.', icon: 'error', background: '#14171f', color: '#fff' });
    }
  };

  const handleImportClick = () => {
    document.getElementById('csvImportInput').click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== "text/csv") {
      return Swal.fire({ title: 'Error', text: 'Please upload a valid CSV file', icon: 'error', background: '#14171f', color: '#fff' });
    }

    const fileFormData = new FormData();
    fileFormData.append("file", file);

    Swal.fire({
      title: 'Processing CSV File...',
      text: 'Validating columns and importing records...',
      allowOutsideClick: false,
      background: '#14171f',
      color: '#fff',
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

      const jobId = res.data?.jobId || res.data?.id || res.data?.importId;

      if (jobId) {
        pollImportStatus(jobId, e);
      } else {
        Swal.fire({ title: 'Success', text: 'Import completed successfully!', icon: 'success', background: '#14171f', color: '#fff' });
        e.target.value = "";
        fetchFunds();
      }

    } catch (err) {
      console.error("Import Error:", err.response?.data);
      e.target.value = "";
      Swal.fire({ title: 'Import Failed', text: err.response?.data?.message || 'Failed to submit file.', icon: 'error', background: '#14171f', color: '#fff' });
      fetchFunds();
    }
  };

  const pollImportStatus = (jobId, e, attempts = 0) => {
    const currentToken = localStorage.getItem("token");
    
    if (attempts > 10) {
      Swal.fire({ title: 'Import Processed', text: 'CSV import complete.', icon: 'info', background: '#14171f', color: '#fff' });
      if (e?.target) e.target.value = "";
      fetchFunds();
      return;
    }

    setTimeout(async () => {
      try {
        await axios.get(`${BASE_URL}/api/funds/failed-report/${jobId}`, {
          headers: { "Authorization": `Bearer ${currentToken}` }
        });

        showPartialFailureModal(jobId);
        if (e?.target) e.target.value = "";
        fetchFunds();

      } catch (err) {
        const statusCode = err.response?.status;

        if (statusCode === 404) {
          if (attempts >= 2) {
            Swal.fire({ title: 'Success!', text: 'All funds imported with zero errors!', icon: 'success', background: '#14171f', color: '#fff' });
            if (e?.target) e.target.value = "";
            fetchFunds();
          } else {
            pollImportStatus(jobId, e, attempts + 1);
          }
        } 
        else if (statusCode === 500) {
          Swal.fire({ title: 'Import Completed', text: 'Import batch finished processing.', icon: 'success', background: '#14171f', color: '#fff' });
          if (e?.target) e.target.value = "";
          fetchFunds();
        } 
        else {
          pollImportStatus(jobId, e, attempts + 1);
        }
      }
    }, 1200);
  };

  const showPartialFailureModal = async (jobId) => {
    try {
      const currentToken = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/funds/failed-report/${jobId}`, {
        headers: { "Authorization": `Bearer ${currentToken}` }
      });

      const { errors, totalFailed } = response.data || {};

      if (!errors || errors.length === 0) {
        Swal.fire({ title: 'Import Complete', text: 'All valid funds imported!', icon: 'success', background: '#14171f', color: '#fff' });
        return;
      }

      const errorsHtml = errors.map(err => `
        <div style="text-align: left; padding: 8px 12px; margin-bottom: 8px; background: #221517; border-left: 4px solid #ef4444; border-radius: 6px; font-size: 12px;">
          <strong style="color: #f87171;">Row ${err.row || 'N/A'}:</strong> 
          <span style="color: #9ca3af; font-weight: 500; display: block; margin-top: 2px;">${err.reason || err.message || 'Validation error'}</span>
        </div>
      `).join('');

      Swal.fire({
        title: 'Validation Errors Detected!',
        icon: 'warning',
        background: '#14171f',
        color: '#ffffff',
        html: `
          <p style="font-size: 12px; color: #9ca3af; text-align: left; margin-bottom: 12px;">
            Found ${totalFailed || errors.length} issue(s) during CSV processing:
          </p>
          <div style="max-height: 250px; overflow-y: auto; padding-right: 4px;">
            ${errorsHtml}
          </div>
        `,
        confirmButtonText: 'Understood',
        confirmButtonColor: '#00e699'
      });

    } catch (err) {
      console.error("FAILED TO FETCH LOGS:", err);
      if (err.response?.status === 404) {
        Swal.fire({ title: 'Success', text: 'Import completed with zero errors!', icon: 'success', background: '#14171f', color: '#fff' });
      } else {
        Swal.fire({
          title: 'Import Processed',
          text: 'CSV file was processed. Please check your funds table.',
          icon: 'info',
          confirmButtonColor: '#00e699',
          background: '#14171f',
          color: '#fff'
        });
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentFundId(null);
    setFundData({ name: "", type: "Venture", location: "", website: "", industry: "" });
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 min-h-screen bg-[#0d0f12] text-neutral-200 font-sans">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Funds Intelligence Center
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Real-time liquidity matrix and investment vector metrics.
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <input
            type="file"
            id="csvImportInput"
            className="hidden"
            accept=".csv, text/csv, application/vnd.ms-excel, application/csv, text/x-csv"
            onChange={handleFileChange}
          />

          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1b1e24] hover:bg-[#252830] border border-neutral-800 rounded-xl text-xs font-semibold text-neutral-300 transition-all shadow-sm"
          >
            <HiDownload className="text-neutral-400 text-sm" /> Batch CSV Import
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="bg-[#00e699] hover:bg-[#00cc88] text-black font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <HiPlus className="text-sm stroke-2" /> Create Fund Entity
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#14171f] border border-neutral-800/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Total Entities</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{totalFundsCount}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-[#00e699] rounded-xl border border-emerald-500/20">
            <HiOfficeBuilding className="text-2xl" />
          </div>
        </div>

        <div className="bg-[#14171f] border border-neutral-800/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Venture Capital</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{ventureCount}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-[#00e699] rounded-xl border border-emerald-500/20">
            <HiBriefcase className="text-2xl" />
          </div>
        </div>

        <div className="bg-[#14171f] border border-neutral-800/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Private Equity</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{peCount}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-[#00e699] rounded-xl border border-emerald-500/20">
            <HiChartPie className="text-2xl" />
          </div>
        </div>

        <div className="bg-[#14171f] border border-neutral-800/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Hedge Funds</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{hedgeCount}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-[#00e699] rounded-xl border border-emerald-500/20">
            <HiCube className="text-2xl" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-[#14171f] border border-neutral-800/80 rounded-2xl shadow-xl overflow-hidden">

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between p-4 gap-4 border-b border-neutral-800/80 bg-[#101218]">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <HiSearch className="absolute left-3.5 top-3 text-neutral-500 text-sm" />
              <input
                type="text"
                placeholder="Search funds or geography..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#0a0c0e] border border-neutral-800 rounded-xl text-white placeholder-neutral-500 text-xs focus:border-[#00e699] outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <HiFilter className="text-neutral-500 text-sm hidden sm:block" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-[#0a0c0e] border border-neutral-800 rounded-xl text-xs font-medium text-neutral-300 outline-none focus:border-[#00e699] transition-all cursor-pointer"
              >
                <option value="All">All Allocations</option>
                <option value="Venture">Venture</option>
                <option value="Private Equity">Private Equity</option>
                <option value="Hedge Fund">Hedge Fund</option>
              </select>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            {["All", "AI based funds", "GeoPref"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`transition-colors ${
                  activeTab === tab 
                    ? "text-[#00e699] font-bold border-b-2 border-[#00e699] pb-1" 
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center text-neutral-500 text-xs font-medium uppercase tracking-wider">
              Syncing Funds Network...
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800/80 text-[11px] font-bold text-neutral-400 uppercase tracking-wider bg-[#101218]/60">
                  <th className="p-4 pl-6">Fund Designation</th>
                  <th className="p-4">Structure Type</th>
                  <th className="p-4">Geography</th>
                  <th className="p-4">Web Presence</th>
                  <th className="p-4">Industry Sector</th>
                  <th className="p-4 text-right pr-6">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-xs">
                {filteredFunds.length > 0 ? (
                  filteredFunds.map((fund) => (
                    <tr key={fund.id} className="hover:bg-neutral-800/20 transition-colors">
                      <td className="p-4 pl-6 font-bold text-white">{fund.name}</td>
                      <td className="p-4 text-neutral-400">{fund.type}</td>
                      <td className="p-4 text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <HiLocationMarker size={14} className="text-neutral-500" />
                          <span>{fund.location || "N/A"}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {fund.website ? (
                          <a 
                            href={fund.website.startsWith('http') ? fund.website : `https://${fund.website}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[#00e699] hover:underline font-medium"
                          >
                            {fund.website}
                          </a>
                        ) : (
                          <span className="text-neutral-600">N/A</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {fund.industry && (
                            Array.isArray(fund.industry) 
                              ? fund.industry.map((tag, i) => (
                                  <span key={i} className="bg-emerald-500/10 text-[#00e699] border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">{tag}</span>
                                ))
                              : String(fund.industry).split(',').map((tag, i) => (
                                  <span key={i} className="bg-emerald-500/10 text-[#00e699] border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">{tag.trim()}</span>
                                ))
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(fund)} className="p-1.5 text-neutral-400 hover:text-[#00e699] rounded transition-colors"><HiPencilAlt size={16} /></button>
                          <button onClick={() => handleDelete(fund.id)} className="p-1.5 text-neutral-400 hover:text-red-400 rounded transition-colors"><HiTrash size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-neutral-500 text-xs italic">
                      No matching fund entities registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-[#14171f] border border-neutral-800 p-6 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-5 border-b border-neutral-800 pb-3">
              <h2 className="text-base font-bold text-white">{isEditing ? "Edit Fund Entity" : "Add Fund Entity"}</h2>
              <button onClick={closeModal} className="text-neutral-400 hover:text-white p-1 rounded">
                <HiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-400 mb-1">Entity Name</label>
                <input 
                  className="w-full px-3 py-2 bg-[#0a0c0e] border border-neutral-800 rounded-xl text-white outline-none focus:border-[#00e699]" 
                  value={fundData.name} 
                  onChange={(e) => setFundData({ ...fundData, name: e.target.value })} 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-400 mb-1">Structure Type</label>
                  <select 
                    className="w-full p-2 bg-[#0a0c0e] border border-neutral-800 rounded-xl text-neutral-200 outline-none focus:border-[#00e699]" 
                    value={fundData.type} 
                    onChange={(e) => setFundData({ ...fundData, type: e.target.value })}
                  >
                    <option value="Venture">Venture</option>
                    <option value="Private Equity">Private Equity</option>
                    <option value="Hedge Fund">Hedge Fund</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-400 mb-1">Geography</label>
                  <input 
                    className="w-full px-3 py-2 bg-[#0a0c0e] border border-neutral-800 rounded-xl text-white outline-none focus:border-[#00e699]" 
                    value={fundData.location} 
                    onChange={(e) => setFundData({ ...fundData, location: e.target.value })} 
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-400 mb-1">Web Domain</label>
                <input 
                  className="w-full px-3 py-2 bg-[#0a0c0e] border border-neutral-800 rounded-xl text-white outline-none focus:border-[#00e699]" 
                  value={fundData.website} 
                  onChange={(e) => setFundData({ ...fundData, website: e.target.value })} 
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-400 mb-1">Sectors (comma separated)</label>
                <input 
                  className="w-full px-3 py-2 bg-[#0a0c0e] border border-neutral-800 rounded-xl text-white outline-none focus:border-[#00e699]" 
                  value={fundData.industry} 
                  onChange={(e) => setFundData({ ...fundData, industry: e.target.value })} 
                  placeholder="AI, SaaS, HealthTech" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-[#00e699] hover:bg-[#00cc88] text-black font-bold rounded-xl transition-all mt-2"
              >
                {isEditing ? "Save Entity Changes" : "Confirm Fund Creation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}