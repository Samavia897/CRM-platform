import React, { useState, useEffect } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiX, 
  HiUser, 
  HiOfficeBuilding, 
  HiMail,
  HiBriefcase,
  HiChevronDown,
  HiCalendar
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
          timer: 1000,
          showConfirmButton: false,
          background: "#09090b",
          color: "#f43f5e"
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
        background: "#09090b",
        color: "#f43f5e"
      });
    } fontFinally {
      setIsSubmitting(false); 
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!selectedInvestor) return;

    const actualInvestorId = selectedInvestor.id || selectedInvestor.ID || selectedInvestor.investorId;

    if (!actualInvestorId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not capture a valid Investor ID. Please try again.",
        background: "#09090b",
        color: "#f43f5e"
      });
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
      Swal.fire({ 
        icon: "success", 
        title: "Task Created!", 
        timer: 1000, 
        showConfirmButton: false, 
        background: "#09090b", 
        color: "#f43f5e" 
      });
      fetchInvestors();
    } catch (err) {
      console.error("Task Save Fail Exception Log:", err.response?.data);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.error || "Could not add task from pipeline",
        background: "#09090b",
        color: "#f43f5e"
      });
    }
  };

  const handleAddNew = async (e) => {
    e.preventDefault();

    if (!formData.fundId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a Fund.",
        background: "#09090b",
        color: "#f43f5e"
      });
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
        Swal.fire({
          icon: "success",
          title: "Lead Added!",
          timer: 1000,
          showConfirmButton: false,
          background: "#09090b",
          color: "#f43f5e"
        });
        setShowAddModal(false);
        setFormData({ firstName: "", lastName: "", email: "", officePhone: "", mobilePhone: "", jobTitle: "", fundId: "", status: "" });
        fetchInvestors(); 
      }
    } catch (err) {
      console.error("Add Lead Error Detail:", err.response?.data);
      Swal.fire({
        icon: "error",
        title: "Failed to add lead",
        text: err.response?.data?.error || err.message,
        background: "#09090b",
        color: "#f43f5e"
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?", 
      text: "This will remove investor and all linked tasks!", 
      icon: "warning",
      showCancelButton: true, 
      confirmButtonColor: "#10b981", 
      cancelButtonColor: "#f43f5e", 
      confirmButtonText: "Yes, delete all!",
      background: "#09090b",
      color: "#f43f5e"
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${BASE_URL}/api/investors/${id}`, { headers });
        Swal.fire({ 
          title: "Deleted!", 
          text: "Record removed.", 
          icon: "success", 
          background: "#09090b", 
          color: "#f43f5e" 
        });
        fetchInvestors();
      } catch (err) { 
        Swal.fire({ 
          title: "Error!", 
          text: "Could not delete.", 
          icon: "error", 
          background: "#09090b", 
          color: "#f43f5e" 
        }); 
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvestor?.id) return;

    try {
      await axios.put(`${BASE_URL}/api/investors/${selectedInvestor.id}`, formData, { headers });
      Swal.fire({ 
        title: "Success", 
        text: "Updated successfully!", 
        icon: "success", 
        background: "#09090b", 
        color: "#f43f5e" 
      });
      setShowEditModal(false);
      fetchInvestors();
    } catch (err) {
      console.error("Update Error Log:", err.response?.data);
      Swal.fire({ 
        title: "Update Failed", 
        text: err.response?.data?.error || "Check data constraints.", 
        icon: "error", 
        background: "#09090b", 
        color: "#f43f5e" 
      });
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
        icon: "error",
        title: "Move Failed",
        text: err.response?.data?.error || "Could not save the new pipeline stage",
        background: "#09090b",
        color: "#f43f5e"
      });
      fetchInvestors();
    }
  };

  return (
    <div className="bg-zinc-950 min-h-screen p-6 font-sans text-zinc-100">

      {/* Header Matching Zinc-950/Zinc-900 Emerald Theme */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <HiBriefcase className="text-emerald-400" size={24} />
            Pipelines
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Manage dynamic stage workflows & active investor pipeline leads</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={activePipelineId}
              onChange={(e) => setActivePipelineId(e.target.value)} 
              className="appearance-none pl-4 pr-10 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-100 outline-none focus:border-emerald-500/50 transition-all cursor-pointer"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-950 text-zinc-100">{p.name}</option>
              ))}
            </select>
            <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
          </div>

          <button
            onClick={() => setShowBoardModal(true)}
            className="p-2.5 bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-400 rounded-xl transition-all active:scale-95 flex items-center justify-center"
            title="Create Custom Board"
          >
            <HiPlus size={16} />
          </button>

          <button 
            onClick={() => {
              setFormData(prev => ({ ...prev, status: dynamicStages[0] || "" }));
              setShowAddModal(true);
            }} 
            className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/10 hover:opacity-90 transition-all duration-200"
          >
            <HiPlus className="text-sm font-bold" /> Add Lead
          </button>
        </div>
      </div>

      {/* Columns */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {dynamicStages.map((stage) => {
            const filteredInvestors = investors.filter(
              inv => String(inv.pipelineId) === String(activePipelineId) && inv.status === stage
            );

            return (
              <div 
                key={stage} 
                className="min-w-[320px] max-w-[320px] bg-zinc-900/80 border border-zinc-800/80 rounded-2xl flex flex-col h-fit shadow-xl backdrop-blur-xl transition-all"
              >
                {/* Header */}
                <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40 rounded-t-2xl">
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50"></span>
                    <h3 className="font-bold text-xs text-zinc-100 tracking-wider uppercase truncate">{stage}</h3>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-md font-medium uppercase tracking-wider border ${getStageBadgeStyle(stage)}`}>
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
                              className={`bg-zinc-950/80 p-4 rounded-xl border transition-all group relative ${
                                snapshot.isDragging 
                                  ? "shadow-2xl shadow-emerald-500/10 border-emerald-500 scale-[1.02]" 
                                  : "border-zinc-800/80 hover:border-emerald-500/40 hover:bg-zinc-950"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="space-y-1.5 max-w-[85%]">
                                  <h4 className="font-semibold text-zinc-100 text-xs tracking-tight leading-snug flex items-center gap-2">
                                    <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                                      <HiUser size={12} />
                                    </span>
                                    {inv.firstName} {inv.lastName}
                                  </h4>
                                  <p className="text-[11px] text-zinc-400 font-normal truncate pl-0.5">{inv.jobTitle || "Investor Lead"}</p>
                                  
                                  <div className="pt-1">
                                    <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                      <HiOfficeBuilding size={11} className="text-emerald-400" />
                                      {inv.Fund?.name || "Global Fund"}
                                    </span>
                                  </div>
                                </div>

                                {/* Controls */}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3 bg-zinc-900 border border-zinc-800 p-1 rounded-lg shadow-xl">
                                  <button onClick={() => {
                                    setSelectedInvestor(inv);
                                    setFormData({
                                      firstName: inv.firstName, lastName: inv.lastName, email: inv.email || "",
                                      officePhone: inv.officePhone || "", mobilePhone: inv.mobilePhone || "",
                                      jobTitle: inv.jobTitle || "", fundId: inv.fundId || inv.Fund?.id || "", status: inv.status
                                    });
                                    setShowEditModal(true);
                                  }} className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-md transition-all" title="Edit Lead"><HiPencil size={14} /></button>

                                  <button onClick={() => {
                                    setSelectedInvestor(inv);
                                    setTaskTitle("");
                                    setTaskDueDate("");
                                    setTaskDescription("");
                                    setTaskPriority("Medium");
                                    setShowTaskModal(true);
                                  }} className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-md transition-all" title="Link Task"><HiPlus size={14} /></button>

                                  <button onClick={() => handleDelete(inv.id)} className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-all" title="Delete"><HiTrash size={14} /></button>
                                </div>
                              </div>

                              {/* Email */}
                              <div className="mt-3.5 flex items-center gap-2 text-[11px] text-zinc-400 border-t border-zinc-800/60 pt-2.5 truncate">
                                <HiMail size={13} className="text-zinc-500 flex-shrink-0" /> 
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
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex justify-center items-center z-[1000] p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl w-full max-w-md relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wide">Create Custom Board</h2>
                <p className="text-zinc-400 text-xs mt-0.5">Define custom columns separated by commas.</p>
              </div>
              <button onClick={() => setShowBoardModal(false)} className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg transition-all"><HiX size={18} /></button>
            </div>

            <form onSubmit={handleCreateBoard} className="space-y-4">
              <input required placeholder="Pipeline Title (e.g. Angel Investor Stage)" value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none transition-all" />

              <textarea required rows={3} placeholder="Workflow Stages (e.g. Initial Contact, Pitch Deck Sent, Meeting, Won)" value={newBoardStages} onChange={(e) => setNewBoardStages(e.target.value)} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none resize-none transition-all" />

              <div className="pt-2 flex flex-col gap-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full py-3 bg-emerald-500 text-zinc-950 text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 transition-all uppercase ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? "Saving..." : "Save Pipeline"}
                </button>
                <button type="button" onClick={() => setShowBoardModal(false)} className="w-full py-2 text-zinc-400 hover:text-zinc-200 text-xs font-medium uppercase transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex justify-center items-center z-[1000] p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wide">Add New Lead</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg transition-all"><HiX size={18} /></button>
            </div>

            <form onSubmit={handleAddNew} className="space-y-4">
              <div>
                <select
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:border-emerald-500/50 outline-none transition-all cursor-pointer"
                  required
                  value={formData.fundId}
                  onChange={(e) => setFormData({ ...formData, fundId: e.target.value })}
                >
                  <option value="" className="bg-zinc-950">-- Select Fund --</option>
                  {funds && funds.map((f) => (
                    <option key={f.id} value={f.id} className="bg-zinc-950">{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none transition-all" />
                <input required placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none transition-all" />
              </div>

              <input placeholder="Job Title" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none transition-all" />
              <input required type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none transition-all" />

              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Office Phone" value={formData.officePhone} onChange={(e) => setFormData({ ...formData, officePhone: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none transition-all" />
                <input placeholder="Mobile Phone" value={formData.mobilePhone} onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none transition-all" />
              </div>

              <div>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:border-emerald-500/50 outline-none cursor-pointer transition-all">
                  {dynamicStages.map(st => <option key={st} value={st} className="bg-zinc-950">{st}</option>)}
                </select>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button type="submit" className="w-full py-3 bg-emerald-500 text-zinc-950 text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 transition-all uppercase">
                  Submit Lead
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="w-full py-2 text-zinc-400 hover:text-zinc-200 text-xs font-medium uppercase transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex justify-center items-center z-[1000] p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wide">Edit Lead Profile</h2>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg transition-all"><HiX size={18} /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <select 
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:border-emerald-500/50 outline-none transition-all cursor-pointer" 
                  value={formData.fundId} 
                  onChange={(e) => setFormData({ ...formData, fundId: e.target.value })} 
                  required
                >
                  <option value="" className="bg-zinc-950">-- Select Fund --</option>
                  {funds && funds.map(f => (
                    <option key={f.id} value={f.id} className="bg-zinc-950">{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none transition-all" />
                <input required placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none transition-all" />
              </div>

              <input placeholder="Job Title" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none transition-all" />
              <input required type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none transition-all" />

              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Office Phone" value={formData.officePhone} onChange={(e) => setFormData({ ...formData, officePhone: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none transition-all" />
                <input placeholder="Mobile Phone" value={formData.mobilePhone} onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none transition-all" />
              </div>

              <div>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:border-emerald-500/50 outline-none cursor-pointer transition-all">
                  {dynamicStages.map(st => <option key={st} value={st} className="bg-zinc-950">{st}</option>)}
                </select>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button type="submit" className="w-full py-3 bg-emerald-500 text-zinc-950 text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 transition-all uppercase">
                  Update Record
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="w-full py-2 text-zinc-400 hover:text-zinc-200 text-xs font-medium uppercase transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex justify-center items-center z-[1000] p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl w-full max-w-md relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wide">Link New Task</h2>
                <p className="text-xs text-emerald-400 font-medium mt-0.5">Investor: {selectedInvestor?.firstName} {selectedInvestor?.lastName}</p>
              </div>
              <button onClick={() => setShowTaskModal(false)} className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg transition-all"><HiX size={18} /></button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <input required type="text" placeholder="Task Title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none transition-all" />

              <textarea placeholder="Description (Optional)" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:border-emerald-500/50 outline-none resize-none transition-all" rows={2} />

              <div className="grid grid-cols-2 gap-4">
                <input required type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:border-emerald-500/50 outline-none [color-scheme:dark] transition-all" />

                <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:border-emerald-500/50 outline-none transition-all">
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button type="submit" className="w-full py-3 bg-emerald-500 text-zinc-950 text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 transition-all uppercase">
                  Create Task
                </button>
                <button type="button" onClick={() => setShowTaskModal(false)} className="w-full py-2 text-zinc-400 hover:text-zinc-200 text-xs font-medium uppercase transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}