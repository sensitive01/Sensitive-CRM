import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Eye } from 'lucide-react';
import { FaFileDownload, FaFilter } from 'react-icons/fa';
import { useTable, useGlobalFilter, useSortBy, usePagination } from 'react-table';
import { getTotalPayments } from '../../api/services/projectServices';

const PaymentTable = () => {
    const [payments, setPayments] = useState([]);
    const [allPayments, setAllPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isFilterApplied, setIsFilterApplied] = useState(false);

    const navigate = useNavigate();

    const fetchPaymentData = async () => {
        try {
            const response = await getTotalPayments();
            console.log("total payment fetched:", response);

            if (response.status === 200) {
                const paymentData = Array.isArray(response.data) ? response.data : response.data.payments || [];
                setPayments(paymentData);
                setAllPayments(paymentData);
            } else {
                console.error("Failed to fetch payment details:", response.status);
            }
        } catch (error) {
            console.error("Error fetching payment details:", error);
            setError('Failed to load payment data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPaymentData();
    }, []);

    const handleEdit = (paymentId) => {
        navigate(`/payments-edit/${paymentId}`);
    };

    const handleView = (payment) => {
        setSelectedPayment(payment);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedPayment(null);
    };
    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(payments); 
        const workbook = XLSX.utils.book_new(); 
        XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
        XLSX.writeFile(workbook, "payments.xlsx"); 
    };

    const applyDateFilter = () => {
        if (!startDate || !endDate) {
            alert('Please select both start and end dates.');
            return;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
    
        const filteredPayments = allPayments.filter((payment) => {
            const paymentDate = new Date(payment.createdAt);
            return paymentDate >= start && paymentDate <= end;
        });
    
        setPayments(filteredPayments);
        setIsFilterApplied(true);
    };

    const clearFilter = () => {
        setStartDate("");
        setEndDate("");
        setIsFilterApplied(false);
        setGlobalFilter("");
        setPayments(allPayments);
    };
    
    const columns = useMemo(() => [
        { Header: 'S.No', accessor: (row, index) => index + 1 },
        { Header: 'Project', accessor: 'project' },
        { Header: 'Payment Type', accessor: 'paymentType' },
        { Header: 'Amount', accessor: 'amount' },
        { Header: 'Mode', accessor: 'mode' },
        {
            Header: 'Date',
            accessor: 'date',
            Cell: ({ value }) => new Date(value).toLocaleDateString('en-GB') // Format date
        },
        { Header: 'TDS Applicable', accessor: 'tdsApplicable' },
        { Header: 'Tax Applicable', accessor: 'taxApplicable' },
        { Header: 'Payment Ref. No.', accessor: 'paymentReferenceNumber' },
        {
            Header: 'Payment Quotation',
            accessor: 'paymentQuotation',
            Cell: ({ value }) => (
                <div>
                    {value ? (
                        <img
                            src={value}
                            alt="Payment Quotation"
                            className="w-10 h-10 object-cover rounded"
                        />
                    ) : (
                        <span>No Quotation</span>
                    )}
                </div>
            ),
        },
        {
            Header: 'Payment Proof',
            accessor: 'paymentProof',
            Cell: ({ value }) => (
                <div>
                    {value ? (
                        <img
                            src={value}
                            alt="Payment Proof"
                            className="w-10 h-10 object-cover rounded"
                        />
                    ) : (
                        <span>No Proof</span>
                    )}
                </div>
            ),
        },
        {
            Header: 'Created Date & Time',
            accessor: 'createdAt',
            Cell: ({ value }) =>
                value ? (
                    new Date(value).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                    }) +
                    ' ' +
                    new Date(value).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                    })
                ) : 'N/A',
            id: 'created_date_time',
        },
        {
            Header: 'Updated Date & Time',
            accessor: 'updatedAt',
            Cell: ({ value }) =>
                value ? (
                    new Date(value).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                    }) +
                    ' ' +
                    new Date(value).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                    })
                ) : 'N/A',
            id: 'updated_date_time',
        },
        
        
        { Header: 'Notes', accessor: 'notes' },
        {
            Header: 'Actions',
            accessor: '_id',
            Cell: ({ row }) => (
                <div className="flex justify-center space-x-2">
                    <button
                        className="text-blue-500 hover:bg-blue-100 p-2 rounded-full"
                        title="View Expense"
                        onClick={() => handleView(row.original)}
                    >
                        <Eye size={20} />
                    </button>
                </div>
            ),
        }
    ], [payments]);

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
            data: payments,
            initialState: { pageSize: 10 }
        },
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    const { globalFilter, pageIndex } = state;
    console.log("Payments before rendering:", payments);

    if (loading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      );
    }
    if (error) return <div>{error}</div>;

    return (
        <div className=" mx-auto p-4 mt-6">
            <h2 className="text-4xl font-bold mb-10 text-center mt-24">
             Payments Details
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
                        {(isFilterApplied || globalFilter) && (
                            <button
                                onClick={clearFilter}
                                className="bg-gray-500 text-white px-6 py-2 rounded h-10 w-auto text-sm mt-6 ml-4"
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => navigate('/payments-form')}
                            className="bg-blue-500 text-white px-6 py-2 rounded flex items-center hover:bg-blue-600"
                        >
                            Add Payment
                        </button>
                        <button onClick={downloadExcel} className="bg-green-500 text-white px-6 py-2 rounded flex items-center hover:bg-green-600">
                            <FaFileDownload className="mr-2" /> Export Data
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto bg-white shadow-md rounded-lg">
  {payments.length === 0 ? (
    <p className="text-center p-4">No payment records found.</p>
  ) : (
    <>
      <table {...getTableProps()} className="w-full table-auto text-center">
        <thead className="bg-[#2563eb] text-white border-b">
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  className="p-3 text-center cursor-pointer whitespace-nowrap"
                >
                  <div className="flex items-center justify-center">
                    {column.render('Header')}
                    <span>
                      {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                    </span>
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
              <tr
                {...row.getRowProps()}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                {row.cells.map(cell => (
                  <td
                    {...cell.getCellProps()}
                    className="p-3 text-center whitespace-nowrap"
                  >
                    {cell.render('Cell')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination */}
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
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
    
    <div className="bg-white rounded-2xl shadow-2xl w-full sm:w-2/3 md:w-1/2 lg:w-1/3 max-h-[520px] overflow-auto flex flex-col">

      {/* Header */}
      <div className="flex justify-between items-center bg-indigo-600 rounded-t-2xl px-6 py-4 shadow-md">
        <h2 className="text-2xl font-bold text-white">
          Payment Details
        </h2>
        <button
          onClick={closeModal}
          className="text-white text-2xl font-bold hover:text-gray-200 transition"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col md:flex-row gap-6">

        {/* Left Section */}
        <div className="w-full md:w-1/2 bg-gray-50 rounded-xl p-4 shadow-inner space-y-2 text-sm">
          {selectedPayment && (
            <>
              <p><span className="font-semibold text-gray-600">Project:</span> {selectedPayment.project}</p>
              <p><span className="font-semibold text-gray-600">Payment Type:</span> {selectedPayment.paymentType}</p>
              <p><span className="font-semibold text-gray-600">Amount:</span> {selectedPayment.amount}</p>
              <p><span className="font-semibold text-gray-600">Mode:</span> {selectedPayment.mode}</p>
              <p><span className="font-semibold text-gray-600">Date:</span> {new Date(selectedPayment.date).toLocaleDateString('en-GB')}</p>
              <p><span className="font-semibold text-gray-600">TDS Applicable:</span> {selectedPayment.tdsApplicable ? 'Yes' : 'No'}</p>
              <p><span className="font-semibold text-gray-600">Tax Applicable:</span> {selectedPayment.taxApplicable ? 'Yes' : 'No'}</p>
              <p><span className="font-semibold text-gray-600">Payment Ref. No:</span> {selectedPayment.paymentReferenceNumber}</p>
              <p><span className="font-semibold text-gray-600">Notes:</span> {selectedPayment.notes || '—'}</p>
              <p><span className="font-semibold text-gray-600">Created:</span> {new Date(selectedPayment.createdAt).toLocaleString()}</p>
              <p><span className="font-semibold text-gray-600">Updated:</span> {selectedPayment.updatedAt ? new Date(selectedPayment.updatedAt).toLocaleString() : 'N/A'}</p>
            </>
          )}
        </div>

        {/* Right Section */}
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          
          {/* Payment Quotation */}
          <div className="bg-gray-50 rounded-xl p-4 text-center shadow-inner flex flex-col items-center">
            <p className="font-semibold text-gray-600 mb-2">Payment Quotation</p>
            {selectedPayment.paymentQuotation ? (
              <img
                src={selectedPayment.paymentQuotation}
                alt="Payment Quotation"
                className="w-28 h-28 object-cover rounded-lg border"
              />
            ) : (
              <p className="text-gray-400">No Quotation Available</p>
            )}
          </div>

          {/* Payment Proof */}
          <div className="bg-gray-50 rounded-xl p-4 text-center shadow-inner flex flex-col items-center">
            <p className="font-semibold text-gray-600 mb-2">Payment Proof</p>
            {selectedPayment.paymentProof ? (
              <img
                src={selectedPayment.paymentProof}
                alt="Payment Proof"
                className="w-28 h-28 object-cover rounded-lg border"
              />
            ) : (
              <p className="text-gray-400">No Proof Available</p>
            )}
          </div>

        </div>
      </div>

      {/* Footer Buttons */}
      <div className="px-6 py-4 bg-gray-100 flex justify-end gap-4 rounded-b-2xl">
        <button
          onClick={() => handleEdit(selectedPayment._id)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition shadow-md"
        >
          Edit
        </button>
        <button
          onClick={closeModal}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition shadow-md"
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

export default PaymentTable;