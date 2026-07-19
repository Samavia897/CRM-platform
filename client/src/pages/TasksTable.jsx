import React, { useState, useEffect } from "react";
import axios from "axios";
import { HiPlus, HiSearch, HiFilter, HiX, HiCalendar, HiPencil, HiTrash, HiCheck } from "react-icons/hi";
import Swal from "sweetalert2";

const TASKS_API_URL = "http://localhost:5000/api/tasks";
const INVESTORS_API_URL = "http://localhost:5000/api/investors";

export default function TasksTable() {
  const [tasks, setTasks] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [activeTab, setActiveTab] = useState("Overdue Tasks");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    investorId: "",
    priority: "Medium"
  });

  const [editingTask, setEditingTask] = useState(null);

  const [tempStart, setTempStart] = useState("");
  const [tempEnd, setTempEnd] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchData = async () => {
    try {
      const headers = getAuthHeaders();
      const [tasksRes, investorsRes] = await Promise.all([
        axios.get(TASKS_API_URL, headers),
        axios.get(INVESTORS_API_URL, headers)
      ]);
      setTasks(tasksRes.data);
      setInvestors(investorsRes.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();

    const selectedInv = investors.find(i => i.id === newTask.investorId);
    const investorFullName = selectedInv ? `${selectedInv.firstName} ${selectedInv.lastName || ""}`.trim() : "N/A";

    try {
      await axios.post(TASKS_API_URL, {
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate,
        priority: newTask.priority,
        investorId: newTask.investorId,
        investor: investorFullName,
        status: "Pending"
      }, getAuthHeaders());

      setShowModal(false);
      setNewTask({ title: "", description: "", dueDate: "", investorId: "", priority: "Medium" });
      Swal.fire({ icon: "success", title: "Task Added!", timer: 1000, showConfirmButton: false });
      fetchData();
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire("Error", err.response?.data?.message || "Error saving task", "error");
    }
  };

  const toggleComplete = async (task) => {
    try {
      const updatedStatus = task.status === "Completed" ? "Pending" : "Completed";
      await axios.patch(`${TASKS_API_URL}/${task.id}`, { status: updatedStatus }, getAuthHeaders());
      fetchData();
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    const selectedInv = investors.find(i => i.id === editingTask.investorId);
    const investorFullName = selectedInv ? `${selectedInv.firstName} ${selectedInv.lastName || ""}`.trim() : "N/A";

    try {
      await axios.patch(`${TASKS_API_URL}/${editingTask.id}`, {
        title: editingTask.title,
        description: editingTask.description,
        dueDate: editingTask.dueDate,
        priority: editingTask.priority,
        investorId: editingTask.investorId,
        investor: investorFullName
      }, getAuthHeaders());

      setShowEditModal(false);
      setEditingTask(null);
      Swal.fire({ icon: "success", title: "Task Updated!", timer: 1000, showConfirmButton: false });
      fetchData();
    } catch (err) {
      console.error("Edit error:", err);
      Swal.fire("Error", "Could not update task", "error");
    }
  };

  const handleDeleteTask = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this task!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6", // Updated sweetalert color for dark mode
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${TASKS_API_URL}/${id}`, getAuthHeaders());
          Swal.fire("Deleted!", "Your task has been deleted.", "success");
          fetchData();
        } catch (err) {
          console.error("Delete error:", err);
          Swal.fire("Error", "Could not delete task", "error");
        }
      }
    });
  };

  const filteredTasks = tasks.filter((task) => {
    const isCompleted = task.status === "Completed";
    const matchesTab = activeTab === "Complete Tasks" ? isCompleted : !isCompleted;
    const matchesSearch = task.title ? task.title.toLowerCase().includes(searchTerm.toLowerCase()) : false;

    if (!task.dueDate) return matchesTab && matchesSearch;

    const taskDate = new Date(task.dueDate).setHours(0, 0, 0, 0);
    const start = appliedStart ? new Date(appliedStart).setHours(0, 0, 0, 0) : null;
    const end = appliedEnd ? new Date(appliedEnd).setHours(0, 0, 0, 0) : null;

    let matchesDate = true;
    if (start && end) matchesDate = taskDate >= start && taskDate <= end;
    else if (start) matchesDate = taskDate >= start;
    else if (end) matchesDate = taskDate <= end;

    return matchesTab && matchesSearch && matchesDate;
  });

  return (
    <div className="bg-[#060b19] min-h-screen p-4 font-sans text-white">
      {/* Header section matching dark theme */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Tasks</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/10 transition-all duration-200">
          <HiPlus /> Add Task
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-800/60 pl-1 mb-6 relative z-10">
        {["Overdue Tasks", "Due Tasks", "Upcoming Tasks", "Complete Tasks"].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`pb-3 text-[12px] font-semibold transition-all border-b-2 -mb-[2px] ${
              activeTab === tab 
                ? "border-blue-500 text-white" 
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Container */}
      <div className="bg-[#131c35]/80 border border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-xl relative overflow-visible">
        
        {/* Search & Filter Toolbar */}
        <div className="p-4 flex justify-between items-center border-b border-slate-800/80 bg-[#11192e]/40 relative">
          <div className="relative w-64">
            <HiSearch className="absolute left-3 top-3 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-9 pr-4 py-2 w-full bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-[13px] focus:border-blue-500 outline-none transition-all" 
            />
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)} 
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[12px] font-medium transition-all ${
                appliedStart || appliedEnd 
                  ? "border-blue-500 text-blue-400 bg-blue-500/10" 
                  : "border-slate-700 text-slate-400 bg-[#0f172a]/90 hover:text-white"
              }`}
            >
              <HiFilter /> Filter {(appliedStart || appliedEnd) && "•"}
            </button>

            {/* Dark Mode Filter Dropdown */}
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-[#131c35] border border-slate-700 shadow-2xl rounded-xl z-[999] p-4 border-t-4 border-t-blue-500">
                <div className="flex justify-between items-center mb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Date Range</span>
                  <button onClick={() => setShowFilterDropdown(false)} className="hover:text-white text-slate-400"><HiX size={16}/></button>
                </div>
                <div className="space-y-4">
                  <input type="date" value={tempStart} onChange={(e) => setTempStart(e.target.value)} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 [color-scheme:dark]" />
                  <input type="date" value={tempEnd} onChange={(e) => setTempEnd(e.target.value)} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 [color-scheme:dark]" />
                  <div className="flex gap-2">
                    <button onClick={() => { setTempStart(""); setTempEnd(""); setAppliedStart(""); setAppliedEnd(""); setShowFilterDropdown(false) }} className="flex-1 py-2 text-[11px] font-bold text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-all">Clear</button>
                    <button onClick={() => { setAppliedStart(tempStart); setAppliedEnd(tempEnd); setShowFilterDropdown(false) }} className="flex-1 py-2 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-500 transition-all">Apply</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#11192e]/60 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Task Title</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Investor</th>
                <th className="p-4 text-center">Priority</th>
                <th className="p-4 text-center w-52">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTasks.map((task) => {
                const isCompleted = task.status === "Completed";
                return (
                  <tr key={task.id} className={`${isCompleted ? 'bg-emerald-500/5' : 'hover:bg-slate-800/30'} transition-colors`}>
                    <td className="p-4 pl-6">
                      <div className={`text-[13px] font-semibold ${isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>{task.title}</div>
                      {task.description && <div className="text-[11px] text-slate-400 font-normal max-w-xs truncate mt-0.5">{task.description}</div>}
                    </td>
                    <td className="p-4 text-[12px] text-slate-400">
                      <div className="flex items-center gap-1.5"><HiCalendar className="text-slate-500" /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}</div>
                    </td>
                    <td className="p-4 text-[13px] text-blue-400 font-medium">{task.investor || "N/A"}</td>
                    <td className="p-4 text-center">
                      <span className={`text-[9px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border ${
                        task.priority === "High" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        task.priority === "Medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                        "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}>{task.priority}</span>
                    </td>

                    <td className="p-4 flex items-center justify-center gap-2">
                      <button
                        onClick={() => toggleComplete(task)}
                        className={`p-1.5 rounded-lg transition-all border ${
                          isCompleted 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' 
                            : 'bg-transparent text-slate-500 border-slate-700 hover:text-emerald-400 hover:border-emerald-400'
                        }`}
                      >
                        <HiCheck className="text-base" />
                      </button>

                      <button
                        onClick={() => { setEditingTask(task); setShowEditModal(true); }}
                        className="p-1.5 rounded-lg bg-transparent text-slate-500 hover:text-blue-400 hover:bg-slate-800 transition-all"
                      >
                        <HiPencil className="text-base" />
                      </button>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded-lg bg-transparent text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-all"
                      >
                        <HiTrash className="text-base" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD TASK MODAL (Dark Theme) */}
      {showModal && (
        <div className="fixed inset-0 bg-[#060b19]/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-[#131c35] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-black text-white uppercase mb-6 tracking-wide">New Task</h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <input required type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="w-full p-3 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:border-blue-500 outline-none" placeholder="Task Title" />

              <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="w-full p-3 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:border-blue-500 outline-none resize-none" placeholder="Description (Optional)" rows={2} />

              <div className="grid grid-cols-2 gap-4">
                <input required type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="w-full p-3 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none [color-scheme:dark]" />

                <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="w-full p-3 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none">
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>

              <div>
                <select required value={newTask.investorId} onChange={(e) => setNewTask({ ...newTask, investorId: e.target.value })} className="w-full p-3 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none">
                  <option value="">Select Investor</option>
                  {investors.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.firstName} {inv.lastName}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="w-full py-3 bg-blue-600 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-600/10 hover:bg-blue-500 transition-all mt-2">SAVE TASK</button>
              <button type="button" onClick={() => setShowModal(false)} className="w-full py-2 text-slate-400 hover:text-white text-xs font-bold transition-colors">CANCEL</button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL (Dark Theme) */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-[#060b19]/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-[#131c35] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-black text-white uppercase mb-6 tracking-wide">Edit Task</h2>
            <form onSubmit={handleEditTask} className="space-y-4">
              <input required type="text" value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} className="w-full p-3 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:border-blue-500 outline-none" />

              <textarea value={editingTask.description || ""} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} className="w-full p-3 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:border-blue-500 outline-none resize-none" rows={2} />

              <div className="grid grid-cols-2 gap-4">
                <input required type="date" value={editingTask.dueDate ? editingTask.dueDate.substring(0, 10) : ""} onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })} className="w-full p-3 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none [color-scheme:dark]" />

                <select value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })} className="w-full p-3 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <select required value={editingTask.investorId || ""} onChange={(e) => setEditingTask({ ...editingTask, investorId: e.target.value })} className="w-full p-3 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none">
                  <option value="">Select Investor</option>
                  {investors.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.firstName} {inv.lastName}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="w-full py-3 bg-blue-600 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-600/10 hover:bg-blue-500 transition-all mt-2 uppercase">Update Changes</button>
              <button type="button" onClick={() => { setShowEditModal(false); setEditingTask(null); }} className="w-full py-2 text-slate-400 hover:text-white text-xs font-bold uppercase transition-colors">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}