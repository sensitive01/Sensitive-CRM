import { useMemo, useEffect, useState } from 'react';
import { useTable, useGlobalFilter, useSortBy, usePagination } from 'react-table';
import { Eye, Trash } from 'lucide-react';
import { FaFileDownload, FaFilter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { deleteQuotations, getTotalQuotations } from '../../api/services/projectServices';

const QuotationTable = () => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isFilterApplied, setIsFilterApplied] = useState(false);

    const navigate = useNavigate();

    const fetchQuotationData = async () => {
        try {
            const response = await getTotalQuotations();
            if (response.status === 200) {
                const quotationData = Array.isArray(response.data) ? response.data : response.data.quotations || [];
                setQuotations(quotationData);
            } else {
                setError('Failed to load quotation data');
            }
        } catch (error) {
            setError('Failed to load quotation data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotationData();
    }, []);

    const handleEdit = (quotationId) => {
        navigate(`/quotation-edit/${quotationId}`);
    };

    const handleView = (quotation) => {
        setSelectedQuotation(quotation);
        setIsModalOpen(true);
    };

    const handleDelete = async (quotation) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this quotation?");
        if (!confirmDelete) return;
    
        try {
            await deleteQuotations(quotation._id);
            setQuotations(prevQuotations => prevQuotations.filter(q => q._id !== quotation._id));
            alert("Quotation deleted successfully!");
        } catch (error) {
            console.error("Error deleting quotation:", error);
            alert("Failed to delete quotation. Please try again.");
        }
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedQuotation(null);
    };

    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(quotations);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Quotations");
        XLSX.writeFile(workbook, "quotations.xlsx");
    };

    const applyDateFilter = () => {
        if (!startDate || !endDate) {
            alert('Please select both start and end dates.');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        const filteredQuotations = quotations.filter((quotation) => {
            const quotationDate = new Date(quotation.quotationDate || quotation.createdAt);
            return quotationDate >= start && quotationDate <= end;
        });

        setQuotations(filteredQuotations);
        setIsFilterApplied(true);
    };

    const clearDateFilter = () => {
        setStartDate("");
        setEndDate("");
        setIsFilterApplied(false);
        fetchQuotationData();
    };
    const columns = useMemo(() => [
        { Header: 'S.No', accessor: (row, index) => index + 1 },
        { Header: 'Name', accessor: 'name' },
        { Header: 'Contact', accessor: 'contact' },
        { Header: 'Company', accessor: 'company' },
        { Header: 'Requirement', accessor: 'requirement' },
        { Header: 'Tech Stack', accessor: 'techStack' },
        { Header: 'Quote', accessor: 'quote' },
        { Header: 'Note', accessor: 'note' },
        {
            Header: 'Quotation',
            accessor: 'quotation',
            Cell: ({ value }) => (
                value ? (
                    <a 
                        href={value} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-500 underline"
                    >
                        {value.split('/').pop()} 
                    </a>
                ) : 'N/A'
            ),
        },
        { Header: 'Status', accessor: 'status' },
        {
            Header: 'Quotation Date & Time',
            accessor: 'quotationDate',
            Cell: ({ value }) =>
                value ? (
                    <>
                        {new Date(value).toLocaleDateString('en-GB')}
                       
                        {new Date(value).toLocaleTimeString()}
                    </>
                ) : (
                    'N/A'
                ),
            id: 'date_time',
        },
        {
            Header: 'Created Date & Time',
            accessor: 'createdAt',
            Cell: ({ value }) =>
                value ? (
                    <>
                        {new Date(value).toLocaleDateString('en-GB')} 
                        {new Date(value).toLocaleTimeString()}
                    </>
                ) : (
                    'N/A'
                ),
            id: 'created_date_time',
        },
        
        {
            Header: 'Actions',
            accessor: '_id',
            Cell: ({ row }) => (
                <div className="flex justify-center space-x-2">
                    <button
                        className="text-blue-500 hover:bg-blue-100 p-2 rounded-full"
                        title="View Quotation"
                        onClick={() => handleView(row.original)}
                    >
                        <Eye size={20} />
                    </button>
                    <button
                        className="text-red-500 hover:bg-red-100 p-2 rounded-full"
                        title="Delete Quotation"
                        onClick={() => handleDelete(row.original)}
                    >
                        <Trash size={20} />
                    </button>
                </div>
            ),
        },
    ], []);

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
        pageOptions
    } = useTable(
        {
            columns,
            data: quotations,
            initialState: { pageSize: 10 }
        },
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    const { globalFilter, pageIndex } = state;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen text-red-500">
                {error}
            </div>
        );
    }

    return (
        <div className="mx-auto p-4 mt-12">
            <h2 className="text-4xl font-bold mb-10 text-center mt-12">
                Quotations Table
            </h2>
            <div className="mt-12">
                <div className="flex justify-between items-center mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={globalFilter || ''}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            placeholder="Search records..."
                            className="border border-blue-500 p-2 rounded w-64 pl-8"
                        />
                        <FaFilter className="absolute left-2 top-3 text-blue-500" />
                    </div>

                    <div className="flex space-x-4 items-center -mt-6">
                        <div>
                            <label htmlFor="startDate" className="block">Start Date</label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border border-blue-500 p-2 rounded w-32"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block">End Date</label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border border-blue-500 p-2 rounded w-32"
                            />
                        </div>
                        <button
                            onClick={applyDateFilter}
                            className="bg-blue-500 text-white px-6 py-2 rounded h-10 w-auto text-sm mt-6"
                        >
                            Apply Filter
                        </button>
                        {isFilterApplied && (
                            <button
                                onClick={clearDateFilter}
                                className="bg-gray-500 text-white px-6 py-2 rounded h-10 w-auto text-sm mt-6 ml-4"
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => navigate('/quotation-form')}
                            className="bg-blue-500 text-white px-6 py-2 rounded flex items-center hover:bg-blue-600"
                        >
                            + Create Quotation
                        </button>
                        <button onClick={downloadExcel} className="bg-green-500 text-white px-6 py-2 rounded flex items-center hover:bg-green-600">
                            <FaFileDownload className="mr-2" /> Export Data
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                    {quotations.length === 0 ? (
                        <p className="text-center p-4">No quotation records found.</p>
                    ) : (
                        <>
                           <table {...getTableProps()} className="w-full">
  <thead className="bg-[#2563eb] text-white border-b">
    {headerGroups.map(headerGroup => (
      <tr {...headerGroup.getHeaderGroupProps()}>
        {headerGroup.headers.map(column => (
          <th
            {...column.getHeaderProps(column.getSortByToggleProps())}
            className="p-4 text-center cursor-pointer whitespace-nowrap" // <-- changed text-left → text-center
          >
            <div className="flex items-center justify-center"> {/* center content */}
              {column.render('Header')}
              <span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
            </div>
          </th>
        ))}
      </tr>
    ))}
  </thead>

  <tbody {...getTableBodyProps()}>
    {page.map(row => {
      prepareRow(row);
      return (
        <tr {...row.getRowProps()} className="border-b hover:bg-gray-50 transition-colors">
          {row.cells.map(cell => (
            <td
              {...cell.getCellProps()}
              className="p-4 text-center whitespace-nowrap" // <-- center-align cells
            >
              {cell.render('Cell')}
            </td>
          ))}
        </tr>
      );
    })}
  </tbody>
</table>


                            <div className="flex justify-between items-center p-4">
                                <div>
                                    <span>
                                        Page <strong>{pageIndex + 1} of {pageOptions.length}</strong>
                                    </span>
                                </div>
                                <div className="space-x-2">
                                    <button
                                        onClick={() => previousPage()}
                                        disabled={!canPreviousPage}
                                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => nextPage()}
                                        disabled={!canNextPage}
                                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
              {isModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full sm:w-3/4 md:w-2/3 lg:w-1/2 max-h-[80vh] overflow-y-auto flex flex-col">
      
      {/* Header */}
      <div className="bg-indigo-600 text-white rounded-t-2xl px-6 py-4 flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Quotation Details</h2>
        <button 
          onClick={closeModal} 
          className="text-white text-2xl font-bold hover:text-gray-200 transition"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {selectedQuotation && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
            
            {/* Left Column */}
            <div className="space-y-2">
              <p><span className="font-semibold text-gray-800">Client Name:</span> {selectedQuotation.name}</p>
              <p><span className="font-semibold text-gray-800">Contact:</span> {selectedQuotation.contact}</p>
              <p><span className="font-semibold text-gray-800">Company:</span> {selectedQuotation.company}</p>
              <p><span className="font-semibold text-gray-800">Requirement:</span> {selectedQuotation.requirement}</p>
              <p><span className="font-semibold text-gray-800">Tech Stack:</span> {selectedQuotation.techStack}</p>
            </div>

            {/* Right Column */}
            <div className="space-y-2">
              <p><span className="font-semibold text-gray-800">Quote Amount:</span> {selectedQuotation.quote}</p>
              <p><span className="font-semibold text-gray-800">Status:</span> {selectedQuotation.status}</p>
              <p><span className="font-semibold text-gray-800">Date:</span> {new Date(selectedQuotation.quotationDate || selectedQuotation.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</p>
              <p><span className="font-semibold text-gray-800">Notes:</span> {selectedQuotation.note}</p>
              <p><span className="font-semibold text-gray-800">Update Log:</span> {selectedQuotation.updateLog}</p>
              {selectedQuotation.quotation && (
                <p>
                  <span className="font-semibold text-gray-800">Quotation File:</span> 
                  <a 
                    href={selectedQuotation.quotation} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-indigo-600 underline ml-1 hover:text-indigo-800 transition"
                  >
                    {selectedQuotation.quotation.split('/').pop()}
                  </a>
                </p>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="px-6 py-4 bg-gray-50 flex justify-end gap-4 rounded-b-2xl">
        <button
          onClick={() => handleEdit(selectedQuotation._id)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
        >
          Edit
        </button>
        <button
          onClick={closeModal}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition"
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}

            </div>
        </div>
    );
};

export default QuotationTable;