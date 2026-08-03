import React, { useState, useEffect } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { HiPlus, HiPencilAlt, HiTrash, HiViewGridAdd, HiClock, HiX, HiUser, HiOfficeBuilding, HiMail } from "react-icons/hi";
import Swal from "sweetalert2";

const getStageColor = (stageName) => {
  const name = stageName ? stageName.toLowerCase() : "";
  if (name.includes("new") || name.includes("lead")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (name.includes("contact") || name.includes("pitch")) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  if (name.includes("deck") || name.includes("review")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (name.includes("meet") || name.includes("schedule")) return "bg-purple-500/10 text-purple-400 border-purple-500/20";
  if (name.includes("follow") || name.includes("close")) return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
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
      showCancelButton: true, confirmButtonColor: "#3b82f6", cancelButtonColor: "#ef4444", confirmButtonText: "Yes, delete all!"
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
    <div className="p-2 relative z-10 font-sans text-slate-300">

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Dynamic Deal Pipelines</h1>
          <p className="text-xs text-slate-400 mt-1">Manage multiple custom workspace board layouts</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={activePipelineId}
            onChange={(e) => setActivePipelineId(e.target.value)} 
            className="px-4 py-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            {pipelines.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#0f172a]">💼 {p.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowBoardModal(true)}
            className="p-2.5 bg-[#131c35]/80 border border-slate-700 hover:border-blue-500 text-blue-400 rounded-xl shadow-md transition-all active:scale-95"
            title="Create Custom Layout Board"
          >
            <HiPlus size={18} />
          </button>

          <button 
            onClick={() => {
              setFormData(prev => ({ ...prev, status: dynamicStages[0] || "" }));
              setShowAddModal(true);
            }} 
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/10 whitespace-nowrap active:scale-95"
          >
            <HiViewGridAdd size={16} /> New Lead
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-800">
          {dynamicStages.map((stage) => {
            const filteredInvestors = investors.filter(
              inv => String(inv.pipelineId) === String(activePipelineId) && inv.status === stage
            );

            return (
              <div key={stage} className="min-w-[310px] max-w-[310px] bg-[#131c35]/70 border border-slate-800/80 rounded-2xl flex flex-col h-fit shadow-xl backdrop-blur-xl">

                <div className="p-4 border-b border-slate-800/60 flex items-center gap-2.5 bg-[#11192e]/40 rounded-t-2xl">
                  <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-md uppercase tracking-wider ${getStageColor(stage)}`}>
                    {filteredInvestors.length}
                  </span>
                  <h3 className="font-bold text-[12px] text-white tracking-wider uppercase truncate">{stage}</h3>
                </div>

                <Droppable droppableId={stage}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="p-3 min-h-[500px] space-y-3">
                      {filteredInvestors.map((inv, index) => (
                        <Draggable key={inv.id} draggableId={inv.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              className={`bg-[#0f172a]/90 p-4 rounded-xl border mb-2 transition-all group relative ${snapshot.isDragging ? "shadow-2xl border-blue-500 scale-102 bg-[#11192e]" : "border-slate-800 hover:border-slate-700 shadow-sm"}`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="space-y-1 max-w-[80%]">
                                  <h4 className="font-bold text-white text-sm tracking-tight leading-snug flex items-center gap-1.5">
                                    <HiUser className="text-slate-500 flex-shrink-0" size={13} />
                                    {inv.firstName} {inv.lastName}
                                  </h4>
                                  <p className="text-[11px] text-slate-400 font-medium truncate">{inv.jobTitle || "Investor Lead"}</p>
                                  <p className="text-[10px] text-blue-400/90 font-semibold flex items-center gap-1 mt-1 bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded-md w-fit">
                                    <HiOfficeBuilding size={11} className="text-blue-500" />
                                    {inv.Fund?.name || "Global Growth Fund"}
                                  </p>
                                </div>

                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3 bg-[#131c35] border border-slate-800 p-1 rounded-lg shadow-xl">
                                  <button onClick={() => {
                                    setSelectedInvestor(inv);
                                    setFormData({
                                      firstName: inv.firstName, lastName: inv.lastName, email: inv.email || "",
                                      officePhone: inv.officePhone || "", mobilePhone: inv.mobilePhone || "",
                                      jobTitle: inv.jobTitle || "", fundId: inv.fundId || inv.Fund?.id || "", status: inv.status
                                    });
                                    setShowEditModal(true);
                                  }} className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-all" title="Edit Lead"><HiPencilAlt size={14} /></button>

                                  <button onClick={() => {
                                    setSelectedInvestor(inv);
                                    setTaskTitle("");
                                    setTaskDueDate("");
                                    setTaskDescription("");
                                    setTaskPriority("Medium");
                                    setShowTaskModal(true);
                                  }} className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-all" title="Link Task"><HiPlus size={14} /></button>

                                  <button onClick={() => handleDelete(inv.id)} className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-all" title="Delete"><HiTrash size={14} /></button>
                                </div>
                              </div>

                              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500 border-t border-slate-800/60 pt-2.5 truncate">
                                <HiMail size={12} className="text-slate-600 flex-shrink-0" /> {inv.email}
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
        <div className="fixed inset-0 bg-[#060b19]/60 backdrop-blur-sm flex justify-center items-center z-[120] p-4">
          <div className="bg-[#131c35] border border-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Create Workflow Board</h2>
                <p className="text-slate-500 text-[10px] mt-0.5">Configure comma-separated dynamic tracking fields.</p>
              </div>
              <button onClick={() => setShowBoardModal(false)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg"><HiX size={18} /></button>
            </div>

            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pipeline Name</label>
                <input required placeholder="e.g., Venture Capitalist Pipeline" value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Columns / Stages (Comma-Separated)</label>
                <textarea required rows={3} placeholder="Prospect, Contacted, Initial Pitch, Terms Sheet, Closed" value={newBoardStages} onChange={(e) => setNewBoardStages(e.target.value)} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none resize-none" />
                <p className="text-[10px] text-slate-500 italic mt-1">Separate columns with commas. Instantiates clean state tracking indexes.</p>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full py-3 text-white font-bold rounded-xl shadow-xl transition-all uppercase text-xs tracking-wider mt-4 ${isSubmitting ? 'bg-slate-700 cursor-not-allowed text-slate-400' : 'bg-blue-600 hover:bg-blue-500'}`}
              >
                {isSubmitting ? "Generating..." : "Generate Custom Board"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-[#060b19]/60 backdrop-blur-sm flex justify-center items-center z-[110] p-4">
          <div className="bg-[#131c35] border border-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">New Lead Entry</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg"><HiX size={18} /></button>
            </div>

            <form onSubmit={handleAddNew} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Select Fund *</label>
                <select
                  className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-blue-500 transition-all cursor-pointer"
                  required
                  value={formData.fundId}
                  onChange={(e) => setFormData({ ...formData, fundId: e.target.value })}
                >
                  <option value="" className="bg-[#0f172a]">-- Choose a Fund --</option>
                  {funds && funds.length > 0 ? (
                    funds.map((f) => (
                      <option key={f.id} value={f.id} className="bg-[#0f172a]">{f.name}</option>
                    ))
                  ) : (
                    <option disabled value="" className="bg-[#0f172a]">No funds available</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none" />
                <input required placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none" />
              </div>

              <input placeholder="Job Title" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none" />
              <input required type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none" />

              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Office Phone" value={formData.officePhone} onChange={(e) => setFormData({ ...formData, officePhone: e.target.value })} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none" />
                <input placeholder="Mobile Phone" value={formData.mobilePhone} onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status Column</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 outline-none cursor-pointer">
                  {dynamicStages.map(st => <option key={st} value={st} className="bg-[#0f172a]">{st}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-500 transition-all uppercase text-xs tracking-wider mt-4">
                Add New Lead
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-[#060b19]/60 backdrop-blur-sm flex justify-center items-center z-[110] p-4">
          <div className="bg-[#131c35] border border-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Edit Entry</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg"><HiX size={18} /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Select Fund</label>
                <select 
                  className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-blue-500 cursor-pointer" 
                  value={formData.fundId} 
                  onChange={(e) => setFormData({ ...formData, fundId: e.target.value })} 
                  required
                >
                  <option value="" className="bg-[#0f172a]">-- Select Fund --</option>
                  {funds && funds.length > 0 && funds.map(f => (
                    <option key={f.id} value={f.id} className="bg-[#0f172a]">{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none" />
                <input required placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none" />
              </div>

              <input placeholder="Job Title" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none" />
              <input required type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none" />

              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Office Phone" value={formData.officePhone} onChange={(e) => setFormData({ ...formData, officePhone: e.target.value })} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none" />
                <input placeholder="Mobile Phone" value={formData.mobilePhone} onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status Column</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 outline-none cursor-pointer">
                  {dynamicStages.map(st => <option key={st} value={st} className="bg-[#0f172a]">{st}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg hover:bg-amber-600 transition-all uppercase text-xs tracking-wider mt-4">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-[#060b19]/60 backdrop-blur-sm flex justify-center items-center z-[110]">
          <div className="bg-[#131c35] border border-slate-800 p-6 rounded-2xl w-96 shadow-2xl">
            <div className="flex justify-between items-center mb-5 border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-xs uppercase tracking-wide truncate">Add Task for {selectedInvestor?.firstName}</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg"><HiX size={18} /></button>
            </div>
            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Task Title</label>
                <input autoFocus className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none" placeholder="What needs to be done?" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description (Optional)</label>
                <textarea className="w-full p-2.5 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none resize-none" placeholder="Enter specific task details..." value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Due Date</label>
                  <input type="date" className="w-full p-2 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none cursor-pointer" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Priority</label>
                  <select className="w-full p-2 bg-[#0f172a]/90 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none cursor-pointer" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                    <option value="Low" className="bg-[#0f172a]">Low</option>
                    <option value="Medium" className="bg-[#0f172a]">Medium</option>
                    <option value="High" className="bg-[#0f172a]">High</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md mt-2">Create Task</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}