import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { FaFileDownload, FaFilter } from "react-icons/fa";
import {
  useTable,
  useGlobalFilter,
  useSortBy,
  usePagination,
} from "react-table";
import { useNavigate } from "react-router-dom";

const LeadEdit = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [role, setRole] = useState(
    localStorage.getItem("role") || "Superadmin",
  );
  const [lead, setLead] = useState({
    disposition: "",
    notes: "",
  });

  const dispositionOptions = [
    "No requirements",
    "Callback",
    "Busy",
    "Disconnected",
    "RNR / Voicemail",
    "Not interested",
    "Request Quote",
    "Quotation Sent",
    "Follow up",
    "Invalid Number",
    "Taken outside",
    "Requirement on hold",
    "Escalated",
    "Schedule Meeting",
    "Deal Closed",
    "Others",
  ];

  useEffect(() => {
    const fetchLeadData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/updatelog/getdispositions`,
        );
        if (response.status === 200) {
          let data = response.data;
          if (role === "Lead") {
            const today = new Date().toISOString().split("T")[0];
            data = data.filter(
              (lead) => lead.createdAt.split("T")[0] === today,
            );
          }
          setLeads(data);
        } else {
          console.error("Failed to fetch lead details:", response.status);
        }
      } catch (error) {
        console.error("Error fetching lead details:", error);
        setError("Failed to load lead data");
      } finally {
        setLoading(false);
      }
    };
    fetchLeadData();
  }, [role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLead((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/updatelog/disposition`,
        lead,
      );
      if (response.status === 201) {
        alert("Lead data submitted successfully!");
        setLead({ disposition: "", notes: "" });
        setLeads((prev) => [...prev, response.data]);
      } else {
        alert(`Error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error submitting lead data:", error);
      alert(`Submission failed: ${error.message}`);
    }
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(leads);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, "leads.xlsx");
  };

  const applyDateFilter = () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const filteredData = leads.filter((lead) => {
      const leadDate = new Date(lead.createdAt);
      return leadDate >= start && leadDate <= end;
    });
    setFilteredLeads(filteredData);
  };

  const columns = useMemo(
    () => [
      { Header: "S.No", accessor: (row, index) => index + 1 },
      { Header: "Disposition", accessor: "disposition" },
      { Header: "Notes", accessor: "notes" },
      {
        Header: "Date",
        accessor: "createdAt",
        Cell: ({ value }) => new Date(value).toLocaleDateString("en-GB"),
        id: "date",
      },
      {
        Header: "Time",
        accessor: "createdAt",
        Cell: ({ value }) => new Date(value).toLocaleTimeString(),
        id: "time",
      },
    ],
    [leads],
  );

  const tableData = filteredLeads.length > 0 ? filteredLeads : leads;

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
  } = useTable(
    { columns, data: tableData, initialState: { pageSize: 10 } },
    useGlobalFilter,
    useSortBy,
    usePagination,
  );

  const { globalFilter, pageIndex } = state;

  if (loading) return <div className="text-center mt-24">Loading...</div>;
  if (error)
    return <div className="text-center mt-24 text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 mt-20">
      {/* Title */}
      <div className="flex justify-center mb-8">
        <h2 className="text-4xl font-bold px-6 py-3 bg-gradient-to-r from-indigo-300 to-indigo-100 text-indigo-800 rounded-lg shadow-md inline-block">
          Call Logs
        </h2>
      </div>

      {/* Lead Form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-all"
      >
        <div>
          <label className="block font-medium text-gray-700 mb-2">
            Disposition
          </label>
          <select
            name="disposition"
            value={lead.disposition}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400 transition-all"
          >
            <option value="">Select Disposition</option>
            {dispositionOptions.map((option, i) => (
              <option key={i} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            name="notes"
            value={lead.notes}
            onChange={handleChange}
            placeholder="Enter notes..."
            className="w-full border border-gray-300 p-3 rounded-lg h-28 focus:ring-2 focus:ring-indigo-400 transition-all"
          />
        </div>

        <div className="flex items-end space-x-4 col-span-2">
          <button
            type="submit"
            className="bg-indigo-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-indigo-600 shadow-md transition-all"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-300 text-gray-800 font-semibold px-6 py-2 rounded-lg hover:bg-gray-400 shadow-md transition-all"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Filter & Export */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-10 mb-4 space-y-4 md:space-y-0">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={globalFilter || ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search leads..."
            className="w-full border border-indigo-300 p-3 rounded-lg pl-10 focus:ring-2 focus:ring-indigo-400 transition-all"
          />
          <FaFilter className="absolute left-3 top-3 text-indigo-400" />
        </div>

        {role === "Superadmin" && (
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-indigo-300 p-2 rounded-lg"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-indigo-300 p-2 rounded-lg"
            />
            <button
              onClick={applyDateFilter}
              className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-all"
            >
              Apply Filter
            </button>
            <button
              onClick={downloadExcel}
              className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-600 transition-all"
            >
              <FaFileDownload className="mr-2" /> Export
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow-lg rounded-xl border border-gray-200">
        {leads.length === 0 ? (
          <p className="text-center p-6">No lead records found.</p>
        ) : (
          <>
            <table {...getTableProps()} className="w-full text-center">
              <thead className="bg-indigo-500 text-white">
                {headerGroups.map((headerGroup) => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column) => (
                      <th
                        {...column.getHeaderProps(
                          column.getSortByToggleProps(),
                        )}
                        className="p-4 cursor-pointer"
                      >
                        <div className="flex items-center justify-center">
                          {column.render("Header")}
                          <span>
                            {column.isSorted
                              ? column.isSortedDesc
                                ? " 🔽"
                                : " 🔼"
                              : ""}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody {...getTableBodyProps()}>
                {page.map((row) => {
                  prepareRow(row);
                  return (
                    <tr
                      {...row.getRowProps()}
                      className="border-b hover:bg-indigo-50 transition-colors"
                    >
                      {row.cells.map((cell) => (
                        <td {...cell.getCellProps()} className="p-4">
                          {cell.render("Cell")}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center p-4">
              <span>
                Page{" "}
                <strong>
                  {pageIndex + 1} of {pageOptions.length}
                </strong>
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => previousPage()}
                  disabled={!canPreviousPage}
                  className="px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50 hover:bg-indigo-600 transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
                  className="px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50 hover:bg-indigo-600 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LeadEdit;
