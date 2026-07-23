import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Paperclip, Send, Clock, User, Briefcase, Info, Loader2, Trash2, X, ExternalLink, AlertTriangle, ChevronDown, ChevronUp, FileText } from "lucide-react";

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
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingAttachment, setEditingAttachment] = useState(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [rightSidebarTab, setRightSidebarTab] = useState("Details");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const empId = localStorage.getItem("empId");
  const role = localStorage.getItem("role");
  const empName = localStorage.getItem("name");

  const uniqueProjects = [...new Set(allTasks.map(t => t.project).filter(Boolean))];
  const projectTasks = allTasks.filter(t => t.project === selectedProject);

  const projectAssignees = [...new Set(projectTasks.map(t => t.empName || t.empId).filter(Boolean))];

  let allDocuments = [];
  if (task && task.attachments) {
    const taskAttachments = Array.isArray(task.attachments) ? task.attachments : [task.attachments];
    allDocuments.push(...taskAttachments.filter(Boolean).map(url => ({
      url,
      sender: task.empName || task.empId || "Task Creator"
    })));
  }
  if (task && task.comments) {
    task.comments.forEach(c => {
      if (c.attachments || c.attachment) {
        const commentAttachments = Array.isArray(c.attachments) ? c.attachments : [c.attachments || c.attachment];
        allDocuments.push(...commentAttachments.filter(Boolean).map(url => ({
          url,
          sender: c.empName || c.empId || "Commenter"
        })));
      }
      if (c.replies && c.replies.length > 0) {
        c.replies.forEach(r => {
          if (r.attachments || r.attachment) {
            const replyAttachments = Array.isArray(r.attachments) ? r.attachments : [r.attachments || r.attachment];
            allDocuments.push(...replyAttachments.filter(Boolean).map(url => ({
              url,
              sender: r.empName || r.empId || "Replier"
            })));
          }
        });
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
    if (!commentText.trim() && (!attachment || attachment.length === 0)) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append("text", commentText || " "); // Ensure text is sent if only attaching a file
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
      if (document.getElementById("attachment-input")) {
        document.getElementById("attachment-input").value = "";
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      const errorMsg = error.response?.data?.message || error.message || "Unknown error";
      alert(`Failed to add comment. Server says: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (e, commentId) => {
    e.preventDefault();
    if (!replyText.trim() && (!replyAttachment || replyAttachment.length === 0)) return;

    setSubmittingReply(true);
    const formData = new FormData();
    formData.append("text", replyText || " ");
    formData.append("empId", empId);
    if (empName) {
      formData.append("empName", empName);
    }
    if (replyAttachment && replyAttachment.length > 0) {
      Array.from(replyAttachment).forEach((file) => {
        formData.append("attachments", file);
      });
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/task/add-reply/${id}/${commentId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setTask(res.data.task);
      setReplyingTo(null);
      setReplyText("");
      setReplyAttachment(null);
      if (document.getElementById(`reply-attachment-input-${commentId}`)) {
        document.getElementById(`reply-attachment-input-${commentId}`).value = "";
      }
    } catch (error) {
      console.error("Error adding reply:", error);
      const errorMsg = error.response?.data?.message || error.message || "Unknown error";
      alert(`Failed to add reply. Server says: ${errorMsg}`);
    } finally {
      setSubmittingReply(false);
    }
  };

  const submitEdit = async (e, commentId, replyId = null) => {
    e.preventDefault();
    if (!editingText.trim() && (!editingAttachment || editingAttachment.length === 0)) return;

    setSubmittingEdit(true);
    const formData = new FormData();
    formData.append("text", editingText || " ");
    
    if (editingAttachment && editingAttachment.length > 0) {
      Array.from(editingAttachment).forEach((file) => {
        formData.append("attachments", file);
      });
    }

    try {
      const url = replyId 
        ? `${import.meta.env.VITE_BASE_URL}/task/edit-reply/${id}/${commentId}/${replyId}`
        : `${import.meta.env.VITE_BASE_URL}/task/edit-comment/${id}/${commentId}`;
        
      const res = await axios.put(url, formData, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });
      setTask(res.data.task);
      setEditingCommentId(null);
      setEditingText("");
      setEditingAttachment(null);
    } catch (error) {
      console.error("Error editing:", error);
      const errorMsg = error.response?.data?.message || error.message || "Unknown error";
      alert(`Failed to edit. Server says: ${errorMsg}`);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const filterValidFiles = (newFiles) => {
    const dt = new DataTransfer();
    let hasOversized = false;

    if (attachment && attachment.length > 0) {
      Array.from(attachment).forEach(f => dt.items.add(f));
    }

    Array.from(newFiles).forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        hasOversized = true;
      } else {
        dt.items.add(file);
      }
    });

    if (hasOversized) {
      alert("One or more files exceed the safe 10MB limit and were skipped.");
    }

    return dt.files.length > 0 ? dt.files : null;
  };

  const handlePaste = (e) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      setAttachment(filterValidFiles(e.clipboardData.files));
    }
  };

  const isImageUrl = (url) => {
    if (!url) return false;
    if (url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)(\?.*)?$/i) != null) return true;
    if (url.includes('cloudinary.com') && url.includes('/image/upload/') && !url.match(/\.[a-z0-9]+(\?.*)?$/i)) return true;
    return false;
  };

  const isVideoUrl = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov|avi|wmv)(\?.*)?$/i) != null;
  };

  const isRenderableAsImage = (url) => {
    if (!url) return false;
    if (isImageUrl(url)) return true;
    if (url.includes('cloudinary.com') && url.toLowerCase().match(/\.(pdf|mp4|webm|ogg|mov|avi|wmv)$/i)) return true;
    return false;
  };

  const getRenderableImageUrl = (url) => {
    if (!url) return url;
    if (url.includes('cloudinary.com') && url.toLowerCase().match(/\.(pdf|mp4|webm|ogg|mov|avi|wmv)$/i)) {
      return url.replace(/\.(pdf|mp4|webm|ogg|mov|avi|wmv)$/i, '.jpg');
    }
    return url;
  };

  const renderAttachmentPreview = (url, label, small = false) => {
    if (isRenderableAsImage(url)) {
      return (
        <div
          onClick={() => setPreviewUrl(url)}
          className={`relative group cursor-pointer rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all flex-shrink-0 bg-slate-100 ${small ? 'w-20 h-20' : 'w-32 h-32'}`}
          title={label}
        >
          <img src={getRenderableImageUrl(url)} alt={label} className="w-full h-full object-cover" />
          {isVideoUrl(url) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform backdrop-blur-sm">
                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-slate-800 border-b-[5px] border-b-transparent ml-0.5"></div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
            <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={() => setPreviewUrl(url)}
        className={`inline-flex items-center justify-center font-medium text-indigo-700 bg-white rounded-xl shadow-sm border border-indigo-200 hover:border-indigo-300 hover:shadow-md transition-all hover:-translate-y-0.5 ${small ? 'text-xs px-3 py-2 flex-col gap-1 w-20 h-20' : 'text-sm px-5 py-2.5'}`}
        title={label}
      >
        <FileText className={`${small ? 'w-6 h-6 text-indigo-400' : 'w-4 h-4 mr-2'}`} />
        <span className={small ? 'text-[10px] truncate w-full text-center' : ''}>{small ? 'File' : label}</span>
      </button>
    );
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
                  className={`w-full flex flex-col items-start text-left py-2 px-3 rounded-md transition-colors ${t._id === task._id
                      ? "bg-indigo-50/80 text-indigo-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                    }`}
                >
                  <div className="truncate text-sm w-full">{t.task}</div>
                  <div className={`text-[10px] mt-0.5 uppercase tracking-wider font-bold ${t.status === 'Completed' ? 'text-emerald-500' :
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
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-2 leading-tight tracking-tight">
                  {task.task}
                </h1>
                {(task.empName || task.issuerName) && (
                  <div className="text-sm font-medium text-slate-500 mb-6 flex items-center flex-wrap gap-y-2">
                    <User className="w-4 h-4 mr-2" />
                    {task.empName && (
                      <>
                        Issued to: <span className="ml-1 text-slate-800">{task.empName}</span>
                      </>
                    )}
                    {task.empName && task.issuerName && (
                      <span className="mx-3 text-slate-300">|</span>
                    )}
                    {task.issuerName && (
                      <>
                        Issued by: <span className="ml-1 text-slate-800">{task.issuerName}</span>
                      </>
                    )}
                  </div>
                )}

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

                {task.attachments && (Array.isArray(task.attachments) ? task.attachments : [task.attachments]).filter(Boolean).length > 0 && (
                  <div className="mt-8 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-indigo-900 mb-1">Attached Resources</h3>
                      <p className="text-xs text-indigo-600/70">Files attached to the main task description.</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {(Array.isArray(task.attachments) ? task.attachments : [task.attachments]).filter(Boolean).map((url, idx) => (
                        <React.Fragment key={idx}>
                          {renderAttachmentPreview(url, `Attachment ${idx + 1}`)}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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
                        placeholder="Add a comment... (paste files here too)"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onPaste={handlePaste}
                      />

                      {attachment && attachment.length > 0 && (
                        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                            <span className="flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" /> Attached {attachment.length} file(s)</span>
                            <button type="button" onClick={() => { setAttachment(null); document.getElementById("attachment-input").value = ""; }} className="text-red-500 hover:text-red-700 hover:underline">Remove All</button>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {Array.from(attachment).map((file, idx) => {
                              const isImg = file.type.startsWith('image/');
                              const isVid = file.type.startsWith('video/');
                              const isPdf = file.type === 'application/pdf';
                              const url = URL.createObjectURL(file);
                              return (
                                <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white flex items-center justify-center">
                                  {isImg ? (
                                    <img src={url} alt="preview" className="w-full h-full object-cover" />
                                  ) : isVid ? (
                                    <video src={url} className="w-full h-full object-cover bg-black" />
                                  ) : (
                                    <div className="text-[10px] text-slate-400 font-medium text-center px-1 break-all flex flex-col items-center">
                                      <FileText className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                                      {isPdf ? 'PDF' : file.name.substring(0, 10) + '...'}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between mt-2">
                        <div />
                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer flex items-center justify-center p-1 text-slate-400 hover:text-slate-700 transition-all" title="Attach file">
                            <Paperclip className="w-4 h-4" />
                            <input
                              type="file"
                              multiple
                              accept="image/*,video/*,application/pdf"
                              id="attachment-input"
                              className="hidden"
                              onChange={(e) => {
                                setAttachment(filterValidFiles(e.target.files));
                              }}
                            />
                          </label>
                          <button
                            type="submit"
                            disabled={submitting || (!commentText.trim() && (!attachment || attachment.length === 0))}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-1.5 rounded border border-blue-700 disabled:opacity-50 disabled:bg-blue-400 disabled:border-blue-400 transition-colors"
                          >
                            {submitting ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="space-y-8">
                  {task.comments && task.comments.length > 0 ? (
                    [...task.comments].reverse().map((comment, idx) => {
                      const isMyComment = empId === comment.empId;
                      return (
                        <div key={idx} className="flex gap-4 group">
                          <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center border border-transparent ${isMyComment ? 'bg-indigo-100 text-indigo-500 border-indigo-200' : 'bg-emerald-100 text-emerald-500 border-emerald-200'
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
                                {comment.isEdited && <span className="ml-1 text-slate-400 italic">(edited)</span>}
                              </span>
                            </div>

                            {comment.text && comment.text.trim() && (
                              <p className="whitespace-pre-wrap leading-relaxed text-slate-700 mt-1">{comment.text}</p>
                            )}

                            {(comment.attachments || comment.attachment) && (
                              <div className="mt-3 flex flex-wrap gap-3">
                                {(Array.isArray(comment.attachments) ? comment.attachments : (comment.attachments ? [comment.attachments] : [comment.attachment])).map((url, attachIdx) => (
                                  <React.Fragment key={attachIdx}>
                                    {renderAttachmentPreview(url, `File ${attachIdx + 1}`, true)}
                                  </React.Fragment>
                                ))}
                              </div>
                            )}

                            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 font-medium">
                              <button 
                                onClick={() => {
                                  if (replyingTo === comment._id) { setReplyingTo(null); setReplyText(""); setReplyAttachment(null); }
                                  else { setReplyingTo(comment._id); setReplyText(""); setReplyAttachment(null); setEditingCommentId(null); }
                                }} 
                                className="hover:underline hover:text-indigo-600 transition-colors text-slate-500"
                              >
                                Reply
                              </button>
                              
                              {isMyComment && new Date(comment.createdAt).toDateString() === new Date().toDateString() && (
                                <button
                                  onClick={() => {
                                    if (editingCommentId === comment._id) { setEditingCommentId(null); setEditingText(""); setEditingAttachment(null); }
                                    else { setEditingCommentId(comment._id); setEditingText(comment.text); setEditingAttachment(null); setReplyingTo(null); }
                                  }}
                                  className="hover:underline hover:text-indigo-600 transition-colors text-slate-500"
                                >
                                  Edit
                                </button>
                              )}
                              
                              <span className="px-1 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                              </span>
                            </div>

                            {/* Edit Input Form */}
                            {editingCommentId === comment._id && (
                              <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <form onSubmit={(e) => submitEdit(e, comment._id)} className="relative flex gap-3">
                                  <div className="flex-1">
                                    <textarea
                                      className="w-full p-2 border border-slate-300 rounded-md text-slate-700 text-sm outline-none resize-y min-h-[40px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                                      placeholder="Edit comment..."
                                      value={editingText}
                                      onChange={(e) => setEditingText(e.target.value)}
                                    />
                                    {editingAttachment && editingAttachment.length > 0 && (
                                      <div className="mt-2 text-xs text-indigo-600 font-medium">
                                        {editingAttachment.length} file(s) attached
                                      </div>
                                    )}
                                    <div className="flex justify-between mt-2">
                                      <div />
                                      <div className="flex items-center gap-2">
                                        <label className="cursor-pointer text-slate-400 hover:text-slate-700 p-1" title="Attach file">
                                          <Paperclip className="w-4 h-4" />
                                          <input
                                            type="file"
                                            multiple
                                            accept="image/*,video/*,application/pdf"
                                            className="hidden"
                                            onChange={(e) => setEditingAttachment(filterValidFiles(e.target.files))}
                                          />
                                        </label>
                                        <button
                                          type="submit"
                                          disabled={submittingEdit || (!editingText.trim() && (!editingAttachment || editingAttachment.length === 0))}
                                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3 py-1.5 rounded disabled:opacity-50 transition-colors"
                                        >
                                          {submittingEdit ? "Saving..." : "Save Edit"}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </form>
                              </div>
                            )}

                            {/* Reply Input Form */}
                            {replyingTo === comment._id && (
                              <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <form onSubmit={(e) => submitReply(e, comment._id)} className="relative flex gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-400 border border-slate-200">
                                    <User className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1">
                                    <textarea
                                      className="w-full p-2 border border-slate-300 rounded-md text-slate-700 text-sm outline-none resize-y min-h-[40px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                                      placeholder="Write a reply..."
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                    />
                                    {replyAttachment && replyAttachment.length > 0 && (
                                      <div className="mt-2 text-xs text-indigo-600 font-medium">
                                        {replyAttachment.length} file(s) attached
                                      </div>
                                    )}
                                    <div className="flex justify-between mt-2">
                                      <div />
                                      <div className="flex items-center gap-2">
                                        <label className="cursor-pointer text-slate-400 hover:text-slate-700 p-1" title="Attach file">
                                          <Paperclip className="w-4 h-4" />
                                          <input
                                            type="file"
                                            multiple
                                            accept="image/*,video/*,application/pdf"
                                            id={`reply-attachment-input-${comment._id}`}
                                            className="hidden"
                                            onChange={(e) => setReplyAttachment(filterValidFiles(e.target.files))}
                                          />
                                        </label>
                                        <button
                                          type="submit"
                                          disabled={submittingReply || (!replyText.trim() && (!replyAttachment || replyAttachment.length === 0))}
                                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3 py-1.5 rounded disabled:opacity-50 transition-colors"
                                        >
                                          {submittingReply ? "Replying..." : "Reply"}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </form>
                              </div>
                            )}

                            {/* Replies List */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="mt-4">
                                <button
                                  type="button"
                                  onClick={() => setExpandedReplies(prev => ({ ...prev, [comment._id]: !prev[comment._id] }))}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors mb-4"
                                >
                                  {expandedReplies[comment._id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  {expandedReplies[comment._id] ? "Hide Replies" : `View ${comment.replies.length} Reply(s)`}
                                </button>
                                {expandedReplies[comment._id] && (
                                  <div className="space-y-4 pl-4 border-l-2 border-slate-100 ml-2">
                                    {comment.replies.map((reply, rIdx) => {
                                  const isMyReply = empId === reply.empId;
                                  return (
                                    <div key={rIdx} className="flex gap-3 group">
                                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border border-transparent ${isMyReply ? 'bg-indigo-100 text-indigo-500' : 'bg-emerald-100 text-emerald-500'}`}>
                                        <User className="w-4 h-4" />
                                      </div>
                                      <div className="flex-1 text-sm text-slate-800">
                                        <div className="flex items-baseline gap-2 mb-1">
                                          <span className="font-semibold text-slate-900 text-xs">
                                            {reply.empName || reply.empId}
                                          </span>
                                          <span className="text-slate-500 text-[10px]">
                                            {new Date(reply.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(reply.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                            {reply.isEdited && <span className="ml-1 text-slate-400 italic">(edited)</span>}
                                          </span>
                                        </div>
                                        {reply.text && reply.text.trim() && (
                                          <p className="whitespace-pre-wrap leading-relaxed text-slate-700 text-xs mt-1">{reply.text}</p>
                                        )}
                                        {reply.attachments && reply.attachments.length > 0 && (
                                          <div className="mt-2 flex flex-wrap gap-2">
                                            {reply.attachments.map((url, aIdx) => (
                                              <React.Fragment key={aIdx}>
                                                {renderAttachmentPreview(url, `File ${aIdx + 1}`, true)}
                                              </React.Fragment>
                                            ))}
                                          </div>
                                        )}
                                        
                                        <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                                          {isMyReply && new Date(reply.createdAt).toDateString() === new Date().toDateString() && (
                                            <button
                                              onClick={() => {
                                                const replyKey = `${comment._id}-${reply._id}`;
                                                if (editingCommentId === replyKey) { setEditingCommentId(null); setEditingText(""); setEditingAttachment(null); }
                                                else { setEditingCommentId(replyKey); setEditingText(reply.text); setEditingAttachment(null); setReplyingTo(null); }
                                              }}
                                              className="hover:underline hover:text-indigo-600 transition-colors text-slate-500"
                                            >
                                              Edit
                                            </button>
                                          )}
                                        </div>

                                        {/* Reply Edit Form */}
                                        {editingCommentId === `${comment._id}-${reply._id}` && (
                                          <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <form onSubmit={(e) => submitEdit(e, comment._id, reply._id)} className="relative flex gap-3">
                                              <div className="flex-1">
                                                <textarea
                                                  className="w-full p-2 border border-slate-300 rounded-md text-slate-700 text-xs outline-none resize-y min-h-[35px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                                                  placeholder="Edit reply..."
                                                  value={editingText}
                                                  onChange={(e) => setEditingText(e.target.value)}
                                                />
                                                {editingAttachment && editingAttachment.length > 0 && (
                                                  <div className="mt-2 text-[10px] text-indigo-600 font-medium">
                                                    {editingAttachment.length} file(s) attached
                                                  </div>
                                                )}
                                                <div className="flex justify-between mt-1">
                                                  <div />
                                                  <div className="flex items-center gap-2">
                                                    <label className="cursor-pointer text-slate-400 hover:text-slate-700 p-1" title="Attach file">
                                                      <Paperclip className="w-3 h-3" />
                                                      <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*,video/*,application/pdf"
                                                        className="hidden"
                                                        onChange={(e) => setEditingAttachment(filterValidFiles(e.target.files))}
                                                      />
                                                    </label>
                                                    <button
                                                      type="submit"
                                                      disabled={submittingEdit || (!editingText.trim() && (!editingAttachment || editingAttachment.length === 0))}
                                                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[10px] px-2 py-1 rounded disabled:opacity-50 transition-colors"
                                                    >
                                                      {submittingEdit ? "Saving..." : "Save"}
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>
                                            </form>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
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
                        className={`w-full p-3 rounded-xl border-2 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer appearance-none ${task.status?.toLowerCase() === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
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
                      <div key={idx} className="flex flex-col p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm transition-all group">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col truncate pr-2">
                              <span className="text-xs font-medium text-slate-700 truncate">Document {idx + 1}</span>
                              <span className="text-[10px] text-slate-400 truncate">by {doc.sender}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setPreviewUrl(doc.url)}
                            className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all shrink-0"
                          >
                            View
                          </button>
                        </div>
                        {isRenderableAsImage(doc.url) && (
                          <div
                            className="w-full h-32 rounded-lg overflow-hidden border border-slate-200 cursor-pointer relative mt-3 group"
                            onClick={() => setPreviewUrl(doc.url)}
                          >
                            <img src={getRenderableImageUrl(doc.url)} alt={`Document ${idx + 1}`} className="w-full h-full object-cover" />
                            {isVideoUrl(doc.url) && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                                <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform backdrop-blur-sm">
                                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-slate-800 border-b-[5px] border-b-transparent ml-0.5"></div>
                                </div>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-slate-900/0 hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                              <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                            </div>
                          </div>
                        )}
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
              {isVideoUrl(previewUrl) ? (
                <video
                  controls
                  src={previewUrl}
                  className="max-w-full max-h-[70vh] rounded-xl shadow-sm bg-black"
                />
              ) : isRenderableAsImage(previewUrl) ? (
                <img
                  src={getRenderableImageUrl(previewUrl)}
                  className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-sm bg-white"
                  alt="Preview"
                />
              ) : (
                <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`} className="w-full h-[70vh] rounded-xl border border-slate-200 bg-white" title="File Preview" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
