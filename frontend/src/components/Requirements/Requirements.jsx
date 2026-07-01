import React, { useState, useEffect, useMemo } from "react";
import { FaPlus, FaFilter } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  useTable,
  useGlobalFilter,
  usePagination,
} from "react-table";

const Requirements = () => {
  const [submissions, setSubmissions] = useState([]);
  const navigate = useNavigate();

  /* ---------------- LOAD DATA FROM API OR LOCAL STORAGE ---------------- */
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        // Fetch from backend API first
        const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/preview`);
        if (res.ok) {
          const data = await res.json();
          setSubmissions(data);
        } else {
          // Fallback to localStorage if API fails
          const existing = JSON.parse(localStorage.getItem("submissions") || "[]");
          const withId = existing.map((item, idx) => ({
            ...item,
            _id: item._id || `local-${idx}`,
          }));
          setSubmissions(withId);
        }
      } catch (err) {
        console.error("Error fetching submissions:", err);
        const existing = JSON.parse(localStorage.getItem("submissions") || "[]");
        const withId = existing.map((item, idx) => ({
          ...item,
          _id: item._id || `local-${idx}`,
        }));
        setSubmissions(withId);
      }
    };

    fetchSubmissions();
  }, []);

  /* ---------------- VIEW HANDLER ---------------- */
const handlePreview = (row) => {
  if (!row._id) {
    alert("Cannot preview this item, missing ID");
    return;
  }
  navigate(`/preview/${row._id}`);
};

/* ---------------- DELETE HANDLER ---------------- */
const handleDelete = async (row) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this requirement?"
  );

  if (!confirmDelete) return;

  try {
    // Delete from backend if it exists in DB
    if (row._id && !row._id.startsWith("local-")) {
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/preview/${row._id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error("Delete failed");
      }
    }

    // Update UI immediately
    setSubmissions((prev) =>
      prev.filter((item) => item._id !== row._id)
    );

    // Remove from localStorage fallback
    const existing = JSON.parse(localStorage.getItem("submissions") || "[]");
    const updated = existing.filter((item) => item._id !== row._id);
    localStorage.setItem("submissions", JSON.stringify(updated));
  } catch (err) {
    console.error("Delete error:", err);
    alert("Failed to delete requirement");
  }
};


  /* ---------------- HELPERS ---------------- */
  const hasData = (val) => {
    if (!val) return false;
    if (typeof val === "object") {
      if (Object.keys(val).length === 0) return false;
      return Object.values(val).some((v) => Boolean(v));
    }
    return Boolean(val);
  };

  const renderDevRequirements = (requirements) => {
    const dev = requirements?.["Step 1 – Development Requirements"];
    if (!dev) return "—";
    const activeItems = Object.entries(dev)
      .filter(([_, val]) => hasData(val))
      .map(([key]) => key);

    if (activeItems.length === 0) return "—";

    return (
      <ol className="list-decimal pl-4 text-left">
        {activeItems.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    );
  };

  const renderPurchaseRequirements = (requirements) => {
    const purchase = requirements?.["Step 3 – Purchases Requirements"];
    if (!purchase) return "—";
    const activeItems = Object.entries(purchase)
      .filter(([_, val]) => hasData(val))
      .map(([key]) => key);

    if (activeItems.length === 0) return "—";

    return (
      <ol className="list-decimal pl-4 text-left">
        {activeItems.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    );
  };

  /* ---------------- TABLE COLUMNS ---------------- */
  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        Cell: ({ row }) => row.index + 1,
      },
      {
        Header: "Client Name",
        accessor: (row) => row.clientInfo?.name || "N/A",
      },
      {
        Header: "Development Requirements",
        Cell: ({ row }) => renderDevRequirements(row.original.requirements),
      },
      {
        Header: "Purchase Requirements",
        Cell: ({ row }) => renderPurchaseRequirements(row.original.requirements),
      },
      {
        Header: "Action",
        Cell: ({ row }) => (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handlePreview(row.original)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              View
            </button>

            <button
              onClick={() => handleDelete(row.original)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    []
  );

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
    { columns, data: submissions, initialState: { pageSize: 5 } },
    useGlobalFilter,
    usePagination
  );

  const { globalFilter, pageIndex } = state;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-center mb-6">
        Requirements Details
      </h2>

      <div className="flex justify-between mb-4">
        <div className="relative">
          <input
            value={globalFilter || ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search..."
            className="border px-3 py-2 rounded pl-8"
          />
          <FaFilter className="absolute left-2 top-3 text-gray-500" />
        </div>

        <button
          onClick={() => window.open("/requirements-form", "_blank")}
          className="bg-blue-600 text-white px-5 py-2 rounded"
        >
          <FaPlus className="inline mr-2" />
          Add Requirement
        </button>
      </div>

      {submissions.length === 0 ? (
        <p className="text-center">No requirements found.</p>
      ) : (
        <>
          <table {...getTableProps()} className="w-full border">
            <thead className="bg-blue-600 text-white">
              {headerGroups.map((hg) => (
                <tr {...hg.getHeaderGroupProps()}>
                  {hg.headers.map((col) => (
                    <th {...col.getHeaderProps()} className="p-3 text-center">
                      {col.render("Header")}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody {...getTableBodyProps()}>
              {page.map((row) => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()} className="border-b align-top">
                    {row.cells.map((cell) => (
                      <td {...cell.getCellProps()} className="p-3">
                        {cell.render("Cell")}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex justify-between mt-4">
            <span>
              Page {pageIndex + 1} of {pageOptions.length}
            </span>
            <div>
              <button
                onClick={previousPage}
                disabled={!canPreviousPage}
                className="px-4 py-2 bg-gray-600 text-white mr-2 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={nextPage}
                disabled={!canNextPage}
                className="px-4 py-2 bg-gray-600 text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Requirements;
