import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, Trash2, Clock, CheckCircle2, CircleDashed, LayoutDashboard, X, AlertTriangle, Edit } from "lucide-react";

const TaskKanban = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [role] = useState(localStorage.getItem("role") || "Superadmin");
  const [searchTerm, setSearchTerm] = useState("");
  const [taskToDelete, setTaskToDelete] = useState(null);
  const id = localStorage.getItem("empId");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, [role, id]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/task/getalltask/${id}`
      );
      let taskList = response.data.tasks || response.data;
      if (!Array.isArray(taskList)) throw new Error("Unexpected API format");
      setTasks(taskList);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load task data");
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!taskToDelete) return;
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/task/deletetask/${taskToDelete}`);
      setTasks(tasks.filter((task) => task._id !== taskToDelete));
      setTaskToDelete(null);
    } catch (err) {
      alert("Failed to delete task");
      setTaskToDelete(null);
    }
  };

  const filteredTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];

    return tasks
      .filter(task => {
        if (role === "Superadmin") return true;
        return (
          task.status?.toLowerCase() === "pending" ||
          task.status?.toLowerCase() === "in progress"
        );
      })
      .filter(task =>
        task.task?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [tasks, role, searchTerm]);

  // Group tasks by status with UI config
  const columnsConfig = {
    "Pending": {
      tasks: filteredTasks.filter(t => t.status === "Pending" || !t.status),
      bgColor: "bg-orange-50/50",
      borderColor: "border-orange-200",
      headerColor: "text-orange-700",
      badgeColor: "bg-orange-100 text-orange-700",
      icon: <CircleDashed className="w-5 h-5 text-orange-500" />
    },
    "In Progress": {
      tasks: filteredTasks.filter(t => t.status === "In Progress"),
      bgColor: "bg-blue-50/50",
      borderColor: "border-blue-200",
      headerColor: "text-blue-700",
      badgeColor: "bg-blue-100 text-blue-700",
      icon: <Clock className="w-5 h-5 text-blue-500" />
    },
    "Completed": {
      tasks: filteredTasks.filter(t => t.status === "Completed"),
      bgColor: "bg-emerald-50/50",
      borderColor: "border-emerald-200",
      headerColor: "text-emerald-700",
      badgeColor: "bg-emerald-100 text-emerald-700",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl border border-red-200 shadow-sm">{error}</div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 pt-24 md:pt-28 bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-indigo-600" />
            Task Board
          </h1>
          <p className="text-slate-500 mt-1">Manage and track project tasks efficiently.</p>
        </div>

        <div className="flex items-center w-full md:w-auto gap-3">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full md:w-64 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
          {role === "Superadmin" && (
            <Link
              to="/task-form"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-sm hover:shadow shadow-indigo-600/20 transition-all flex items-center gap-2 font-medium whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Task
            </Link>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-8 items-start">
        {Object.entries(columnsConfig).map(([status, config]) => (
          <div
            key={status}
            className={`flex-1 min-w-[320px] rounded-2xl border ${config.borderColor} ${config.bgColor} p-5 flex flex-col backdrop-blur-sm shadow-sm transition-all`}
          >
            {/* Column Header */}
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/50">
              <div className="flex items-center gap-2">
                {config.icon}
                <h3 className={`text-lg font-bold ${config.headerColor}`}>{status}</h3>
              </div>
              <span className={`${config.badgeColor} text-xs font-bold py-1 px-3 rounded-full shadow-sm`}>
                {config.tasks.length}
              </span>
            </div>

            {/* Task List */}
            <div className="flex-1 space-y-4">
              {config.tasks.map(task => (
                <div
                  key={task._id}
                  onClick={() => navigate(`/task-detail/${task._id}`)}
                  className="group bg-white/90 backdrop-blur-md p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-300 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                >
                  {/* Priority / Status accent line */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.badgeColor.split(' ')[0]}`}></div>

                  <h4 className="font-bold text-slate-800 mb-1.5 leading-tight group-hover:text-indigo-600 transition-colors">
                    {task.task}
                  </h4>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                    {task.description || "No description provided."}
                  </p>

                  <div className="flex justify-between items-end mt-auto pt-3 border-t border-slate-50">
                    <div className="flex flex-col gap-1.5">
                      {task.project && (
                        <div className="inline-flex max-w-fit items-center text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                          {task.project}
                        </div>
                      )}
                      <div className="text-xs text-slate-500 font-medium">
                        {task.empName || task.empId ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                              {(task.empName || task.empId).charAt(0).toUpperCase()}
                            </span>
                            {task.empName || task.empId}
                          </span>
                        ) : (
                          "Unassigned"
                        )}
                      </div>
                    </div>

                    {role === "Superadmin" && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/task-edit/${task._id}`);
                          }}
                          className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit task"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTaskToDelete(task._id);
                          }}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {config.tasks.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                  <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-slate-100 mb-3">
                    {config.icon}
                  </div>
                  <p className="text-slate-500 font-medium text-sm">No tasks here</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-md relative animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Delete Task?</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Are you sure you want to delete this task? This action cannot be undone and will remove all associated comments and attachments.
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setTaskToDelete(null)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm hover:shadow-md hover:shadow-red-600/20 transition-all w-full sm:w-auto"
                >
                  Yes, Delete
                </button>
              </div>
            </div>

            <button
              onClick={() => setTaskToDelete(null)}
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

export default TaskKanban;

// import React, { useState, useMemo, useEffect } from "react";
// import {
//   useTable,
//   useGlobalFilter,
//   useSortBy,
//   usePagination,
// } from "react-table";
// import { Trash2, Eye } from "lucide-react";
// import { FaPlus, FaFileDownload, FaFilter } from "react-icons/fa";
// import { Link } from "react-router-dom";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import * as XLSX from "xlsx";

// const TaskList = () => {
//   const [tasks, setTasks] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedTask, setSelectedTask] = useState(null);
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [role, setRole] = useState(
//     localStorage.getItem("role") || "Superadmin",
//   );
//   const [searchTerm, setSearchTerm] = useState("");
//   const id = localStorage.getItem("empId");
//   console.log("Fetching tasks for ID:", id);

//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchTasks = async () => {
//       try {
//         const response = await axios.get(
//           `${import.meta.env.VITE_BASE_URL}/task/getalltask/${id}`,
//         );
//         console.log("Full API Response:", response.data);

//         let taskList = response.data.tasks || response.data;

//         if (!Array.isArray(taskList)) {
//           throw new Error("Unexpected API response format");
//         }

//         const updatedTasks = taskList.map((task) => {
//           if (task.date) {
//             const dateObj = new Date(task.date);
//             task.date = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}/${dateObj.getFullYear().toString().slice(-2)}`;
//           }

//           if (task.createdAt) {
//             const createdAtObj = new Date(task.createdAt);
//             let hours = createdAtObj.getHours();
//             const minutes = createdAtObj
//               .getMinutes()
//               .toString()
//               .padStart(2, "0");
//             const seconds = createdAtObj
//               .getSeconds()
//               .toString()
//               .padStart(2, "0");
//             const ampm = hours >= 12 ? "PM" : "AM";
//             hours = hours % 12 || 12;
//             task.createDate = `${createdAtObj.getDate().toString().padStart(2, "0")}/${(createdAtObj.getMonth() + 1).toString().padStart(2, "0")}/${createdAtObj.getFullYear()}`;
//             task.createTime = `${hours}:${minutes}:${seconds} ${ampm}`;
//           }

//           return task;
//         });

//         setTasks(updatedTasks);
//       } catch (err) {
//         console.error("Error fetching tasks:", err);
//         setError("Failed to load task data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTasks();
//   }, [role, id]);

//   const handleDelete = async (taskId) => {
//     if (window.confirm("Are you sure you want to delete this task?")) {
//       try {
//         const response = await axios.delete(
//           `${import.meta.env.VITE_BASE_URL}/task/deletetask/${taskId}`,
//         );
//         if (response.status === 200) {
//           setTasks(tasks.filter((task) => task._id !== taskId));
//         }
//       } catch (err) {
//         setError("Failed to delete task");
//       }
//     }
//   };

//   const handleEdit = (taskId) => {
//     navigate(`/task-edit/${taskId}`);
//   };

//   const handleView = (task) => {
//     setSelectedTask(task);
//     setIsModalOpen(true);
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setSelectedTask(null);
//   };

//   const exportToExcel = () => {
//     const exportData = tasks.map((task, index) => ({
//       "S.No": index + 1,
//       "Task ID": task._id,
//       "Task Name": task.task,
//       Project: task.project,
//       Employee: task.empId,
//       Description: task.description,
//       Timeline: task.timeline,
//       Date: task.date,
//       Status: task.status,
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(exportData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Task Records");
//     XLSX.writeFile(
//       workbook,
//       `Task_Records_${new Date().toISOString().split("T")[0]}.xlsx`,
//     );
//   };

//   const filteredTasks = useMemo(() => {
//     if (!Array.isArray(tasks)) return [];

//     return tasks
//       .filter((task) => {
//         if (role === "Superadmin") return true;

//         // Employee can see Pending & In Progress
//         return (
//           task.status?.toLowerCase() === "pending" ||
//           task.status?.toLowerCase() === "in progress"
//         );
//       })
//       .filter(
//         (task) =>
//           task.task?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           task.status?.toLowerCase().includes(searchTerm.toLowerCase()),
//       );
//   }, [tasks, role, searchTerm]);

//   const applyDateFilter = () => {
//     if (!startDate || !endDate) {
//       alert("Please select both start and end dates.");
//       return;
//     }
//     const start = new Date(startDate.split("/").reverse().join("/"));
//     const end = new Date(endDate.split("/").reverse().join("/"));

//     const filteredTasks = tasks.filter((task) => {
//       const taskDateParts = task.date.split("/");
//       const taskDate = new Date(
//         `20${taskDateParts[2]}-${taskDateParts[1]}-${taskDateParts[0]}`,
//       );

//       return taskDate >= start && taskDate <= end;
//     });

//     setTasks(filteredTasks);
//   };

//   const columns = useMemo(
//     () => [
//       {
//         Header: "S.No",
//         accessor: (row, index) => index + 1,
//       },
//       {
//         Header: "Task Name",
//         accessor: "task",
//       },
//       {
//         Header: "Project",
//         accessor: "project",
//       },
//       {
//         Header: "Employee",
//         accessor: "empId",
//       },
//       {
//         Header: "Description",
//         accessor: "description",
//       },
//       {
//         Header: "Timeline",
//         accessor: "timeline",
//       },
//       {
//         Header: "Date",
//         accessor: "date",
//       },
//       {
//         Header: "Status",
//         accessor: "status",
//         Cell: ({ row }) => {
//           const handleStatusChange = async (e) => {
//             const updatedStatus = e.target.value;
//             try {
//               const taskId = row.original._id;
//               await axios.put(
//                 `${import.meta.env.VITE_BASE_URL}/task/update-status/${taskId}`,
//                 {
//                   status: updatedStatus,
//                 },
//               );
//               row.original.status = updatedStatus;
//               setTasks([...tasks]);
//             } catch (err) {
//               alert("Failed to update status");
//             }
//           };

//           const getStatusStyle = (status) => {
//             switch (status) {
//               case "Completed":
//                 return "bg-green-500 text-white";
//               case "In Progress":
//                 return "bg-yellow-500 text-white";
//               case "Pending":
//               default:
//                 return "bg-red-500 text-white";
//             }
//           };

//           return (
//             <select
//               value={row.original.status || "Pending"}
//               onChange={handleStatusChange}
//               className={`border p-2 rounded w-32 ${getStatusStyle(row.original.status)} `}
//             >
//               <option value="Pending">Pending</option>
//               <option value="In Progress">In Progress</option>
//               <option value="Completed">Completed</option>
//             </select>
//           );
//         },
//       },
//       {
//         Header: "Attachment",
//         accessor: "attachments",
//         Cell: ({ value }) => {
//           if (value) {
//             return (
//               <a
//                 href={value}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-blue-500 hover:underline"
//               >
//                 View Attachment
//               </a>
//             );
//           }
//           return <span>No Attachment</span>;
//         },
//       },
//       {
//         Header: "Created Date & Time",
//         accessor: "createDate",
//         Cell: ({ row }) =>
//           row.original.createDate && row.original.createTime ? (
//             <>
//               {row.original.createDate}
//               <br />
//               {row.original.createTime}
//             </>
//           ) : (
//             "N/A"
//           ),
//         id: "created_date_time",
//       },
//       {
//         Header: "Actions",
//         accessor: "_id",
//         Cell: ({ row }) => (
//           <div className="flex justify-center space-x-2">
//             <button
//               className="text-blue-500 hover:bg-blue-100 p-2 rounded-full transition-colors"
//               title="View Task"
//               onClick={() => handleView(row.original)}
//             >
//               <Eye size={20} />
//             </button>
//             <button
//               className={`text-green-500 p-2 rounded-full transition-colors ${role !== "Superadmin" ? "opacity-50 cursor-not-allowed" : "hover:bg-green-200"}`}
//               title="Delete Task"
//               onClick={() => handleDelete(row.original._id)}
//               disabled={role !== "Superadmin"}
//             >
//               <Trash2 size={20} />
//             </button>
//           </div>
//         ),
//       },
//     ],
//     [tasks],
//   );

//   const {
//     getTableProps,
//     getTableBodyProps,
//     headerGroups,
//     page,
//     prepareRow,
//     state,
//     setGlobalFilter,
//     nextPage,
//     previousPage,
//     canNextPage,
//     canPreviousPage,
//     pageOptions,
//   } = useTable(
//     {
//       columns,
//       data: filteredTasks,
//       initialState: { pageSize: 10 },
//     },
//     useGlobalFilter,
//     useSortBy,
//     usePagination,
//   );

//   const { globalFilter, pageIndex } = state;

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="text-xl">Loading...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex justify-center items-center h-screen text-red-500">
//         {error}
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto p-4">
//       <h2 className="text-4xl font-bold mb-10 text-center mt-24">
//         Task Details
//       </h2>

//       <div className="flex justify-between items-center mb-4">
//         <div className="relative">
//           <input
//             type="text"
//             value={globalFilter || ""}
//             onChange={(e) => setGlobalFilter(e.target.value)}
//             placeholder="Search records..."
//             className="border border-blue-500 p-2 rounded w-64 pl-8"
//           />
//           <FaFilter className="absolute left-2 top-3 text-blue-500" />
//         </div>
//         <div className="flex space-x-4 items-center -mt-6">
//           {role === "Superadmin" && (
//             <>
//               <div>
//                 <label htmlFor="startDate" className="block">
//                   Start Date
//                 </label>
//                 <input
//                   type="date"
//                   id="startDate"
//                   value={startDate}
//                   onChange={(e) => setStartDate(e.target.value)}
//                   className="border border-blue-500 p-2 rounded w-32"
//                 />
//               </div>
//               <div>
//                 <label htmlFor="endDate" className="block">
//                   End Date
//                 </label>
//                 <input
//                   type="date"
//                   id="endDate"
//                   value={endDate}
//                   onChange={(e) => setEndDate(e.target.value)}
//                   className="border border-blue-500 p-2 rounded w-32"
//                 />
//               </div>
//               <button
//                 onClick={applyDateFilter}
//                 className="bg-blue-500 text-white px-6 py-2 rounded h-10 w-auto text-sm mt-6"
//               >
//                 Apply Filter
//               </button>
//             </>
//           )}
//         </div>

//         <div className="flex space-x-4">
//           {role === "Superadmin" && (
//             <button
//               onClick={exportToExcel}
//               className="bg-green-500 text-white px-6 py-2 rounded flex items-center hover:bg-green-600"
//             >
//               <FaFileDownload className="mr-2" />
//               Export Data
//             </button>
//           )}

//           <Link
//             to="/task-form"
//             className="bg-blue-500 text-white px-6 py-2 rounded flex items-center hover:bg-blue-600"
//           >
//             <FaPlus className="mr-2" />
//             Add Task
//           </Link>
//         </div>
//       </div>

//       <div className="overflow-x-auto bg-white shadow-md rounded-lg">
//         {tasks.length === 0 ? (
//           <p className="text-center p-4">No task records found.</p>
//         ) : (
//           <>
//             {/* TABLE CONTAINER */}
//             <div className="w-full overflow-x-auto bg-white shadow-lg rounded-lg">
//               <table
//                 {...getTableProps()}
//                 className="min-w-max w-full whitespace-nowrap"
//               >
//                 {/* TABLE HEADER */}
//                 <thead className="bg-blue-600 text-white">
//                   {headerGroups.map((headerGroup) => (
//                     <tr {...headerGroup.getHeaderGroupProps()}>
//                       {headerGroup.headers.map((column) => (
//                         <th
//                           {...column.getHeaderProps(
//                             column.getSortByToggleProps(),
//                           )}
//                           className="px-4 py-3 text-center font-semibold"
//                         >
//                           {column.render("Header")}
//                           {column.isSorted
//                             ? column.isSortedDesc
//                               ? " 🔽"
//                               : " 🔼"
//                             : ""}
//                         </th>
//                       ))}
//                     </tr>
//                   ))}
//                 </thead>

//                 {/* TABLE BODY */}
//                 <tbody {...getTableBodyProps()}>
//                   {page.map((row) => {
//                     prepareRow(row);

//                     // 🎨 Row color based on status
//                     const status = row.original.status?.toLowerCase();
//                     const rowBg =
//                       status === "completed"
//                         ? "bg-green-100"
//                         : status === "in progress"
//                           ? "bg-yellow-50"
//                           : "bg-red-50";

//                     return (
//                       <tr
//                         {...row.getRowProps()}
//                         className={`${rowBg} hover:bg-opacity-80 transition`}
//                       >
//                         {row.cells.map((cell) => (
//                           <td
//                             {...cell.getCellProps()}
//                             className="px-4 py-3 text-center align-middle"
//                           >
//                             {cell.render("Cell")}
//                           </td>
//                         ))}
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>

//             <div className="flex justify-between items-center p-4">
//               <div>
//                 <span>
//                   Page{" "}
//                   <strong>
//                     {pageIndex + 1} of {pageOptions.length}
//                   </strong>
//                 </span>
//               </div>
//               <div className="space-x-2">
//                 <button
//                   onClick={() => previousPage()}
//                   disabled={!canPreviousPage}
//                   className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
//                 >
//                   Previous
//                 </button>
//                 <button
//                   onClick={() => nextPage()}
//                   disabled={!canNextPage}
//                   className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
//                 >
//                   Next
//                 </button>
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//       {isModalOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
//           <div className="bg-gradient-to-br from-white to-blue-100 p-6 rounded-xl shadow-2xl w-full max-w-md">
//             <h2 className="text-2xl font-bold mb-6 text-blue-800 border-b pb-2">
//               Task Details
//             </h2>

//             <div className="space-y-3">
//               <div>
//                 <strong className="text-gray-700">Task Name:</strong>{" "}
//                 <span className="text-gray-900">{selectedTask.task}</span>
//               </div>
//               <div>
//                 <strong className="text-gray-700">Project:</strong>{" "}
//                 <span className="text-gray-900">{selectedTask.project}</span>
//               </div>
//               <div>
//                 <strong className="text-gray-700">Employee:</strong>{" "}
//                 <span className="text-gray-900">{selectedTask.empId}</span>
//               </div>
//               <div>
//                 <strong className="text-gray-700">Description:</strong>{" "}
//                 <span className="text-gray-900">
//                   {selectedTask.description}
//                 </span>
//               </div>
//               <div>
//                 <strong className="text-gray-700">Timeline:</strong>{" "}
//                 <span className="text-gray-900">{selectedTask.timeline}</span>
//               </div>
//               <div>
//                 <strong className="text-gray-700">Date:</strong>{" "}
//                 <span className="text-gray-900">{selectedTask.date}</span>
//               </div>
//               <div>
//                 <strong className="text-gray-700">Status:</strong>{" "}
//                 <span className="text-gray-900">{selectedTask.status}</span>
//               </div>
//               <div>
//                 <strong className="text-gray-700">Attachment:</strong>{" "}
//                 {selectedTask.attachments ? (
//                   <a
//                     href={selectedTask.attachments}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="text-blue-500 hover:underline"
//                   >
//                     View Attachment
//                   </a>
//                 ) : (
//                   <span className="text-gray-500">No Attachment</span>
//                 )}
//               </div>
//             </div>

//             <div className="flex justify-end space-x-3 mt-6">
//               <button
//                 className={`bg-blue-500 text-white px-4 py-2 rounded-lg transition duration-300 ${role !== "Superadmin"
//                     ? "opacity-50 cursor-not-allowed"
//                     : "hover:bg-blue-600"
//                   }`}
//                 onClick={() => navigate(`/task-edit/${selectedTask._id}`)}
//                 disabled={role !== "Superadmin"}
//               >
//                 Edit
//               </button>
//               <button
//                 className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300"
//                 onClick={closeModal}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TaskList;