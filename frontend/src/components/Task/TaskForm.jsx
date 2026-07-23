import axios from "axios";
import React, { useState, useEffect } from "react";
import { createTask, employeename, projectname } from "../../api/services/projectServices";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2 } from "lucide-react";

function TaskForm() {
  const [tasks, setTasks] = useState([
    {
      project: "",
      task: "",
      empId: "",
      empName: "",
      description: "",
      timeline: "",
      status: "Pending",
      date: "",
      attachments: null,
    },

  ]);
  const navigate = useNavigate();
  const id = localStorage.getItem("empId");
  const [role, setRole] = useState(localStorage.getItem("role") || "Superadmin");
  const [projects, setprojects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [employeesResponse, projectsResponse] = await Promise.all([
          employeename(`${id}`),
          projectname()
        ]);

        console.log("Employees fetched:", employeesResponse);
        console.log("Projects fetched:", projectsResponse);

        if (employeesResponse && projectsResponse) {
          setEmployees(employeesResponse.data); 
          const flattenedProjects = projectsResponse.data.flatMap(project =>
            project.projectDetails.map(detail => ({
              _id: project._id,
              projectName: detail.projectName 
            }))
          );
          setprojects(flattenedProjects); 
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




  const handleChange = (index, e) => {
    const { name, value } = e.target;
    setTasks((prev) => {
      const updatedTasks = [...prev];
      updatedTasks[index][name] = value;
      if (name === "empId") {
        const selectedEmp = employees.find(emp => (emp.empId || emp._id) === value);
        updatedTasks[index].empName = selectedEmp ? selectedEmp.name : "";
      }
      return updatedTasks;
    });
  };

  const handleFileChange = (index, e) => {
    const files = e.target.files;
    setTasks((prev) => {
      const updatedTasks = [...prev];
      updatedTasks[index].attachments = files;
      return updatedTasks;
    });
  };

  const handleAddFields = () => {
    setTasks((prev) => [
      ...prev,
      {
        project: "",
        task: "",
        empId: "",
        empName: "",
        description: "",
        timeline: "",
        status: "Pending",
        date: "",
        attachments: null,
      },
    ]);
  };

  const handleRemoveFields = (index) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    let allSuccess = true;

    try {
      for (const formTask of tasks) {
        const formData = new FormData();
        formData.append("project", formTask.project);
        formData.append("task", formTask.task);
        formData.append("empId", formTask.empId);
        if (formTask.empName) formData.append("empName", formTask.empName);
        
        const issuerId = localStorage.getItem("empId");
        const issuerName = localStorage.getItem("name");
        if (issuerId) formData.append("issuedBy", issuerId);
        if (issuerName) formData.append("issuerName", issuerName);

        formData.append("description", formTask.description);
        formData.append("timeline", formTask.timeline);
        formData.append("status", formTask.status);
        formData.append("date", formTask.date);
        if (formTask.attachments) {
          Array.from(formTask.attachments).forEach((file) => {
            formData.append("attachments", file); 
          });
        } else {
          formData.append("attachments", ""); 
        }

        const response = await createTask(formData);

        if (response.status !== 201) {
          allSuccess = false;
        }
      }

      if (allSuccess) {
        setShowSuccessModal(true);
        setTimeout(() => {
          navigate("/task");
        }, 1500);
      } else {
        alert("Some tasks failed to create.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while creating the tasks.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 mt-20 text-center">
        <p className="text-xl">Loading</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 mt-20 text-center">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    );
  }

  return (
     <div className="min-h py-16">
      <div className="max-w-3xl mx-auto bg-grey-100 shadow-2xl rounded-2xl p-8">
        <h2 className="text-4xl font-bold mb-8 text-center text-white-100">
          Create Task Form
        </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 bg-white p-8 border rounded-lg shadow-lg max-w-4xl mx-auto"
      >
        {tasks.map((task, index) => (
          <div key={index} className="space-y-8 border-b pb-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              <div>
                <label className="block text-sm font-medium pb-2 text-gray-600">Project:</label>
                <select
                  name="project"
                  value={task.project}
                  onChange={(e) => handleChange(index, e)}
                  required
                  className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option
                      key={project._id}
                      value={project.projectName}
                    >
                      {project.projectName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium pb-2 text-gray-600">Task:</label>
                <input
                  type="text"
                  name="task"
                  value={task.task}
                  onChange={(e) => handleChange(index, e)}
                  required
                  className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>

                <label className="block text-sm font-medium pb-2 text-gray-600">Employee:</label>
                <select
                  name="empId"
                  value={task.empId}
                  onChange={(e) => handleChange(index, e)}
                  required
                  className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id || employee.id} value={employee.empId || employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium pb-2 text-gray-600">Description:</label>
                <textarea
                  name="description"
                  value={task.description}
                  onChange={(e) => handleChange(index, e)}
                  required
                  className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="4"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium pb-2 text-gray-600">Timeline:</label>
                <input
                  type="text"
                  name="timeline"
                  value={task.timeline}
                  onChange={(e) => handleChange(index, e)}
                  className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium pb-2 text-gray-600">Status:</label>
                <select
                  name="status"
                  value={task.status}
                  onChange={(e) => handleChange(index, e)}
                  required
                  className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium pb-2 text-gray-600">Date:</label>
                <input
                  type="date"
                  name="date"
                  value={task.date}
                  onChange={(e) => handleChange(index, e)}
                  required
                  className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium pb-2 text-gray-600">Attachments:</label>
                <input
                  type="file"
                  name="attachments"
                  onChange={(e) => handleFileChange(index, e)}
                  multiple
                  className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {tasks.length > 1 && (
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => handleRemoveFields(index)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
        <div className="flex justify-center mt-8">
          <button
            type="button"
            onClick={handleAddFields}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition duration-300"
          >
            Add More
          </button>
        </div>
        <div className="flex justify-center gap-6 pt-6">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center px-10 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg disabled:opacity-70"
          >
            {submitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {submitting ? "Submitting..." : "Submit"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-10 py-3 bg-gray-300 text-gray-800 rounded-xl font-semibold
                       hover:bg-gray-400 transition shadow-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
    
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-sm relative animate-in zoom-in-95 duration-200 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Success!</h3>
            <p className="text-slate-500">
              Task created successfully. Redirecting...
            </p>
          </div>
        </div>
      )}
   </div>
  );
}

export default TaskForm;