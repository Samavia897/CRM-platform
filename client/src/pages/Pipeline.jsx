import React, { useState, useEffect } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { HiPlus, HiPencilAlt, HiTrash, HiViewGridAdd, HiClock, HiX, HiMail, HiBriefcase } from "react-icons/hi";
import Swal from "sweetalert2";

const getStageColor = (stageName) => {
  const name = stageName ? stageName.toLowerCase() : "";
  if (name.includes("new") || name.includes("lead")) return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
  if (name.includes("contact") || name.includes("pitch")) return "bg-sky-50 text-sky-700 border-sky-200/60";
  if (name.includes("deck") || name.includes("review")) return "bg-amber-50 text-amber-700 border-amber-200/60";
  if (name.includes("meet") || name.includes("schedule")) return "bg-purple-50 text-purple-700 border-purple-200/60";
  if (name.includes("follow") || name.includes("close")) return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-indigo-50 text-indigo-700 border-indigo-200/60";
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
  const BASE_URL = "https://crm-backend-live-4541.onrender.com";

  useEffect(() => {
    fetchFunds();
    fetchPipelines(true);
  }, []);

  useEffect(() => {
    if (pipelines.length > 0) {
      const currentId = activePipelineId !== "" ? activePipelineId : pipelines[0].id;
      
      if (activePipelineId === "") {
        setActivePipelineId(currentId);
      }

      const currentBoard = pipelines.find((p) => String(p.id) === String(currentId));

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
      const res = await axios.get(`${BASE_URL}/api/pipelines`, {
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
      const res = await axios.get(`${BASE_URL}/api/funds`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setFunds(res.data);
    } catch (err) { console.error("Error fetching funds:", err); }
  };

  const fetchInvestors = async () => {
    try {
      const currentToken = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/api/investors`, {
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
      const response = await axios.post(`${BASE_URL}/api/pipelines`, {
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
      await axios.post(`${BASE_URL}/api/tasks`, {
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
      alert("Error: Please select a Fund.");
      return;
    }

    const currentPipelineId = activePipelineId || formData.pipelineId || (pipelines[0] && pipelines[0].id);
    const currentStatus = formData.status || (dynamicStages && dynamicStages[0]) || "New";

    const backendPayload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      jobTitle: formData.jobTitle ? formData.jobTitle.trim() : "",
      officePhone: formData.officePhone || "",
      mobilePhone: formData.mobilePhone || "",
      fundId: String(formData.fundId),
      pipelineId: String(currentPipelineId),
      status: currentStatus.trim()
    };

    try {
      const response = await axios.post(`${BASE_URL}/api/investors`, backendPayload, { headers });

      if (response.status === 201 || response.status === 200) {
        alert("New Lead Added successfully!");
        setShowAddModal(false);
        setFormData({ firstName: "", lastName: "", email: "", officePhone: "", mobilePhone: "", jobTitle: "", fundId: "", status: "" });
        fetchInvestors(); 
      }
    } catch (err) {
      console.error("Add Lead Error Detail:", err.response?.data);
      alert("Failed to add lead: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?", text: "This will remove investor and all linked tasks!", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#EF4444", confirmButtonText: "Yes, delete all!",
      cancelButtonColor: "#6B7280"
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${BASE_URL}/api/investors/${id}`, { headers });
        Swal.fire("Deleted!", "Record removed.", "success");
        fetchInvestors();
      } catch (err) { Swal.fire("Error!", "Could not delete.", "error"); }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvestor?.id) return;

    try {
      await axios.put(`${BASE_URL}/api/investors/${selectedInvestor.id}`, formData, { headers });
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
      const response = await axios.patch(
        `${BASE_URL}/api/investors/status/${draggableId}`,
        {
          status: newStage,
          pipelineId: String(activePipelineId)
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
    <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans antialiased text-slate-800">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-10 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dynamic Deal Pipelines</h1>
          <p className="text-sm text-slate-500 mt-1">Manage multiple custom workspace board layouts</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={activePipelineId}
            onChange={(e) => setActivePipelineId(e.target.value)} 
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold shadow-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
          >
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>💼 {p.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowBoardModal(true)}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-500 rounded-xl shadow-sm transition-all bg-gradient-to-b hover:from-slate-5.0"
            title="Create Custom Layout Board"
          >
            <HiPlus size={18} />
          </button>

          <button 
            onClick={() => {
              setFormData(prev => ({ ...prev, status: dynamicStages[0] || "" }));
              setShowAddModal(true);
            }} 
            className="flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-95 transition-all shadow-sm text-sm whitespace-nowrap"
          >
            <HiViewGridAdd size={18} className="opacity-90" /> New Lead
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-5 overflow-x-auto pb-6 items-start scrollbar-thin scrollbar-thumb-slate-200">
          {dynamicStages.map((stage) => {
            const filteredInvestors = investors.filter(
              inv => String(inv.pipelineId) === String(activePipelineId) && inv.status === stage
            );

            return (
              <div key={stage} className="w-[320px] shrink-0 bg-slate-50/60 rounded-2xl border border-slate-200/60 flex flex-col max-h-[80vh]">
                {/* Stage Header */}
                <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white/40 backdrop-blur-sm rounded-t-2xl">
                  <h3 className="font-semibold text-xs text-slate-700 tracking-wider uppercase truncate max-w-[200px]">{stage}</h3>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStageColor(stage)}`}>
                    {filteredInvestors.length}
                  </span>
                </div>

                {/* Droppable Stage Area */}
                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef} 
                      className={`p-3 overflow-y-auto flex-1 min-h-[450px] transition-colors rounded-b-2xl ${snapshot.isDraggingOver ? "bg-slate-100/70" : ""}`}
                    >
                      {filteredInvestors.map((inv, index) => (
                        <Draggable key={inv.id} draggableId={inv.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef} 
                              {...provided.draggableProps} 
                              {...provided.dragHandleProps}
                              className={`bg-white p-4 rounded-xl border border-slate-100 mb-3 transition-all group ${
                                snapshot.isDragging 
                                  ? "shadow-xl border-blue-500 ring-2 ring-blue-500/10 scale-[1.02] rotate-1" 
                                  : "hover:shadow-md hover:border-slate-200"
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-1">
                                  <h4 className="font-semibold text-slate-900 text-sm leading-snug">{inv.firstName} {inv.lastName}</h4>
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                    <HiBriefcase className="text-slate-400 shrink-0" size={13} />
                                    <span className="truncate max-w-[170px]">{inv.jobTitle || "Investor Lead"}</span>
                                  </div>
                                  <span className="inline-block text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded mt-1 max-w-[220px] truncate">
                                    {inv.Fund?.name || "Global Growth Fund"}
                                  </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 p-1 rounded-lg border border-slate-100 shrink-0">
                                  <button onClick={() => {
                                    setSelectedInvestor(inv);
                                    setFormData({
                                      firstName: inv.firstName, lastName: inv.lastName, email: inv.email || "",
                                      officePhone: inv.officePhone || "", mobilePhone: inv.mobilePhone || "",
                                      jobTitle: inv.jobTitle || "", fundId: inv.fundId || inv.Fund?.id || "", status: inv.status
                                    });
                                    setShowEditModal(true);
                                  }} className="p-1 text-slate-400 hover:text-amber-600 hover:bg-white rounded transition-all" title="Edit Contact">
                                    <HiPencilAlt size={15} />
                                  </button>

                                  <button onClick={() => {
                                    setSelectedInvestor(inv);
                                    setTaskTitle("");
                                    setTaskDueDate("");
                                    setTaskDescription("");
                                    setTaskPriority("Medium");
                                    setShowTaskModal(true);
                                  }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-white rounded transition-all" title="Add Task">
                                    <HiPlus size={15} />
                                  </button>

                                  <button onClick={() => handleDelete(inv.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded transition-all" title="Delete">
                                    <HiTrash size={15} />
                                  </button>
                                </div>
                              </div>

                              {/* Card Footer Contacts */}
                              {inv.email && (
                                <div className="mt-3.5 pt-2.5 border-t border-slate-50 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate">
                                  <HiMail className="text-slate-300 shrink-0" size={13} />
                                  <span className="truncate">{inv.email}</span>
                                </div>
                              )}
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

      {/* ========================================================================= */}
      {/* MODALS SECTION (Unified Premium Glassmorphism Look) */}
      {/* ========================================================================= */}

      {/* Board Management Modal */}
      {showBoardModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[120] p-4 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl w-full max-w-md transform transition-all">
            <div className="flex justify-between items-center mb-5 border-b border-slate-50 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Create Workflow Board</h2>
              <button onClick={() => setShowBoardModal(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><HiX className="text-slate-400 text-lg" /></button>
            </div>

            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 ml-0.5">Pipeline Name</label>
                <input required placeholder="e.g., Venture Capitalist Pipeline" value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 ml-0.5">Columns / Stages (Comma-Separated)</label>
                <textarea required rows={3} placeholder="Prospect, Contacted, Initial Pitch, Terms Sheet, Closed" value={newBoardStages} onChange={(e) => setNewBoardStages(e.target.value)} className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none" />
                <p className="text-[11px] text-slate-400 mt-1.5 italic ml-0.5">Separate columns with commas.</p>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full py-2.5 text-white font-semibold rounded-xl transition-all text-sm mt-2 shadow-sm ${isSubmitting ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}`}
              >
                {isSubmitting ? "Generating..." : "Generate Custom Board"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Lead Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all">
            <div className="flex justify-between items-center mb-5 border-b border-slate-50 pb-3">
              <h2 className="text-lg font-bold text-slate-900">New Lead Entry</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><HiX className="text-slate-400 text-lg" /></button>
            </div>

            <form onSubmit={handleAddNew} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Fund *</label>
                <select
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  required
                  value={formData.fundId}
                  onChange={(e) => setFormData({ ...formData, fundId: e.target.value })}
                >
                  <option value="">-- Choose a Fund --</option>
                  {funds && funds.length > 0 ? (
                    funds.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))
                  ) : (
                    <option disabled value="">No funds available</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">First Name</label>
                  <input required placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Last Name</label>
                  <input required placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Job Title</label>
                <input placeholder="Job Title" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Email Address</label>
                <input required type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Office Phone</label>
                  <input placeholder="Office Phone" value={formData.officePhone} onChange={(e) => setFormData({ ...formData, officePhone: e.target.value })} className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Mobile Phone</label>
                  <input placeholder="Mobile Phone" value={formData.mobilePhone} onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })} className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Status Column</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-xl outline-none bg-white text-sm font-medium cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                  {dynamicStages.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all text-sm shadow-sm mt-2">
                Add New Lead
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all">
            <div className="flex justify-between items-center mb-5 border-b border-slate-50 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Edit Entry</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><HiX className="text-slate-400 text-lg" /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Select Fund</label>
                <select 
                  className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-xl outline-none bg-white text-sm font-medium cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                  value={formData.fundId} 
                  onChange={(e) => setFormData({ ...formData, fundId: e.target.value })} 
                  required
                >
                  <option value="">-- Select Fund --</option>
                  {funds && funds.length > 0 && funds.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">First Name</label>
                  <input required placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Last Name</label>
                  <input required placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Job Title</label>
                <input placeholder="Job Title" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Email Address</label>
                <input required type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Office Phone</label>
                  <input placeholder="Office Phone" value={formData.officePhone} onChange={(e) => setFormData({ ...formData, officePhone: e.target.value })} className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Mobile Phone</label>
                  <input placeholder="Mobile Phone" value={formData.mobilePhone} onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })} className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Status Column</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-xl outline-none bg-white text-sm font-medium cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                  {dynamicStages.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-sm transition-all text-sm mt-2">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl w-full max-w-sm transform transition-all">
            <div className="flex justify-between items-center mb-5 border-b border-slate-50 pb-3">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Task for {selectedInvestor?.firstName}</h3>
              <button onClick={() => setShowTaskModal(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><HiX size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Task Title</label>
                <input autoFocus className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="What needs to be done?" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description (Optional)</label>
                <textarea className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none" placeholder="Enter specific task details..." value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Due Date</label>
                  <input type="date" className="w-full p-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
                  <select className="w-full p-2 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-medium" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm mt-2">Create Task</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}