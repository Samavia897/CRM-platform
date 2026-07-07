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
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tasks</h1>
        <button onClick={() => setShowModal(true)} className="bg-[#00388D] text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 shadow-md">
          <HiPlus /> Add Task
        </button>
      </div>

      <div className="flex border-b border-gray-200 mb-4 bg-white rounded-t shadow-sm relative z-10">
        {["Overdue Tasks", "Due Tasks", "Upcoming Tasks", "Complete Tasks"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-[12px] font-semibold transition-all ${activeTab === tab ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/10" : "text-gray-500"}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded shadow-sm relative overflow-visible">
        <div className="p-3 flex justify-between items-center border-b border-gray-100 bg-white relative">
          <div className="relative w-64">
            <HiSearch className="absolute left-3 top-2.5 text-gray-400" />
            <input type="text" placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-1.5 w-full border border-gray-200 rounded text-[13px] outline-none" />
          </div>

          <div className="relative">
            <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className={`flex items-center gap-2 px-3 py-1.5 border rounded text-[12px] font-medium transition-all ${appliedStart || appliedEnd ? "border-blue-600 text-blue-600 bg-blue-50" : "border-gray-300 text-gray-600"}`}>
              <HiFilter /> Filter {(appliedStart || appliedEnd) && "•"}
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-300 shadow-2xl rounded-xl z-[999] p-4 border-t-4 border-t-[#00388D]">
                <div className="flex justify-between items-center mb-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Date Range</span>
                  <button onClick={() => setShowFilterDropdown(false)}><HiX /></button>
                </div>
                <div className="space-y-4">
                  <input type="date" value={tempStart} onChange={(e) => setTempStart(e.target.value)} className="w-full p-2 border rounded text-xs" />
                  <input type="date" value={tempEnd} onChange={(e) => setTempEnd(e.target.value)} className="w-full p-2 border rounded text-xs" />
                  <div className="flex gap-2">
                    <button onClick={() => { setTempStart(""); setTempEnd(""); setAppliedStart(""); setAppliedEnd(""); setShowFilterDropdown(false) }} className="flex-1 py-2 text-[11px] font-bold text-red-500 bg-red-50 rounded">Clear</button>
                    <button onClick={() => { setAppliedStart(tempStart); setAppliedEnd(tempEnd); setShowFilterDropdown(false) }} className="flex-1 py-2 bg-[#00388D] text-white text-[11px] font-bold rounded">Apply Filter</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-slate-500 uppercase">
                <th className="p-4">Task Title</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Investor</th>
                <th className="p-4 text-center">Priority</th>
                <th className="p-4 text-center w-52">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTasks.map((task) => {
                const isCompleted = task.status === "Completed";
                return (
                  <tr key={task.id} className={`${isCompleted ? 'bg-green-50/40' : 'hover:bg-slate-50/50'}`}>
                    <td className="p-4">
                      <div className={`text-[13px] font-semibold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</div>
                      {task.description && <div className="text-[11px] text-gray-400 font-normal max-w-xs truncate">{task.description}</div>}
                    </td>
                    <td className="p-4 text-[13px] text-slate-600 italic">
                      <div className="flex items-center gap-1.5"><HiCalendar className="text-slate-400" /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}</div>
                    </td>
                    <td className="p-4 text-[13px] text-blue-600 font-medium">{task.investor || "N/A"}</td>
                    <td className="p-4 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${task.priority === "High" ? "bg-red-100 text-red-700" :
                          task.priority === "Medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        }`}>{task.priority}</span>
                    </td>

                    <td className="p-4 flex items-center justify-center gap-2">
                      <button
                        onClick={() => toggleComplete(task)}
                        className={`p-1.5 rounded transition-all border ${isCompleted ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-300 hover:text-green-600 hover:border-green-600'}`}
                      >
                        <HiCheck className="text-sm" />
                      </button>

                      <button
                        onClick={() => { setEditingTask(task); setShowEditModal(true); }}
                        className="p-1.5 rounded border border-gray-300 bg-white text-gray-500 hover:text-blue-600 hover:border-blue-600 transition-all"
                      >
                        <HiPencil className="text-sm" />
                      </button>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded border border-gray-300 bg-white text-gray-500 hover:text-red-600 hover:border-red-600 transition-all"
                      >
                        <HiTrash className="text-sm" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-black text-slate-800 uppercase mb-6">New Task</h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <input required type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm" placeholder="Task Title" />

              <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm" placeholder="Description (Optional)" rows={2} />

              <div className="grid grid-cols-2 gap-4">
                <input required type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm" />

                <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm bg-white">
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>

              <div>
                <select required value={newTask.investorId} onChange={(e) => setNewTask({ ...newTask, investorId: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm bg-white">
                  <option value="">Select Investor</option>
                  {investors.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.firstName} {inv.lastName}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="w-full py-3 bg-[#00388D] text-white font-black rounded-xl">SAVE TASK</button>
              <button type="button" onClick={() => setShowModal(false)} className="w-full text-slate-400 text-xs font-bold">CANCEL</button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-black text-slate-800 uppercase mb-6">Edit Task</h2>
            <form onSubmit={handleEditTask} className="space-y-4">
              <input required type="text" value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm" />

              <textarea value={editingTask.description || ""} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm" rows={2} />

              <div className="grid grid-cols-2 gap-4">
                <input required type="date" value={editingTask.dueDate ? editingTask.dueDate.substring(0, 10) : ""} onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm" />

                <select value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm bg-white">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <select required value={editingTask.investorId || ""} onChange={(e) => setEditingTask({ ...editingTask, investorId: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm bg-white">
                  <option value="">Select Investor</option>
                  {investors.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.firstName} {inv.lastName}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="w-full py-3 bg-[#00388D] text-white font-black rounded-xl uppercase">Update Changes</button>
              <button type="button" onClick={() => { setShowEditModal(false); setEditingTask(null); }} className="w-full text-slate-400 text-xs font-bold uppercase">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}