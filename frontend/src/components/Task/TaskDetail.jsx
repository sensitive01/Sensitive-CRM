import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Paperclip, Send, Clock, User, Briefcase, Info, Loader2, Trash2, X, ExternalLink, AlertTriangle, ChevronDown } from "lucide-react";

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [rightSidebarTab, setRightSidebarTab] = useState("Details");
  const empId = localStorage.getItem("empId");
  const role = localStorage.getItem("role");
  const empName = localStorage.getItem("name");

  const uniqueProjects = [...new Set(allTasks.map(t => t.project).filter(Boolean))];
  const projectTasks = allTasks.filter(t => t.project === selectedProject);

  const projectAssignees = [...new Set(projectTasks.map(t => t.empName || t.empId).filter(Boolean))];
  
  let allDocuments = [];
  if (task && task.attachments) {
    allDocuments.push(...(Array.isArray(task.attachments) ? task.attachments : [task.attachments]));
  }
  if (task && task.comments) {
    task.comments.forEach(c => {
      if (c.attachments || c.attachment) {
        allDocuments.push(...(Array.isArray(c.attachments) ? c.attachments : [c.attachments || c.attachment]));
      }
    });
  }
  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/task/gettaskbyid/${id}`
      );
      const currentTask = response.data.task;
      setTask(currentTask);

      if (currentTask && currentTask.project) {
        const allTasksRes = await axios.get(`${import.meta.env.VITE_BASE_URL}/task/getalltask/${empId}`);
        const tasksData = allTasksRes.data.tasks || allTasksRes.data;
        if (Array.isArray(tasksData)) {
          setAllTasks(tasksData);
          setSelectedProject(currentTask.project);
        }
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (e) => {
    const updatedStatus = e.target.value;
    try {
      await axios.put(
        `${import.meta.env.VITE_BASE_URL}/task/update-status/${id}`,
        { status: updatedStatus }
      );
      setTask({ ...task, status: updatedStatus });
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append("text", commentText);
    formData.append("empId", empId);
    if (empName) {
      formData.append("empName", empName);
    }
    if (attachment && attachment.length > 0) {
      Array.from(attachment).forEach((file) => {
        formData.append("attachments", file);
      });
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/task/add-comment/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setTask(res.data.task);
      setCommentText("");
      setAttachment(null);
      document.getElementById("attachment-input").value = "";
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const executeDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/task/delete-comment/${id}/${commentToDelete}`
      );
      setTask(res.data.task);
      setCommentToDelete(null);
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment.");
      setCommentToDelete(null);
    }
  };

  const handlePaste = (e) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      // Prevent default to avoid pasting the file name or binary text into textarea if applicable
      e.preventDefault(); 
      setAttachment(e.clipboardData.files);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "in progress": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  if (!task) return (
    <div className="flex justify-center items-center h-screen bg-gray-50 text-gray-500">
      Task not found.
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans flex pt-16 md:pt-20">
      {/* Left Sidebar: Project Tasks */}
      <div className="w-64 md:w-72 shrink-0 bg-white border-r border-slate-200 hidden lg:flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] sticky top-16 md:top-20 z-10">
        <div className="p-5 border-b border-slate-100 relative">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Project</h3>
          <div className="relative">
            <button 
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="flex items-center gap-3 w-full hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors text-left"
            >
              <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                {selectedProject && selectedProject.length > 0 ? selectedProject[0].toUpperCase() : "P"}
              </div>
              <div className="font-bold text-slate-800 text-lg truncate flex-1" title={selectedProject || "No Project"}>
                {selectedProject || "No Project"}
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isProjectDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                {uniqueProjects.map(proj => (
                  <button
                    key={proj}
                    onClick={() => {
                      setSelectedProject(proj);
                      setIsProjectDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedProject === proj ? 'bg-indigo-50/70 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                    {proj}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-2">Tasks</div>
          {projectTasks.length > 0 ? (
            <div className="space-y-0.5">
              {projectTasks.map((t) => (
                <button
                  key={t._id}
                  onClick={() => navigate(`/task-detail/${t._id}`)}
                  className={`w-full flex flex-col items-start text-left py-2 px-3 rounded-md transition-colors ${
                    t._id === task._id 
                      ? "bg-indigo-50/80 text-indigo-700 font-semibold" 
                      : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                  }`}
                >
                  <div className="truncate text-sm w-full">{t.task}</div>
                  <div className={`text-[10px] mt-0.5 uppercase tracking-wider font-bold ${
                    t.status === 'Completed' ? 'text-emerald-500' :
                    t.status === 'In Progress' ? 'text-blue-500' :
                    'text-amber-500'
                  }`}>
                    {t.status || "Pending"}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 px-3 py-2">No other tasks found.</p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header / Back Navigation */}
          <div className="mb-6">
            <button 
              onClick={() => navigate(-1)}
              className="group flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm bg-white/50 px-4 py-2 rounded-full shadow-sm hover:shadow border border-slate-200/60 w-fit backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
              Back to Task Board
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Middle Column: Details & Comments */}
            <div className="lg:w-2/3 space-y-8">
            {/* Task Info Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-6 leading-tight tracking-tight">
                {task.task}
              </h1>
              
              <div className="prose max-w-none">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center mb-3">
                  <Info className="w-4 h-4 mr-2" /> Description
                </h3>
                <div className="bg-slate-50/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-100 text-slate-600 leading-relaxed min-h-[100px]">
                  {task.description ? (
                    <p className="whitespace-pre-wrap m-0">{task.description}</p>
                  ) : (
                    <p className="italic text-slate-400 m-0">No description provided for this task.</p>
                  )}
                </div>
              </div>

              {task.attachments && (Array.isArray(task.attachments) ? task.attachments : [task.attachments]).length > 0 && (
                <div className="mt-8 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-indigo-900 mb-1">Attached Resources</h3>
                    <p className="text-xs text-indigo-600/70">Files attached to the main task description.</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {(Array.isArray(task.attachments) ? task.attachments : [task.attachments]).map((url, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setPreviewUrl(url)}
                        className="inline-flex items-center justify-center text-sm font-medium text-indigo-700 bg-white px-5 py-2.5 rounded-xl shadow-sm border border-indigo-200 hover:border-indigo-300 hover:shadow-md transition-all hover:-translate-y-0.5"
                      >
                        <Paperclip className="w-4 h-4 mr-2" /> View Attachment {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comments Section */}
            {/* Comments Section */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Activity</h3>
              

              {/* Add Comment Form */}
              <div className="flex gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-400 font-bold border border-slate-200">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <form onSubmit={submitComment} className="relative">
                    <textarea
                      className="w-full p-3 border border-slate-300 rounded-md text-slate-700 text-sm outline-none resize-y min-h-[50px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onPaste={handlePaste}
                      required
                    />
                    <div className="flex justify-between mt-2">
                      <div />
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer flex items-center justify-center p-1 text-slate-400 hover:text-slate-700 transition-all" title="Attach file">
                          <Paperclip className="w-4 h-4" />
                          <input 
                            type="file" 
                            multiple
                            id="attachment-input"
                            className="hidden" 
                            onChange={(e) => setAttachment(e.target.files)}
                          />
                        </label>
                        <button 
                          type="submit" 
                          disabled={submitting || !commentText.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-1.5 rounded border border-blue-700 disabled:opacity-50 disabled:bg-blue-400 disabled:border-blue-400 transition-colors"
                        >
                          {submitting ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                    {attachment && attachment.length > 0 && (
                      <div className="text-xs mt-2 text-slate-600 flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100 w-max">
                        <Paperclip className="w-3 h-3 text-slate-400" />
                        <span>{attachment.length} file(s) attached</span>
                        <button type="button" onClick={() => { setAttachment(null); document.getElementById("attachment-input").value = ""; }} className="text-red-500 hover:underline ml-2">Remove</button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
              
              <div className="space-y-8">
                {task.comments && task.comments.length > 0 ? (
                  task.comments.map((comment, idx) => {
                    const isMyComment = empId === comment.empId;
                    return (
                      <div key={idx} className="flex gap-4 group">
                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center border border-transparent ${
                          isMyComment ? 'bg-indigo-100 text-indigo-500 border-indigo-200' : 'bg-emerald-100 text-emerald-500 border-emerald-200'
                        }`}>
                          <User className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 text-sm text-slate-800">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-slate-900">
                              {comment.empName || comment.empId}
                            </span>
                            <span className="text-slate-500 text-xs">
                              {new Date(comment.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <p className="whitespace-pre-wrap leading-relaxed text-slate-700 mt-1">{comment.text}</p>
                          
                          {(comment.attachments || comment.attachment) && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {(Array.isArray(comment.attachments) ? comment.attachments : (comment.attachments ? [comment.attachments] : [comment.attachment])).map((url, idx) => (
                                <button 
                                  key={idx}
                                  onClick={() => setPreviewUrl(url)}
                                  className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded transition-colors flex items-center"
                                >
                                  <Paperclip className="w-3 h-3 mr-1.5 text-slate-400" /> View File {idx + 1}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 font-medium">
                            <button className="hover:underline hover:text-slate-700 transition-colors">Edit</button>
                            <span>&middot;</span>
                            {(role === "Superadmin" || isMyComment) ? (
                               <button 
                                 onClick={() => setCommentToDelete(comment._id)}
                                 className="hover:underline hover:text-red-600 transition-colors text-slate-500"
                               >
                                 Delete
                               </button>
                            ) : (
                               <button className="hover:underline hover:text-slate-700 transition-colors text-slate-500">Delete</button>
                            )}
                            <span className="px-1 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-slate-500 text-sm ml-14">No comments yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Meta Info Sidebar */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sticky top-24 z-10">
              <div className="flex border-b border-slate-200 mb-6 relative">
                <button 
                  onClick={() => setRightSidebarTab("Details")} 
                  className={`flex-1 pb-3 text-sm font-bold transition-colors ${rightSidebarTab === "Details" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Details
                </button>
                <button 
                  onClick={() => setRightSidebarTab("Documents")} 
                  className={`flex-1 pb-3 text-sm font-bold transition-colors ${rightSidebarTab === "Documents" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Documents
                </button>
              </div>
              
              {rightSidebarTab === "Details" ? (
                <div className="space-y-7 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Current Status</label>
                    <select
                      value={task.status || "Pending"}
                      onChange={handleStatusChange}
                      className={`w-full p-3 rounded-xl border-2 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer appearance-none ${
                        task.status?.toLowerCase() === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        task.status?.toLowerCase() === 'in progress' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        'bg-orange-50 border-orange-200 text-orange-700'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="space-y-5 px-1">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Assignee</label>
                        <span className="text-slate-800 font-bold text-sm">{task.empName || task.empId || "Unassigned"}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                        <Briefcase className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Project</label>
                        <span className="text-slate-800 font-bold text-sm">{task.project || "None"}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                        <Clock className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Timeline</label>
                        <span className="text-slate-800 font-bold text-sm">{task.timeline || "Not set"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Project Assignees</h4>
                    <div className="flex flex-wrap gap-2">
                      {projectAssignees.length > 0 ? projectAssignees.map((assignee, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
                           <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                             {assignee.charAt(0).toUpperCase()}
                           </div>
                           <span className="text-xs font-semibold text-slate-700">{assignee}</span>
                        </div>
                      )) : (
                        <span className="text-xs text-slate-400">No assignees found.</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300 max-h-[60vh] overflow-y-auto pr-2">
                  {allDocuments.length > 0 ? allDocuments.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div className="truncate pr-2 text-xs font-medium text-slate-700">Document {idx + 1}</div>
                      </div>
                      <button 
                        onClick={() => setPreviewUrl(doc)}
                        className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all shrink-0"
                      >
                        View
                      </button>
                    </div>
                  )) : (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Paperclip className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm font-medium">No documents attached</p>
                      <p className="text-slate-400 text-xs mt-1">Attachments will appear here</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* File Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-8">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-5xl max-h-full flex flex-col relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="font-bold text-slate-800">Attachment Preview</h3>
              <div className="flex gap-2">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-500 hover:text-indigo-600 bg-white rounded-full hover:bg-indigo-50 transition-colors shadow-sm" title="Open in new tab">
                  <ExternalLink className="w-5 h-5" />
                </a>
                <button onClick={() => setPreviewUrl(null)} className="p-2 text-slate-500 hover:text-red-600 bg-white rounded-full hover:bg-red-50 transition-colors shadow-sm" title="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100/50 p-4 flex justify-center items-center min-h-[50vh]">
               {/* Use iframe to support both PDFs and Images natively in the browser */}
               <iframe src={previewUrl} className="w-full h-[70vh] rounded-xl border border-slate-200 bg-white" title="File Preview" />
            </div>
          </div>
        </div>
      )}

      {/* Delete Comment Confirmation Modal */}
      {commentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-md relative animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Delete Comment?</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Are you sure you want to delete this comment? This action cannot be undone.
              </p>
              
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setCommentToDelete(null)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeDeleteComment}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm hover:shadow-md hover:shadow-red-600/20 transition-all w-full sm:w-auto"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setCommentToDelete(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
