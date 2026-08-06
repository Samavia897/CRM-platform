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
      Swal.fire({ 
        icon: "success", 
        title: "Task Added!", 
        timer: 1000, 
        showConfirmButton: false,
        background: "#09090b",
        color: "#f43f5e"
      });
      fetchData();
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Error saving task",
        background: "#09090b",
        color: "#f43f5e"
      });
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
      Swal.fire({ 
        icon: "success", 
        title: "Task Updated!", 
        timer: 1000, 
        showConfirmButton: false,
        background: "#09090b",
        color: "#f43f5e"
      });
      fetchData();
    } catch (err) {
      console.error("Edit error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not update task",
        background: "#09090b",
        color: "#f43f5e"
      });
    }
  };

  const handleDeleteTask = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this task!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981", 
      cancelButtonColor: "#f43f5e",
      confirmButtonText: "Yes, delete it!",
      background: "#09090b",
      color: "#f43f5e"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${TASKS_API_URL}/${id}`, getAuthHeaders());
          Swal.fire({
            title: "Deleted!",
            text: "Your task has been deleted.",
            icon: "success",
            background: "#09090b",
            color: "#f43f5e"
          });
          fetchData();
        } catch (err) {
          console.error("Delete error:", err);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Could not delete task",
            background: "#09090b",
            color: "#f43f5e"
          });
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
    <div className="bg-zinc-950 min-h-screen p-6 font-sans text-zinc-100">

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Tasks</h1>
          <p className="text-xs text-zinc-400 mt-1">Manage, prioritize, and track your pending and active pipelines</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/10 hover:opacity-90 transition-all duration-200"
        >
          <HiPlus className="text-sm font-bold" /> Add Task
        </button>
      </div>


      <div className="flex gap-8 border-b border-zinc-800/80 pl-1 mb-6 relative z-10">
        {["Overdue Tasks", "Due Tasks", "Upcoming Tasks", "Complete Tasks"].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`pb-3 text-xs font-medium transition-all border-b-2 -mb-[2px] ${
              activeTab === tab 
                ? "border-emerald-400 text-emerald-400" 
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>


      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl shadow-xl backdrop-blur-xl relative overflow-visible">


        <div className="p-4 flex justify-between items-center border-b border-zinc-800/80 bg-zinc-900/40 relative">
          <div className="relative w-72">
            <HiSearch className="absolute left-3.5 top-3 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10 pr-4 py-2.5 w-full bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none transition-all" 
            />
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)} 
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-medium transition-all ${
                appliedStart || appliedEnd 
                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" 
                  : "border-zinc-800 text-zinc-400 bg-zinc-950/80 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <HiFilter /> Filter {(appliedStart || appliedEnd) && "•"}
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 shadow-2xl rounded-xl z-[999] p-4 border-t-4 border-t-emerald-400">
                <div className="flex justify-between items-center mb-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  <span>Date Range</span>
                  <button onClick={() => setShowFilterDropdown(false)} className="hover:text-zinc-100 text-zinc-400"><HiX size={16}/></button>
                </div>
                <div className="space-y-4">
                  <input type="date" value={tempStart} onChange={(e) => setTempStart(e.target.value)} className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 outline-none focus:border-emerald-500/50 [color-scheme:dark]" />
                  <input type="date" value={tempEnd} onChange={(e) => setTempEnd(e.target.value)} className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 outline-none focus:border-emerald-500/50 [color-scheme:dark]" />
                  <div className="flex gap-2">
                    <button onClick={() => { setTempStart(""); setTempEnd(""); setAppliedStart(""); setAppliedEnd(""); setShowFilterDropdown(false) }} className="flex-1 py-2 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all">Clear</button>
                    <button onClick={() => { setAppliedStart(tempStart); setAppliedEnd(tempEnd); setShowFilterDropdown(false) }} className="flex-1 py-2 bg-emerald-500 text-zinc-950 text-xs font-semibold rounded-lg hover:bg-emerald-400 transition-all">Apply</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>


        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-900/60 border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Task Title</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Investor</th>
                <th className="p-4 text-center">Priority</th>
                <th className="p-4 text-center w-52">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-xs text-zinc-500">No tasks found.</td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isCompleted = task.status === "Completed";
                  return (
                    <tr key={task.id} className={`${isCompleted ? 'bg-emerald-500/5' : 'hover:bg-zinc-800/30'} transition-colors`}>
                      <td className="p-4 pl-6">
                        <div className={`text-xs font-medium ${isCompleted ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>{task.title}</div>
                        {task.description && <div className="text-[11px] text-zinc-400 font-normal max-w-xs truncate mt-0.5">{task.description}</div>}
                      </td>
                      <td className="p-4 text-xs text-zinc-400">
                        <div className="flex items-center gap-1.5"><HiCalendar className="text-zinc-500" /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}</div>
                      </td>
                      <td className="p-4 text-xs text-emerald-400 font-medium">{task.investor || "N/A"}</td>
                      <td className="p-4 text-center">
                        <span className={`text-[10px] px-2.5 py-1 rounded-md font-medium uppercase tracking-wider border ${
                          task.priority === "High" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          task.priority === "Medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>{task.priority}</span>
                      </td>

                      <td className="p-4 flex items-center justify-center gap-2">
                        <button
                          onClick={() => toggleComplete(task)}
                          title={isCompleted ? "Mark as Pending" : "Mark as Completed"}
                          className={`p-1.5 rounded-lg transition-all border ${
                            isCompleted 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                              : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-emerald-400 hover:border-emerald-400/40'
                          }`}
                        >
                          <HiCheck className="text-base" />
                        </button>

                        <button
                          onClick={() => { setEditingTask(task); setShowEditModal(true); }}
                          title="Edit Task"
                          className="p-1.5 rounded-lg bg-transparent text-zinc-500 border border-transparent hover:text-emerald-400 hover:border-zinc-800 hover:bg-zinc-800/50 transition-all"
                        >
                          <HiPencil className="text-base" />
                        </button>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete Task"
                          className="p-1.5 rounded-lg bg-transparent text-zinc-500 border border-transparent hover:text-red-400 hover:border-zinc-800 hover:bg-zinc-800/50 transition-all"
                        >
                          <HiTrash className="text-base" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>


      {showModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center z-[1000] p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h2 className="text-sm font-semibold text-zinc-100 uppercase mb-6 tracking-wide">New Task</h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <input required type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none" placeholder="Task Title" />

              <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none resize-none" placeholder="Description (Optional)" rows={2} />

              <div className="grid grid-cols-2 gap-4">
                <input required type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:border-emerald-500/50 outline-none [color-scheme:dark]" />

                <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:border-emerald-500/50 outline-none">
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>

              <div>
                <select required value={newTask.investorId} onChange={(e) => setNewTask({ ...newTask, investorId: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:border-emerald-500/50 outline-none">
                  <option value="">Select Investor</option>
                  {investors.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.firstName} {inv.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button type="submit" className="w-full py-3 bg-emerald-500 text-zinc-950 text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 transition-all">SAVE TASK</button>
                <button type="button" onClick={() => setShowModal(false)} className="w-full py-2 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors">CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center z-[1000] p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h2 className="text-sm font-semibold text-zinc-100 uppercase mb-6 tracking-wide">Edit Task</h2>
            <form onSubmit={handleEditTask} className="space-y-4">
              <input required type="text" value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none" />

              <textarea value={editingTask.description || ""} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none resize-none" rows={2} />

              <div className="grid grid-cols-2 gap-4">
                <input required type="date" value={editingTask.dueDate ? editingTask.dueDate.substring(0, 10) : ""} onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:border-emerald-500/50 outline-none [color-scheme:dark]" />

                <select value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:border-emerald-500/50 outline-none">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <select required value={editingTask.investorId || ""} onChange={(e) => setEditingTask({ ...editingTask, investorId: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:border-emerald-500/50 outline-none">
                  <option value="">Select Investor</option>
                  {investors.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.firstName} {inv.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button type="submit" className="w-full py-3 bg-emerald-500 text-zinc-950 text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 transition-all uppercase">Update Changes</button>
                <button type="button" onClick={() => { setShowEditModal(false); setEditingTask(null); }} className="w-full py-2 text-zinc-400 hover:text-zinc-200 text-xs font-medium uppercase transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}