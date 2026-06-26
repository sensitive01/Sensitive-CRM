import React, { useState, useMemo, useEffect } from "react";
import {
    useTable,
    useGlobalFilter,
    useSortBy,
    usePagination,
} from "react-table";
import { FaPlus, FaFileDownload, FaFilter, FaEye, FaExclamationTriangle } from "react-icons/fa";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, color: 'red', zIndex: 9999, position: 'relative', background: 'white' }}>
                    <h2>Something went wrong in AttendanceTable.</h2>
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }
        return this.props.children;
    }
}


const AttendanceTableContent = () => {
    const employeeId = localStorage.getItem("empId");
    const [allAttendanceRecords, setAllAttendanceRecords] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [role, setRole] = useState(localStorage.getItem("role") || "Superadmin");

    const [showWorkReportModal, setShowWorkReportModal] = useState(false);
    const [workReport, setWorkReport] = useState("");
    const [attachment, setAttachment] = useState(null);
    const [currentRecordId, setCurrentRecordId] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [currentRecordDetails, setCurrentRecordDetails] = useState(null);

    const formatTimeFull = (timeString) => {
        if (!timeString) return null;
        const date = new Date(timeString);
        if (isNaN(date)) return timeString;
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        const paddedHours = hours.toString().padStart(2, "0");
        return `${paddedHours}:${minutes}:${seconds} ${ampm}`.toUpperCase();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date)) return dateString;
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // =========================
    // FETCH ATTENDANCE
    // =========================
    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BASE_URL}/attendance-all/${employeeId}`);
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.message || "Failed to fetch attendance data.");
                }
                const data = await response.json();
                data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setAllAttendanceRecords(data);
                const today = new Date().toISOString().split("T")[0];
                setAttendanceRecords(data.filter(record =>
                    record.createdAt && new Date(record.createdAt).toISOString().split("T")[0] === today
                ));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, [role, employeeId]);

    const openDetailsModal = (record) => { setCurrentRecordDetails(record); setShowDetailsModal(true); };
    const closeDetailsModal = () => { setShowDetailsModal(false); setCurrentRecordDetails(null); };
    const openWorkReportModal = (recordId) => { setCurrentRecordId(recordId); setShowWorkReportModal(true); };
    const closeWorkReportModal = () => { setShowWorkReportModal(false); setWorkReport(""); setAttachment(null); setCurrentRecordId(null); };
    const handleAttachmentChange = (e) => { setAttachment(e.target.files[0]); };

    const submitWorkReport = async () => {
        if (!workReport.trim()) { alert("Please fill in the work report before submitting."); return; }
        const logoutTime = new Date().toISOString(); // store ISO, format later
        const formData = new FormData();
        formData.append("logouttime", logoutTime);
        formData.append("workReport", workReport);
        if (attachment) formData.append("attachment", attachment);

        try {
            const response = await fetch(`https://sensitivetechcrm.onrender.com/attendance/logout/${currentRecordId}`, { method: "PUT", body: formData });
            if (!response.ok) throw new Error(await response.text());
            const result = await response.json();
            setAttendanceRecords(prevRecords =>
                prevRecords.map(rec => rec._id === currentRecordId
                    ? { ...rec, logouttime: logoutTime, workReport: workReport, attachment: result.updatedAttendance.attachment }
                    : rec
                )
            );
            alert("Logout time and work report submitted successfully.");
            closeWorkReportModal();
        } catch (err) {
            alert("Failed to submit work report. Please try again.");
            console.error(err);
        }
    };

    const exportToExcel = () => {
        const exportData = attendanceRecords.map((record, index) => ({
            "S.No": index + 1,
            "Employee ID": record.empId,
            Name: record.employeeName ? record.employeeName.toUpperCase() : "N/A",
            Status: record.createdAt ? "Present" : "Absent",
            Date: formatDate(record.createdAt),
            "Login Time": formatTimeFull(record.createdAt),
            "Logout Time": record.logouttime ? formatTimeFull(record.logouttime) : "Not Logged Out",
            "Work Report": record.workReport || "Not Submitted",
            "Attachment": record.attachment ? "Yes" : "No",
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Records");
        XLSX.writeFile(workbook, `Attendance_Records_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    const handleDateFilterChange = () => {
        const filteredData = allAttendanceRecords.filter(record => {
            if (!record.createdAt) return false;
            const recordDate = new Date(record.createdAt).toISOString().split("T")[0];
            const start = startDate ? new Date(startDate).toISOString().split("T")[0] : null;
            const end = endDate ? new Date(endDate).toISOString().split("T")[0] : null;
            if (start && recordDate < start) return false;
            if (end && recordDate > end) return false;
            return true;
        });
        setAttendanceRecords(filteredData);
    };

    const handleSearch = (value) => setGlobalFilter(value.toLowerCase());


    const getFileNameFromUrl = (url) => !url ? "Attachment" : url.split('/').pop().split('?')[0];

    const columns = useMemo(() => [
        { Header: "S.No", accessor: (row, index) => index + 1 },
        {
            Header: "Employee",
            accessor: row => `${row.employeeId || ""} ${row.employeeName || ""} `.toLowerCase(),
            Cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold">{row.original.employeeId || "N/A"}</span>
                    <span className="text-blue-600 font-semibold">{row.original.employeeName ? row.original.employeeName.toUpperCase() : "N/A"}</span>
                </div>
            ),
        },
        {
            Header: "Photo",
            accessor: "photo",
            Cell: ({ row }) => <img src={row.original.photo || "https://via.placeholder.com/150"} alt="Employee" className="w-12 h-12 rounded-full mx-auto object-cover" />,
        },
        { Header: "Date", accessor: row => formatDate(row.createdAt), className: "text-center" },
        {
            Header: "Login Time",
            accessor: "createdAt",
            Cell: ({ value }) => <span className="text-green-600 font-medium">{formatTimeFull(value)}</span>,
        },
        {
            Header: "Logout Time",
            accessor: "logouttime",
            Cell: ({ value }) =>
                value ? (
                    <span className="font-medium text-green-600 uppercase">{formatTimeFull(value)}</span>
                ) : (
                    <span className="text-red-600 font-bold flex items-center justify-center gap-1">
                        <FaExclamationTriangle />
                        Not Logged Out
                    </span>
                ),
        },
        {
            Header: "Work Report",
            accessor: "workReport",
            Cell: ({ value }) => (
                <div className="text-center w-full">
                    {value
                        ? (value.length > 25 ? `${value.substring(0, 25)}...` : value)
                        : (
                            <span className="text-orange-600 font-bold flex items-center justify-center gap-1">
                                <FaExclamationTriangle />
                                Not Submitted
                            </span>
                        )
                    }
                </div>
            ),
        },

        {
            Header: "Actions",
            accessor: "_id",
            Cell: ({ row }) => (
                <div className="flex space-x-2 justify-center">
                    <button onClick={() => openDetailsModal(row.original)} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center text-sm"><FaEye className="mr-1" />View</button>
                    {role !== "Superadmin" && (!row.original.logouttime ? (
                        <button onClick={() => openWorkReportModal(row.original._id)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">Set Logout</button>
                    ) : <span className="text-gray-500 text-sm">Logout Set</span>)}
                </div>
            )
        }
    ], [role]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        state,
        setGlobalFilter,
        nextPage,
        previousPage,
        canNextPage,
        canPreviousPage,
        pageOptions,
        setPageSize,
    } = useTable(
        {
            columns,
            data: attendanceRecords,
            initialState: { pageSize: 10, pageIndex: 0 },
        },
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    const { globalFilter, pageIndex, pageSize } = state;

    if (loading) return <p className="text-center p-6">Loading attendance records...</p>;
    if (error) return <p className="text-center text-red-500 p-6">Error: {error}</p>;

    return (
        <div className="mx-auto p-6">
            
            <h2 className="text-4xl font-bold mb-10 text-center mt-24">Attendance Records</h2>

            {/* FILTER & ACTIONS */}
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4 sticky top-0 bg-white z-10 p-2 shadow">
                <div className="relative">
                    <input
                        type="text"
                        value={globalFilter || ''}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search records..."
                        className="border border-blue-500 p-2 rounded w-64 pl-8"
                    />
                    <FaFilter className="absolute left-2 top-3 text-blue-500" />
                </div>

                <div className="flex space-x-4 items-center">
                    <div>
                        <label htmlFor="startDate" className="block">Start Date</label>
                        <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-blue-500 p-2 rounded w-32" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block">End Date</label>
                        <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-blue-500 p-2 rounded w-32" />
                    </div>
                    <button onClick={handleDateFilterChange} className="bg-blue-500 text-white px-6 py-2 rounded h-10 w-auto text-sm mt-6">Apply Filter</button>
                </div>

                <div className="flex space-x-4 flex-wrap">
                    {role === "Superadmin" && (
                        <button onClick={exportToExcel} className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 flex items-center w-auto sm:px-4 sm:py-2 text-xs sm:text-base flex-shrink-0">
                            <FaFileDownload className="mr-1" /> Export
                        </button>
                    )}
                    <Link to="/attendance-form" className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 flex items-center w-auto sm:px-4 sm:py-2 text-xs sm:text-base flex-shrink-0">
                        <FaPlus className="mr-1" /> Add Attendance
                    </Link>
                </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                <table {...getTableProps()} className="w-full text-center min-w-[900px]">
                    <thead className="bg-[#2563eb] text-white border-b sticky top-0">
                        {headerGroups.map((headerGroup, hgIndex) => (
                            <tr key={hgIndex} {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map((column) => (
                                    <th key={column.id} {...column.getHeaderProps(column.getSortByToggleProps())} className="p-4">{column.render("Header")}</th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody {...getTableBodyProps()}>
                        {page.map((row, rowIndex) => {
                            prepareRow(row);
                            return (
                                <tr key={row.id || rowIndex} {...row.getRowProps()} className="border-b hover:bg-gray-50">
                                    {row.cells.map((cell) => (
                                        <td key={cell.column.id} {...cell.getCellProps()} className="p-6">{cell.render("Cell")}</td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* PAGINATION */}
                <div className="flex justify-between items-center p-4 sticky bottom-0 bg-white shadow">
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-700">Page {pageIndex + 1} of {pageOptions.length}</span>
                        <select value={state.pageSize} onChange={e => setPageSize(Number(e.target.value))} className="border border-gray-300 rounded px-3 py-1 text-sm">
                            {[10, 25, 50, 100].map(ps => <option key={ps} value={ps}>Show {ps}</option>)}
                        </select>
                    </div>

                    <div className="flex space-x-2">
                        <button onClick={previousPage} disabled={!canPreviousPage} className={`px-4 py-2 rounded-md ${!canPreviousPage ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'}`}>Previous</button>
                        <button onClick={nextPage} disabled={!canNextPage} className={`px-4 py-2 rounded-md ${!canNextPage ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}>Next</button>
                    </div>
                </div>
            </div>

               {/* Work Report Modal */}
         {showWorkReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Submit Work Report</h3>
                        <div className="mb-4">
                            <label htmlFor="workReport" className="block text-sm font-medium text-gray-700 mb-1">
                                Work Report <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="workReport"
                                value={workReport}
                                onChange={(e) => setWorkReport(e.target.value)}
                                className="w-full border border-gray-300 rounded p-2 min-h-[150px]"
                                placeholder="Please provide details of your work today..."
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-1">
                                Attachment (Optional)
                            </label>
                            <input
                                type="file"
                                id="attachment"
                                onChange={handleAttachmentChange}
                                className="w-full border border-gray-300 rounded p-2"
                            />
                            <p className="text-xs text-gray-500 mt-1">Upload any supporting documents (max size: 5MB)</p>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={closeWorkReportModal}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitWorkReport}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {showDetailsModal && currentRecordDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-green-600 font-bold text-xl">Attendance Details</h3>
                            <button
                                onClick={closeDetailsModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center space-x-4">
                                <img
                                    src={currentRecordDetails.photo || "https://via.placeholder.com/150"}
                                    alt="Employee"
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                                <div>
                                    <h4 className="text-blue-600 font-semibold">{currentRecordDetails.employeeName}</h4>
                                    <p className="text-sm text-gray-600">ID: {currentRecordDetails.employeeId}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                   <span className={`font-semibold ${
                                            currentRecordDetails.createdAt
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }`}>
                                            {currentRecordDetails.createdAt ? "Present" : "Absent"}
                                        </span>

                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Date:</span>
                                    <span className="font-medium">
                                        {new Intl.DateTimeFormat("en-GB", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "2-digit",
                                        }).format(new Date(currentRecordDetails.createdAt))}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                               <div className="flex justify-between">
                                    <span className="text-gray-600">Login Time:</span>
                                    <span className="font-medium text-green-600">
                                        {formatTimeFull(currentRecordDetails.createdAt)}
                                    </span>
                                </div>

                                                            <div className="flex justify-between">
                                    <span className="text-gray-600">Logout Time:</span>
                                    {currentRecordDetails.logouttime ? (
                                        <span className="font-medium text-green-600 uppercase">
                                            {formatTimeFull(currentRecordDetails.logouttime)}
                                        </span>
                                    ) : (
                                        <span className="text-red-600 font-bold flex items-center">
                                            <FaExclamationTriangle className="mr-1" />
                                            Not Logged Out
                                        </span>
                                    )}
                                </div>

                            </div>

                            {currentRecordDetails.ipAddress && (
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">IP Address:</span>
                                        <span className="font-medium">
                                            {currentRecordDetails.ipAddress}
                                        </span>
                                    </div>
                                    {currentRecordDetails.location && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Location:</span>
                                            <span className="font-medium">
                                                {currentRecordDetails.location}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mb-6">
                            <h2 className="text-blue-600 font-bold text-xl mb-3 border-b border-gray-200 pb-2">
                                Work Report
                            </h2>
                            <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto whitespace-pre-wrap break-words text-gray-700">
                                {currentRecordDetails.workReport ? (
                                    currentRecordDetails.workReport
                                ) : (
                                    <span className="text-orange-600 font-bold flex items-center">
                                        <FaExclamationTriangle className="mr-1" />
                                        No work report submitted.
                                    </span>
                                )}
                            </div>
                        </div>

                        {currentRecordDetails.attachment && (
                            <div className="mb-6">
                                <h4 className="font-semibold mb-2">Attachment</h4>
                                <div className="flex items-center space-x-4">
                                    <a
                                        href={currentRecordDetails.attachment}
                                        download={getFileNameFromUrl(currentRecordDetails.attachment)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-500 hover:text-green-700 flex items-center"
                                    >
                                        <FaEye className="mr-1" />
                                        View Attachment
                                    </a>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={closeDetailsModal}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        
    
    );
};

const AttendanceTable = () => (
    <ErrorBoundary>
        <AttendanceTableContent />
    </ErrorBoundary>
);

export default AttendanceTable;