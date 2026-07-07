import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { employeename, getTheTask, projectname, updateTheTask } from "../../api/services/projectServices";
import axios from "axios";

function TaskEdit() {
  const { taskId } = useParams();
  const [task, setTask] = useState({
    project: "",
    task: "",
    empId: "",
    description: "",
    timeline: "",
    status: "Pending",
    date: "",
    attachments: "",
  });
  const navigate = useNavigate();
  const id = localStorage.getItem("empId");
  const [role, setRole] = useState(localStorage.getItem("role") || "Superadmin");
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newAttachments, setNewAttachments] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [employeesResponse, projectsResponse] = await Promise.all([
          employeename(`${id}`),
          projectname(),
        ]);

        if (employeesResponse && projectsResponse) {
          setEmployees(employeesResponse.data);
          const flattenedProjects = projectsResponse.data.flatMap(project =>
            project.projectDetails.map(detail => ({
              _id: project._id,
              projectName: detail.projectName
            }))
          );
          setProjects(flattenedProjects);
          setError(null);
        } else {
          throw new Error("Failed to fetch employees or projects.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role, id]);

  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        const response = await getTheTask(taskId);
        if (response.status === 200) {
          let fetchedTask = response.data.task;

          console.log("Fetched Task Data:", fetchedTask);

          if (fetchedTask.date) {
            let dateObj = new Date(fetchedTask.date);
            let day = String(dateObj.getDate()).padStart(2, "0");
            let month = String(dateObj.getMonth() + 1).padStart(2, "0"); 
            let year = String(dateObj.getFullYear()).slice(-2); 

            fetchedTask.dateFormatted = `${day}/${month}/${year}`; 
            fetchedTask.date = dateObj.toISOString().split("T")[0]; 
          }

          setTask(fetchedTask);
        } else {
          console.error("Failed to fetch task data. Response status:", response.status);
          alert("Failed to fetch task data.");
        }
      } catch (error) {
        console.error("Error fetching task data:", error);
        alert("An error occurred while fetching task data.");
      }
    };

    if (taskId) {
      fetchTaskData();
    }
  }, [taskId]);


  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "date") {
      let dateObj = new Date(value);
      let day = String(dateObj.getDate()).padStart(2, "0");
      let month = String(dateObj.getMonth() + 1).padStart(2, "0");
      let year = String(dateObj.getFullYear()).slice(-2);

      setTask((prev) => ({
        ...prev,
        date: value,
        dateFormatted: `${day}/${month}/${year}`, 
      }));
    } else {
      setTask((prev) => {
        const updatedTask = { ...prev, [name]: value };
        if (name === "empId") {
           const selectedEmp = employees.find(emp => (emp.empId || emp._id) === value);
           updatedTask.empName = selectedEmp ? selectedEmp.name : "";
        }
        return updatedTask;
      });
    }
  };


  const handleFileChange = (e) => {
    setNewAttachments(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    const safeKeys = ["project", "task", "empId", "description", "timeline", "status", "date"];
    safeKeys.forEach(key => {
      if (task[key] !== undefined && task[key] !== null) {
        formData.append(key, task[key]);
      }
    });

    if (newAttachments && newAttachments.length > 0) {
      Array.from(newAttachments).forEach((file) => {
        formData.append("attachments", file);
      });
    } else if (task.attachments) {
       // if we want to keep old ones, we could pass them, but the backend doesn't overwrite if it's not provided? 
       // Wait, req.body will not have attachments, so mongoose findByIdAndUpdate won't touch it. 
       // Actually, we can just omit it so it doesn't get cleared.
    }

    try {
      if (task.empName) formData.append("empName", task.empName);
      console.log(taskId, task);
      const result = await updateTheTask(taskId, formData);
      console.log("Task updated:", result);
      
      if (result && result.message === "Task updated successfully") {
        setShowSuccessModal(true);
        setTimeout(() => {
          navigate("/task");
        }, 1500);
      } else {
        alert("An error occurred while updating the task.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while updating the task.");
    }
  };

  if (loading) {
    return <div className="container mx-auto p-8 mt-20 text-center"><p className="text-xl">Loading...</p></div>;
  }

  if (error) {
    return <div className="container mx-auto p-8 mt-20 text-center"><p className="text-xl text-red-600">{error}</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800">
            Edit Task
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Update the task details and assignees.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Project</label>
              <select name="project" value={task.project} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                <option value="">Select Project</option>
                {projects.map((project) => (
                  <option key={project._id || project.id} value={project.projectName}>{project.projectName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Task Name</label>
              <input type="text" name="task" value={task.task} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Enter task name" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Assign Employee</label>
              <select name="empId" value={task.empId} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee.empId || employee._id}>{employee.name}</option>
                ))}
                {task.empId && !employees.find(e => (e.empId || e._id) === task.empId) && (
                  <option value={task.empId}>{task.empId}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
              <textarea name="description" value={task.description} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" rows="3" placeholder="Task description..." />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Timeline</label>
              <input type="text" name="timeline" value={task.timeline} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="e.g., 2 weeks" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
              <select name="status" value={task.status} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Due Date</label>
              <input type="date" name="date" value={task.date} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Attachments</label>
              {task.attachments && (Array.isArray(task.attachments) ? task.attachments : [task.attachments]).map((attachment, idx) => (
                <div key={idx} className="mb-3 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg inline-flex items-center mr-2">
                  <Link to={attachment} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                    View Existing File {idx + 1}
                  </Link>
                </div>
              ))}
              <input type="file" multiple name="attachments" onChange={handleFileChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition-all" />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-8 border-t border-slate-100 mt-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-sm hover:shadow-md hover:shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-sm relative animate-in zoom-in-95 duration-200 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Success!</h3>
            <p className="text-slate-500">
              Task updated successfully. Redirecting...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskEdit;