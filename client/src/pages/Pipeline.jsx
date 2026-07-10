import React, { useState, useEffect } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { HiPlus, HiPencilAlt, HiTrash, HiViewGridAdd, HiClock, HiX } from "react-icons/hi";
import Swal from "sweetalert2";


const getStageColor = (stageName) => {
  const name = stageName ? stageName.toLowerCase() : "";
  if (name.includes("new") || name.includes("lead")) return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (name.includes("contact") || name.includes("pitch")) return "bg-blue-50 text-blue-600 border-blue-100";
  if (name.includes("deck") || name.includes("review")) return "bg-amber-50 text-amber-600 border-amber-100";
  if (name.includes("meet") || name.includes("schedule")) return "bg-purple-50 text-purple-600 border-purple-100";
  if (name.includes("follow") || name.includes("close")) return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-indigo-50 text-indigo-600 border-indigo-100";
};

export default function Pipeline() {
  const [investors, setInvestors] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [funds, setFunds] = useState([]);


  const [pipelines, setPipelines] = useState([]);
  const [activePipelineId, setActivePipelineId] = useState("");
  const [dynamicStages, setDynamicStages] = useState([]);


  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);

const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardStages, setNewBoardStages] = useState("");


  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskDescription, setTaskDescription] = useState("");


  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", officePhone: "",
    mobilePhone: "", jobTitle: "", fundId: "", status: ""
  });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchFunds();
    fetchPipelines(true);
  }, []);

  useEffect(() => {
  if (pipelines.length > 0) {
    const currentId = activePipelineId || pipelines[0].id;
    if (!activePipelineId) {
      setActivePipelineId(currentId);
    }

    const currentBoard = pipelines.find(
      (p) => p.id?.toString() === currentId?.toString()
    );

    if (currentBoard && currentBoard.stages) {
      const stagesArray = currentBoard.stages.split(",").map(s => s.trim());
      setDynamicStages(stagesArray);

      setFormData((prev) => ({ ...prev, status: stagesArray[0] || "" }));
    } else {
      setDynamicStages([]);
    }
    
    fetchInvestors();
  }
}, [activePipelineId, pipelines]);

  const fetchPipelines = async (setFirstActive = false) => {
    try {
      const currentToken = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/pipelines", {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setPipelines(res.data);
      if (setFirstActive && res.data.length > 0) {
        setActivePipelineId(res.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching pipeline boards:", err);
    }
  };

  const fetchFunds = async () => {
    try {
      const currentToken = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/funds", {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setFunds(res.data);
    } catch (err) { console.error("Error fetching funds:", err); }
  };

  const fetchInvestors = async () => {
    try {
      const currentToken = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/investors", {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setInvestors(res.data);
    } catch (err) { console.error("Fetch Error:", err); }
  };

 const handleCreateBoard = async (e) => {
  e.preventDefault();
  if (!newBoardName.trim() || !newBoardStages.trim() || isSubmitting) return;

  setIsSubmitting(true); 

  try {
    const response = await axios.post("http://localhost:5000/api/pipelines", {
      name: newBoardName,
      stages: newBoardStages
    }, { headers });

    if (response.status === 201 || response.status === 200) {
      Swal.fire("Success!", "New custom pipeline created.", "success");
      setNewBoardName("");
      setNewBoardStages("");
      setShowBoardModal(false);
      await fetchPipelines();
    }
  } catch (err) {
    Swal.fire("Error", "Could not create custom workflow pipeline board", "error");
  } finally {
    setIsSubmitting(false); 
  }
};

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!selectedInvestor) return;

    const actualInvestorId = selectedInvestor.id || selectedInvestor.ID || selectedInvestor.investorId;

    if (!actualInvestorId) {
      Swal.fire("Error", "Could not capture a valid Investor ID. Please try again.", "error");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/tasks", {
        title: taskTitle,
        dueDate: taskDueDate,
        priority: taskPriority || "Medium",
        description: taskDescription || null,
        investorId: actualInvestorId,
        investor: `${selectedInvestor.firstName} ${selectedInvestor.lastName || ""}`.trim(),
        status: "Pending"
      }, { headers });

      setTaskTitle("");
      setTaskDueDate("");
      setTaskDescription("");
      setTaskPriority("Medium");
      setShowTaskModal(false);
      Swal.fire({ icon: "success", title: "Task Created!", timer: 1000, showConfirmButton: false });
      fetchInvestors();
    } catch (err) {
      console.error("Task Save Fail Exception Log:", err.response?.data);
      Swal.fire("Error", err.response?.data?.error || "Could not add task from pipeline", "error");
    }
  };

  const handleAddNew = async (e) => {
  e.preventDefault();
  
  if (!formData.fundId) {
    Swal.fire("Warning", "Please select a fund first.", "warning");
    return;
  }

  // CRITICAL CHECK: Agar activePipelineId khali hai ya valid nahi hai
  if (!activePipelineId) {
    Swal.fire("Warning", "Please select a pipeline board from the dropdown first.", "warning");
    return;
  }

  try {
    await axios.post("http://localhost:5000/api/investors", {
      ...formData,
      pipelineId: Number(activePipelineId) // Ensure karein k yeh valid number ja raha hai
    }, { headers });

    setShowAddModal(false);
    setFormData({
      firstName: "", lastName: "", email: "", officePhone: "",
      mobilePhone: "", jobTitle: "", fundId: "", status: dynamicStages[0] || ""
    });
    Swal.fire("Success!", "New Lead Added directly to custom board workflow.", "success");
    fetchInvestors();
  } catch (err) {
    console.error("Add Lead Error:", err.response?.data);
    Swal.fire("Error!", err.response?.data?.error || "Add failed.", "error");
  }
};
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?", text: "This will remove investor and all linked tasks!", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Yes, delete all!"
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/tasks/investor/${id}`, { headers });
        await axios.delete(`http://localhost:5000/api/investors/${id}`, { headers });
        Swal.fire("Deleted!", "Record removed.", "success");
        fetchInvestors();
      } catch (err) { Swal.fire("Error!", "Could not delete.", "error"); }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvestor?.id) return;

    try {
      await axios.put(`http://localhost:5000/api/investors/${selectedInvestor.id}`, formData, { headers });
      Swal.fire("Success", "Updated successfully!", "success");
      setShowEditModal(false);
      fetchInvestors();
    } catch (err) {
      console.error("Update Error Log:", err.response?.data);
      Swal.fire("Update Failed", err.response?.data?.error || "Check data constraints.", "error");
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    try {
      const newStage = destination.droppableId;

      const response = await axios.post(
        "http://localhost:5000/api/pipelines/move",
        {
          investorId: draggableId,
          pipelineId: parseInt(activePipelineId, 10),
          newStage: newStage
        },
        { headers }
      );

      if (response.status === 200 || response.status === 201) {
        fetchInvestors();
      }
    } catch (err) {
      console.error("❌ Drag Drop Sync Error:", err.response?.data);
      Swal.fire({
        icon: 'error',
        title: 'Move Failed',
        text: err.response?.data?.error || 'Could not save the new pipeline stage'
      });
      fetchInvestors();
    }
  };

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-screen font-sans">

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-[#001f3f] tracking-tight">Dynamic Deal Pipelines</h1>
          <p className="text-xs text-gray-500 mt-1">Manage multiple custom workspace board layouts</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={activePipelineId}
            onChange={(e) => setActivePipelineId(Number(e.target.value))}
            className="p-2.5 border border-gray-200 bg-white text-gray-700 font-semibold rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer"
          >
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>💼 {p.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowBoardModal(true)}
            className="p-2.5 bg-white border border-gray-200 hover:border-blue-500 text-blue-600 rounded-lg shadow-sm transition-colors"
            title="Create Custom Layout Board"
          >
            <HiPlus size={18} />
          </button>

          <button 
  onClick={() => {
    setFormData(prev => ({ ...prev, status: dynamicStages[0] || "" }));
    setShowAddModal(true);
  }} 
  className="flex items-center gap-2 bg-[#001f3f] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-950 transition-all shadow-md text-sm whitespace-nowrap"
>
  <HiViewGridAdd size={19} /> New Lead
</button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-6">
          {dynamicStages.map((stage) => {
            const filteredInvestors = investors.filter(
              inv => Number(inv.pipelineId) === Number(activePipelineId) && inv.status === stage
            );

            return (
              <div key={stage} className="min-w-[310px] max-w-[310px] bg-white rounded-xl border border-gray-100 flex flex-col h-fit shadow-lg shadow-gray-100/50">
                <div className="p-4 border-b border-gray-50 flex items-center gap-2.5">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${getStageColor(stage)}`}>
                    {filteredInvestors.length}
                  </span>
                  <h3 className="font-bold text-[14px] text-gray-700 tracking-tight uppercase">{stage}</h3>
                </div>

                <Droppable droppableId={stage}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="p-2 min-h-[500px]">
                      {filteredInvestors.map((inv, index) => (
                        <Draggable key={inv.id} draggableId={inv.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              className={`bg-white p-4 rounded-lg border border-gray-200 mb-3 transition-all group ${snapshot.isDragging ? "shadow-2xl border-blue-400 scale-105 z-50" : "hover:border-gray-300 shadow-sm"}`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-[#001f3f] text-[15px] leading-tight">{inv.firstName} {inv.lastName}</h4>
                                  <p className="text-[12px] text-gray-400 font-medium mt-0.5">{inv.jobTitle || "Investor Lead"}</p>
                                  <p className="text-[11px] text-gray-500 mt-1">{inv.Fund?.name || "Global Growth Fund"}</p>
                                </div>

                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-md">
                                  <button onClick={() => {
                                    setSelectedInvestor(inv);
                                    setFormData({
                                      firstName: inv.firstName, lastName: inv.lastName, email: inv.email || "",
                                      officePhone: inv.officePhone || "", mobilePhone: inv.mobilePhone || "",
                                      jobTitle: inv.jobTitle || "", fundId: inv.fundId || inv.Fund?.id || "", status: inv.status
                                    });
                                    setShowEditModal(true);
                                  }} className="p-1 text-gray-400 hover:text-amber-500"><HiPencilAlt size={16} /></button>

                                  <button onClick={() => {
                                    setSelectedInvestor(inv);
                                    setTaskTitle("");
                                    setTaskDueDate("");
                                    setTaskDescription("");
                                    setShowTaskModal(true);
                                  }} className="p-1 text-gray-400 hover:text-emerald-500"><HiPlus size={16} /></button>

                                  <button onClick={() => handleDelete(inv.id)} className="p-1 text-gray-400 hover:text-red-500"><HiTrash size={16} /></button>
                                </div>
                              </div>

                              <div className="mt-4 flex flex-col gap-2 border-t border-gray-50 pt-3">
                                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                  <HiClock size={12} /> {inv.email}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {showBoardModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[120] p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Create Workflow Board</h2>
              <button onClick={() => setShowBoardModal(false)}><HiX className="text-gray-400 text-xl" /></button>
            </div>

            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Pipeline Name</label>
                <input required placeholder="e.g., Venture Capitalist Pipeline" value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} className="w-full mt-1 p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Columns / Stages (Comma-Separated)</label>
                <textarea required rows={3} placeholder="Prospect, Contacted, Initial Pitch, Terms Sheet, Closed" value={newBoardStages} onChange={(e) => setNewBoardStages(e.target.value)} className="w-full mt-1 p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                <p className="text-[11px] text-gray-400 mt-1 italic ml-1">Separate columns with commas. You can add as many as you like!</p>
              </div>
              <button 
  type="submit" 
  disabled={isSubmitting}
  className={`w-full py-4 text-white font-bold rounded-2xl shadow-xl transition-all uppercase text-xs tracking-widest mt-4 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
>
  {isSubmitting ? "Generating..." : "Generate Custom Board"}
</button>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">New Lead Entry</h2>
              <button onClick={() => setShowAddModal(false)}><HiX className="text-gray-400 text-xl" /></button>
            </div>

            <form onSubmit={handleAddNew} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Select Fund</label>
                <select className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm font-semibold" value={formData.fundId} onChange={(e) => setFormData({ ...formData, fundId: e.target.value })} required>
                  <option value="">-- Select Fund --</option>
                  {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <input required placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <input placeholder="Job Title" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <input required type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />

              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Office Phone" value={formData.officePhone} onChange={(e) => setFormData({ ...formData, officePhone: e.target.value })} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <input placeholder="Mobile Phone" value={formData.mobilePhone} onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Status Column</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full mt-1 p-3 border border-slate-200 rounded-xl outline-none bg-slate-50 text-sm font-semibold">
                  {dynamicStages.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full py-4 bg-[#001f3f] text-white font-bold rounded-2xl shadow-xl hover:bg-blue-950 transition-all uppercase text-xs tracking-widest mt-4">
                Add New Lead
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Edit Entry</h2>
              <button onClick={() => setShowEditModal(false)}><HiX className="text-gray-400 text-xl" /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Select Fund</label>
                <select className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm font-semibold" value={formData.fundId} onChange={(e) => setFormData({ ...formData, fundId: e.target.value })} required>
                  <option value="">-- Select Fund --</option>
                  {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <input required placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <input placeholder="Job Title" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <input required type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />

              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Office Phone" value={formData.officePhone} onChange={(e) => setFormData({ ...formData, officePhone: e.target.value })} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <input placeholder="Mobile Phone" value={formData.mobilePhone} onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Status Column</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full mt-1 p-3 border border-slate-200 rounded-xl outline-none bg-slate-50 text-sm font-semibold">
                  {dynamicStages.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full py-4 bg-amber-500 text-white font-bold rounded-2xl shadow-xl hover:bg-amber-600 transition-all uppercase text-xs tracking-widest mt-4">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[110]">
          <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-[#001f3f] text-sm uppercase tracking-wide">Add Task for {selectedInvestor?.firstName}</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-gray-600"><HiX size={18} /></button>
            </div>
            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-1">Task Title</label>
                <input autoFocus className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="What needs to be done?" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-1">Description (Optional)</label>
                <textarea className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Enter specific task details here..." value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-1">Due Date</label>
                  <input type="date" className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-1">Priority</label>
                  <select className="w-full p-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-[#001f3f] hover:bg-blue-950 text-white py-2.5 rounded-lg font-bold text-sm transition-colors shadow-md mt-2">Create Task</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}