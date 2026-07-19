import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import { 
  HiPlus, HiX, HiCalendar, HiCheckCircle, HiClock, 
  HiPencilAlt, HiTrash, HiSearch, HiClipboardList 
} from "react-icons/hi";

export default function TasksTable() {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All"); // All, Pending, Completed
  const [isEditing, setIsEditing] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");

  const [taskData, setTaskData] = useState({
    title: "", description: "", priority: "Medium", dueDate: "", status: "Pending"
  });
  
  const BASE_URL = "https://crm-backend-live-4541.onrender.com";

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const currentToken = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/api/tasks`, { 
        headers: { "Authorization": `Bearer ${currentToken}` } 
      });
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const filteredTasks = tasks.filter(task => {
    const titleMatch = task.title ? task.title.toLowerCase() : "";
    const descMatch = task.description ? task.description.toLowerCase() : "";
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = titleMatch.includes(searchLower) || descMatch.includes(searchLower);
    const matchesPriority = filterPriority === "All" || task.priority === filterPriority;

    if (activeTab === "Pending") {
      return matchesSearch && matchesPriority && task.status === "Pending";
    }
    if (activeTab === "Completed") {
      return matchesSearch && matchesPriority && task.status === "Completed";
    }

    return matchesSearch && matchesPriority;
  });

  const handleEdit = (task) => {
    setIsEditing(true);
    setCurrentTaskId(task.id);
    setTaskData({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "Medium",
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : "",
      status: task.status || "Pending",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this task status!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const currentToken = localStorage.getItem("token");
        await axios.delete(`${BASE_URL}/api/tasks/${id}`, { 
          headers: { "Authorization": `Bearer ${currentToken}` } 
        });
        Swal.fire('Deleted!', 'Task has been removed.', 'success');
        fetchTasks();
      } catch (err) {
        Swal.fire('Error!', 'Failed to delete task.', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: taskData.title.trim(),
        description: taskData.description.trim(),
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        status: taskData.status
      };

      const currentToken = localStorage.getItem("token");
      const requestConfig = { headers: { "Authorization": `Bearer ${currentToken}` } };

      if (isEditing) {
        await axios.put(`${BASE_URL}/api/tasks/${currentTaskId}`, payload, requestConfig);
        Swal.fire('Updated!', 'Task details updated successfully.', 'success');
      } else {
        await axios.post(`${BASE_URL}/api/tasks`, payload, requestConfig);
        Swal.fire('Success!', 'New task assigned successfully.', 'success');
      }

      closeModal();
      fetchTasks();
    } catch (err) {
      console.error(err);
      Swal.fire('Error!', err.response?.data?.error || 'Operation failed.', 'error');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentTaskId(null);
    setTaskData({ title: "", description: "", priority: "Medium", dueDate: "", status: "Pending" });
  };

  return (
    <div className="p-2 relative z-10 font-sans">
      
      {/* Top Header Block matching Funds & Investors */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Tasks Pipeline</h1>
          <p className="text-xs text-slate-400 mt-1">Track operational objectives and milestones execution.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-blue-500 flex items-center gap-2 shadow-lg shadow-blue-600/10 transition-all duration-200 active:scale-95"
          >
            <HiPlus className="text-sm" /> Create Task
          </button>
        </div>
      </div>

      {/* Tabs Layout synchronized with dynamic counts */}
      <div className="flex gap-6 border-b border-slate-800/60 pl-1 mb-6">
        {["All", "Pending", "Completed"].map(tab => (
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
                {tasks.length}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Main Container Core Box matching Funds UI */}
      <div className="bg-[#131c35]/80 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl">
        
        {/* Search & Priority Filter Control Bar */}
        <div className="flex flex-wrap justify-between items-center p-4 gap-4 border-b border-slate-800/80 bg-[#11192e]/40">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative">
              <HiSearch className="absolute left-3 top-3 text-slate-500 text-sm" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-xs focus:border-blue-500 outline-none transition-all w-60"
              />
            </div>
            
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="All" className="bg-[#0f172a]">All Priorities</option>
              <option value="High" className="bg-[#0f172a]">High</option>
              <option value="Medium" className="bg-[#0f172a]">Medium</option>
              <option value="Low" className="bg-[#0f172a]">Low</option>
            </select>
          </div>
        </div>

        {/* Operational Grid Table layout */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-24 text-center text-slate-500 text-xs font-bold tracking-wide uppercase">Loading operations logs...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-[#11192e]/60">
                  <th className="p-4 pl-6">Task Brief</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Execution Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-800/30 transition-colors duration-150 group">
                      <td className="p-4 text-sm font-bold text-white pl-6 max-w-xs">
                        <div className="flex items-start gap-2.5">
                          <HiClipboardList className="text-slate-500 text-base mt-0.5 flex-shrink-0" />
                          <div>
                            <span className={task.status === "Completed" ? "line-through text-slate-500 font-medium" : "text-white"}>
                              {task.title}
                            </span>
                            <p className="text-[11px] font-normal text-slate-400 mt-0.5 line-clamp-1">{task.description || "No brief documentation provided."}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                          task.priority === "High" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          task.priority === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <HiCalendar size={13} className="text-slate-500" />
                          <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : "---"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          {task.status === "Completed" ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                              <HiCheckCircle size={14} /> Completed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-500 font-medium text-[11px]">
                              <HiClock size={14} /> In Pipeline
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(task)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all"><HiPencilAlt size={16} /></button>
                          <button onClick={() => handleDelete(task.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"><HiTrash size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-20 text-center text-slate-500 text-xs font-bold tracking-wide uppercase italic">
                      No metrics found registered matching pipeline parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Synchronized Form Modal Panel matching Funds styles */}
      {showModal && (
        <div className="fixed inset-0 bg-[#060b19]/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-[#131c35] border border-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center mb-5 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">{isEditing ? "Edit Assignment" : "Configure Pipeline Entry"}</h2>
                <p className="text-slate-500 text-[10px] mt-0.5">Define operations parameter limits.</p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-all">
                <HiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Task Title</label>
                <input 
                  className="w-full px-3 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-xs focus:border-blue-500 outline-none" 
                  value={taskData.title} 
                  onChange={(e) => setTaskData({ ...taskData, title: e.target.value })} 
                  required 
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Documentation Brief</label>
                <textarea 
                  rows="3"
                  className="w-full px-3 py-2 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-xs focus:border-blue-500 outline-none resize-none" 
                  value={taskData.description} 
                  onChange={(e) => setTaskData({ ...taskData, description: e.target.value })} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Priority</label>
                  <select 
                    className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-blue-500 transition-all cursor-pointer" 
                    value={taskData.priority} 
                    onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
                  >
                    <option value="High" className="bg-[#0f172a]">High Priority</option>
                    <option value="Medium" className="bg-[#0f172a]">Medium Priority</option>
                    <option value="Low" className="bg-[#0f172a]">Low Priority</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Execution Status</label>
                  <select 
                    className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-blue-500 transition-all cursor-pointer" 
                    value={taskData.status} 
                    onChange={(e) => setTaskData({ ...taskData, status: e.target.value })}
                  >
                    <option value="Pending" className="bg-[#0f172a]">Pending</option>
                    <option value="Completed" className="bg-[#0f172a]">Completed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Deadline Node Target</label>
                <input 
                  type="date"
                  className="w-full px-3 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-xs focus:border-blue-500 outline-none cursor-pointer" 
                  value={taskData.dueDate} 
                  onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })} 
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/10 hover:bg-blue-500 transition-all text-xs tracking-wider mt-2 uppercase"
              >
                {isEditing ? "Update Metrics" : "Execute Injection"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}