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
      confirmButtonColor: "#00388D",
      cancelButtonColor: "#d33",
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
    <div className="bg-[#F8FAFC] min-h-screen p-6 font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and track pipeline milestones and tasks</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-[#00388D] hover:bg-[#002C71] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors duration-150"
        >
          <HiPlus className="text-base" /> Add Task
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 mb-6 bg-white rounded-xl shadow-sm px-4 relative z-10">
        {["Overdue Tasks", "Due Tasks", "Upcoming Tasks", "Complete Tasks"].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-4 py-3.5 text-sm font-medium transition-all relative ${
              activeTab === tab 
                ? "text-[#00388D] font-semibold border-b-2 border-[#00388D]" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table Main Wrapper */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm relative overflow-visible">
        {/* Table Toolbar */}
        <div className="p-4 flex justify-between items-center border-b border-slate-100 bg-white rounded-t-xl relative">
          <div className="relative w-72">
            <HiSearch className="absolute left-3 top-3 text-slate-400 text-base" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#00388D] focus:ring-1 focus:ring-[#00388D] outline-none transition-all" 
            />
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)} 
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                appliedStart || appliedEnd 
                  ? "border-[#00388D] text-[#00388D] bg-blue-50/50" 
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <HiFilter /> Filter {(appliedStart || appliedEnd) && <span className="w-1.5 h-1.5 rounded-full bg-[#00388D]"></span>}
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 shadow-xl rounded-xl z-[999] p-4">
                <div className="flex justify-between items-center mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Date Range</span>
                  <button onClick={() => setShowFilterDropdown(false)} className="text-slate-400 hover:text-slate-600"><HiX /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">Start Date</label>
                    <input type="date" value={tempStart} onChange={(e) => setTempStart(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-[#00388D] outline-none" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">End Date</label>
                    <input type="date" value={tempEnd} onChange={(e) => setTempEnd(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-[#00388D] outline-none" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => { setTempStart(""); setTempEnd(""); setAppliedStart(""); setAppliedEnd(""); setShowFilterDropdown(false) }} className="flex-1 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Clear</button>
                    <button onClick={() => { setAppliedStart(tempStart); setAppliedEnd(tempEnd); setShowFilterDropdown(false) }} className="flex-1 py-2 bg-[#00388D] hover:bg-[#002C71] text-white text-xs font-medium rounded-lg transition-colors">Apply</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 tracking-wider">
                <th className="p-4 pl-6">Task Title</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Investor</th>
                <th className="p-4 text-center">Priority</th>
                <th className="p-4 text-right pr-6 w-44">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400 text-sm">No tasks found matching current view.</td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isCompleted = task.status === "Completed";
                  return (
                    <tr key={task.id} className={`hover:bg-slate-50/60 transition-colors ${isCompleted ? 'bg-slate-50/40' : ''}`}>
                      <td className="p-4 pl-6">
                        <div className={`font-medium ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</div>
                        {task.description && <div className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{task.description}</div>}
                      </td>
                      <td className="p-4 text-slate-600">
                        <div className="flex items-center gap-2">
                          <HiCalendar className="text-slate-400 text-base" /> 
                          <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : "No Date"}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-[#00388D] bg-blue-50/60 px-2.5 py-1 rounded-md text-xs">{task.investor || "N/A"}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium inline-block w-24 text-center ${
                          task.priority === "High" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                          task.priority === "Medium" ? "bg-amber-50 text-amber-700 border border-amber-100" : 
                          "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}>{task.priority} Priority</span>
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleComplete(task)}
                            title={isCompleted ? "Mark Pending" : "Mark Complete"}
                            className={`p-2 rounded-lg transition-all border ${
                              isCompleted 
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                                : 'bg-white text-slate-400 border-slate-200 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/30'
                            }`}
                          >
                            <HiCheck className="text-base" />
                          </button>

                          <button
                            onClick={() => { setEditingTask(task); setShowEditModal(true); }}
                            title="Edit Task"
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-[#00388D] hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                          >
                            <HiPencil className="text-base" />
                          </button>

                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            title="Delete Task"
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/30 transition-all"
                          >
                            <HiTrash className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl border border-slate-100 transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Create New Task</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><HiX className="text-xl" /></button>
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Task Title *</label>
                <input required type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-[#00388D] focus:ring-1 focus:ring-[#00388D] outline-none" placeholder="e.g., Follow up on Capital Call" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Description</label>
                <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-[#00388D] focus:ring-1 focus:ring-[#00388D] outline-none" placeholder="Provide extra context here..." rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Due Date *</label>
                  <input required type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-[#00388D] focus:ring-1 focus:ring-[#00388D] outline-none" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Priority</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-[#00388D] focus:ring-1 focus:ring-[#00388D] outline-none">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Assigned Investor *</label>
                <select required value={newTask.investorId} onChange={(e) => setNewTask({ ...newTask, investorId: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-[#00388D] focus:ring-1 focus:ring-[#00388D] outline-none">
                  <option value="">Select Investor</option>
                  {investors.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.firstName} {inv.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#00388D] hover:bg-[#002C71] text-white text-sm font-medium rounded-lg shadow-sm transition-colors">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl border border-slate-100 transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Edit Task Details</h2>
              <button onClick={() => { setShowEditModal(false); setEditingTask(null); }} className="text-slate-400 hover:text-slate-600"><HiX className="text-xl" /></button>
            </div>
            
            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Task Title *</label>
                <input required type="text" value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-[#00388D] outline-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Description</label>
                <textarea value={editingTask.description || ""} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-[#00388D] outline-none" rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Due Date *</label>
                  <input required type="date" value={editingTask.dueDate ? editingTask.dueDate.substring(0, 10) : ""} onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-[#00388D] outline-none" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Priority</label>
                  <select value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-[#00388D] outline-none">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Assigned Investor *</label>
                <select required value={editingTask.investorId || ""} onChange={(e) => setEditingTask({ ...editingTask, investorId: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-[#00388D] outline-none">
                  <option value="">Select Investor</option>
                  {investors.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.firstName} {inv.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowEditModal(false); setEditingTask(null); }} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#00388D] hover:bg-[#002C71] text-white text-sm font-medium rounded-lg shadow-sm transition-colors">Update Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}