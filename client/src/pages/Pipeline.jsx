import React, { useState, useEffect } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  HiPlus, 
  HiPencilAlt, 
  HiTrash, 
  HiViewGridAdd, 
  HiX, 
  HiUser, 
  HiOfficeBuilding, 
  HiMail,
  HiBriefcase,
  HiChevronDown
} from "react-icons/hi";
import Swal from "sweetalert2";

const getStageBadgeStyle = (stageName) => {
  const name = stageName ? stageName.toLowerCase() : "";
  if (name.includes("new") || name.includes("lead")) 
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (name.includes("contact") || name.includes("pitch")) 
    return "bg-teal-500/10 text-teal-400 border-teal-500/20";
  if (name.includes("deck") || name.includes("review")) 
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (name.includes("meet") || name.includes("schedule")) 
    return "bg-purple-500/10 text-purple-400 border-purple-500/20";
  if (name.includes("follow") || name.includes("close")) 
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
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
        Swal.fire({
          icon: "success",
          title: "Created!",
          text: "New custom pipeline created.",
          background: "#0d131a",
          color: "#fff"
        });
        setNewBoardName("");
        setNewBoardStages("");
        setShowBoardModal(false);
        await fetchPipelines();
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not create custom workflow pipeline board",
        background: "#0d131a",
        color: "#fff"
      });
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
      Swal.fire({ icon: "success", title: "Task Created!", timer: 1000, showConfirmButton: false, background: "#0d131a", color: "#fff" });
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
      title: "Are you sure?", 
      text: "This will remove investor and all linked tasks!", 
      icon: "warning",
      showCancelButton: true, 
      confirmButtonColor: "#10b981", 
      cancelButtonColor: "#ef4444", 
      confirmButtonText: "Yes, delete all!",
      background: "#0d131a",
      color: "#fff"
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${BASE_URL}/api/investors/${id}`, { headers });
        Swal.fire({ title: "Deleted!", text: "Record removed.", icon: "success", background: "#0d131a", color: "#fff" });
        fetchInvestors();
      } catch (err) { Swal.fire({ title: "Error!", text: "Could not delete.", icon: "error", background: "#0d131a", color: "#fff" }); }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvestor?.id) return;

    try {
      await axios.put(`${BASE_URL}/api/investors/${selectedInvestor.id}`, formData, { headers });
      Swal.fire({ title: "Success", text: "Updated successfully!", icon: "success", background: "#0d131a", color: "#fff" });
      setShowEditModal(false);
      fetchInvestors();
    } catch (err) {
      console.error("Update Error Log:", err.response?.data);
      Swal.fire({ title: "Update Failed", text: err.response?.data?.error || "Check data constraints.", icon: "error", background: "#0d131a", color: "#fff" });
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
        text: err.response?.data?.error || 'Could not save the new pipeline stage',
        background: "#0d131a",
        color: "#fff"
      });
      fetchInvestors();
    }
  };

  return (
    <div className="p-4 relative z-10 font-sans text-slate-300 bg-[#070a0f] min-h-screen">

      {/* Header Matching Emerald Theme */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 bg-[#0f171c]/90 p-6 rounded-2xl border border-emerald-950/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <HiBriefcase size={22} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Dynamic Deal Pipelines
            </h1>
          </div>
          <p className="text-xs text-slate-400 pl-12 font-medium">Manage dynamic stage workflows & active investor pipeline leads</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="relative">
            <select
              value={activePipelineId}
              onChange={(e) => setActivePipelineId(e.target.value)} 
              className="appearance-none pl-4 pr-10 py-2.5 bg-[#0d1418] border border-emerald-900/40 hover:border-emerald-500/40 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all cursor-pointer"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0d1418] text-slate-200">💼 {p.name}</option>
              ))}
            </select>
            <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>

          <button
            onClick={() => setShowBoardModal(true)}
            className="p-2.5 bg-[#0d1418] border border-emerald-900/40 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400 rounded-xl transition-all active:scale-95 flex items-center justify-center"
            title="Create Custom Layout Board"
          >
            <HiPlus size={18} />
          </button>

          <button 
            onClick={() => {
              setFormData(prev => ({ ...prev, status: dynamicStages[0] || "" }));
              setShowAddModal(true);
            }} 
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 active:scale-95 border border-emerald-400/20"
          >
            <HiViewGridAdd size={16} /> Add Lead
          </button>
        </div>
      </div>

      {/* Columns */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-emerald-950 scrollbar-track-transparent">
          {dynamicStages.map((stage) => {
            const filteredInvestors = investors.filter(
              inv => String(inv.pipelineId) === String(activePipelineId) && inv.status === stage
            );

            return (
              <div 
                key={stage} 
                className="min-w-[320px] max-w-[320px] bg-[#0c1217]/80 border border-emerald-950/50 rounded-2xl flex flex-col h-fit shadow-2xl backdrop-blur-xl transition-all"
              >
                {/* Header */}
                <div className="p-4 border-b border-emerald-950/60 flex items-center justify-between bg-[#111920]/40 rounded-t-2xl">
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500"></span>
                    <h3 className="font-bold text-xs text-slate-200 tracking-wider uppercase truncate">{stage}</h3>
                  </div>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 border rounded-lg uppercase tracking-wider ${getStageBadgeStyle(stage)}`}>
                    {filteredInvestors.length}
                  </span>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={stage}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="p-3 min-h-[500px] space-y-3">
                      {filteredInvestors.map((inv, index) => (
                        <Draggable key={inv.id} draggableId={inv.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef} 
                              {...provided.draggableProps} 
                              {...provided.dragHandleProps}
                              className={`bg-[#111921] p-4 rounded-xl border transition-all group relative ${
                                snapshot.isDragging 
                                  ? "shadow-2xl shadow-emerald-500/20 border-emerald-500 scale-[1.02]" 
                                  : "border-emerald-950/40 hover:border-emerald-700/50 hover:bg-[#151e27]"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="space-y-1.5 max-w-[85%]">
                                  <h4 className="font-bold text-white text-sm tracking-tight leading-snug flex items-center gap-2">
                                    <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                                      <HiUser size={13} />
                                    </span>
                                    {inv.firstName} {inv.lastName}
                                  </h4>
                                  <p className="text-[11px] text-slate-400 font-medium truncate pl-0.5">{inv.jobTitle || "Investor Lead"}</p>
                                  
                                  <div className="pt-1">
                                    <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                                      <HiOfficeBuilding size={12} className="text-emerald-400" />
                                      {inv.Fund?.name || "Global Fund"}
                                    </span>
                                  </div>
                                </div>

                                {/* Hover Controls */}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3 bg-[#0d1418] border border-emerald-900/40 p-1 rounded-xl shadow-xl">
                                  <button onClick={() => {
                                    setSelectedInvestor(inv);
                                    setFormData({
                                      firstName: inv.firstName, lastName: inv.lastName, email: inv.email || "",
                                      officePhone: inv.officePhone || "", mobilePhone: inv.mobilePhone || "",
                                      jobTitle: inv.jobTitle || "", fundId: inv.fundId || inv.Fund?.id || "", status: inv.status
                                    });
                                    setShowEditModal(true);
                                  }} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-all" title="Edit Lead"><HiPencilAlt size={14} /></button>

                                  <button onClick={() => {
                                    setSelectedInvestor(inv);
                                    setTaskTitle("");
                                    setTaskDueDate("");
                                    setTaskDescription("");
                                    setTaskPriority("Medium");
                                    setShowTaskModal(true);
                                  }} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-all" title="Link Task"><HiPlus size={14} /></button>

                                  <button onClick={() => handleDelete(inv.id)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all" title="Delete"><HiTrash size={14} /></button>
                                </div>
                              </div>

                              {/* Email */}
                              <div className="mt-3.5 flex items-center gap-2 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2.5 truncate">
                                <HiMail size={13} className="text-slate-500 flex-shrink-0" /> 
                                <span className="truncate">{inv.email}</span>
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

      {/* Create Board Modal */}
      {showBoardModal && (
        <div className="fixed inset-0 bg-[#030508]/85 backdrop-blur-md flex justify-center items-center z-[120] p-4">
          <div className="bg-[#0f171c] border border-emerald-950 p-6 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-5 border-b border-emerald-950 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Create Custom Board</h2>
                <p className="text-slate-400 text-[11px] mt-0.5">Define custom columns separated by commas.</p>
              </div>
              <button onClick={() => setShowBoardModal(false)} className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-all"><HiX size={18} /></button>
            </div>

            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pipeline Title</label>
                <input required placeholder="e.g. Angel Investor Stage" value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workflow Stages (Comma Separated)</label>
                <textarea required rows={3} placeholder="Initial Contact, Pitch Deck Sent, Meeting, Won" value={newBoardStages} onChange={(e) => setNewBoardStages(e.target.value)} className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none resize-none transition-all" />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition-all uppercase text-xs tracking-wider mt-4 ${isSubmitting ? 'bg-slate-800 text-slate-500' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'}`}
              >
                {isSubmitting ? "Creating..." : "Save Pipeline"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#030508]/85 backdrop-blur-md flex justify-center items-center z-[110] p-4">
          <div className="bg-[#0f171c] border border-emerald-950 p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 border-b border-emerald-950 pb-3">
              <h2 className="text-base font-bold text-white">Add New Lead</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-all"><HiX size={18} /></button>
            </div>

            <form onSubmit={handleAddNew} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Fund *</label>
                <select
                  className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all cursor-pointer"
                  required
                  value={formData.fundId}
                  onChange={(e) => setFormData({ ...formData, fundId: e.target.value })}
                >
                  <option value="" className="bg-[#090d12]">-- Select Fund --</option>
                  {funds && funds.map((f) => (
                    <option key={f.id} value={f.id} className="bg-[#090d12]">{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all" />
                <input required placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all" />
              </div>

              <input placeholder="Job Title" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all" />
              <input required type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all" />

              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Office Phone" value={formData.officePhone} onChange={(e) => setFormData({ ...formData, officePhone: e.target.value })} className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all" />
                <input placeholder="Mobile Phone" value={formData.mobilePhone} onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })} className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Initial Stage Column</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-xs font-semibold text-slate-200 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500/40 transition-all">
                  {dynamicStages.map(st => <option key={st} value={st} className="bg-[#090d12]">{st}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transition-all uppercase text-xs tracking-wider mt-4">
                Submit Lead
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-[#030508]/85 backdrop-blur-md flex justify-center items-center z-[110] p-4">
          <div className="bg-[#0f171c] border border-emerald-950 p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 border-b border-emerald-950 pb-3">
              <h2 className="text-base font-bold text-white">Edit Lead Profile</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-all"><HiX size={18} /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Fund</label>
                <select 
                  className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all cursor-pointer" 
                  value={formData.fundId} 
                  onChange={(e) => setFormData({ ...formData, fundId: e.target.value })} 
                  required
                >
                  <option value="" className="bg-[#090d12]">-- Select Fund --</option>
                  {funds && funds.map(f => (
                    <option key={f.id} value={f.id} className="bg-[#090d12]">{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all" />
                <input required placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all" />
              </div>

              <input placeholder="Job Title" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all" />
              <input required type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all" />

              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Office Phone" value={formData.officePhone} onChange={(e) => setFormData({ ...formData, officePhone: e.target.value })} className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all" />
                <input placeholder="Mobile Phone" value={formData.mobilePhone} onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })} className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Stage</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-xs font-semibold text-slate-200 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500/40 transition-all">
                  {dynamicStages.map(st => <option key={st} value={st} className="bg-[#090d12]">{st}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg transition-all uppercase text-xs tracking-wider mt-4">
                Update Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-[#030508]/85 backdrop-blur-md flex justify-center items-center z-[110] p-4">
          <div className="bg-[#0f171c] border border-emerald-950 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-5 border-b border-emerald-950 pb-3">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider truncate">Add Task for {selectedInvestor?.firstName}</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-all"><HiX size={18} /></button>
            </div>
            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task Title</label>
                <input autoFocus className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all" placeholder="Action item title..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea className="w-full p-3 bg-[#090d12] border border-emerald-900/40 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none resize-none transition-all" placeholder="Details..." value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</label>
                  <input type="date" className="w-full p-2.5 bg-[#090d12] border border-emerald-900/40 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none cursor-pointer transition-all" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
                  <select className="w-full p-2.5 bg-[#090d12] border border-emerald-900/40 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none cursor-pointer transition-all" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                    <option value="Low" className="bg-[#090d12]">Low</option>
                    <option value="Medium" className="bg-[#090d12]">Medium</option>
                    <option value="High" className="bg-[#090d12]">High</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all mt-2">Save Task</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}