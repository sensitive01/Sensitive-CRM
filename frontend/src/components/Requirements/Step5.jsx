import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Step5 = ({ onPrev, selections, onNext }) => {
  const [tables, setTables] = useState([
    [{ userType: "", platform: "", operations: "", useCases: "" }],
  ]);

  const addTable = () => {
    setTables((prev) => [
      ...prev,
      [{ userType: "", platform: "", operations: "", useCases: "" }],
    ]);
  };

  const deleteTable = (tableIndex) => {
    setTables((prev) => prev.filter((_, i) => i !== tableIndex));
  };

  const addRow = (tableIndex) => {
    setTables((prev) => {
      const updated = [...prev];
      updated[tableIndex].push({
        userType: "",
        platform: "",
        operations: "",
        useCases: "",
      });
      return updated;
    });
  };
  

  const removeRow = (tableIndex, rowIndex) => {
    setTables((prev) => {
      const updated = [...prev];
      if (updated[tableIndex].length > 1) {
        updated[tableIndex].splice(rowIndex, 1);
      }
      return updated;
    });
  };

  const handleChange = (tableIndex, rowIndex, field, value) => {
    setTables((prev) => {
      const updated = [...prev];
      updated[tableIndex][rowIndex][field] = value;
      return updated;
    });
  };

  const handleNext = () => {
    // Pass tables to parent
    if (onNext) {
      onNext(tables);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">User Requirements</h2>
        <button
          onClick={addTable}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          + Add Table
        </button>
      </div>

      {tables.map((table, tableIndex) => (
        <div key={tableIndex} className="mb-8 border rounded-lg p-4 shadow-sm bg-white">
          <h3 className="font-semibold mb-2">Table {tableIndex + 1}</h3>

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse mb-4">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border px-4 py-2 text-left">User Type</th>
                  <th className="border px-4 py-2 text-left">Web / App</th>
                  <th className="border px-4 py-2 text-left">Operations</th>
                  <th className="border px-4 py-2 text-left">Use Cases</th>
                  <th className="border px-4 py-2 text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody>
                {table.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="border px-4 py-2">
                      <input
                        type="text"
                        value={row.userType}
                        onChange={(e) =>
                          handleChange(tableIndex, rowIndex, "userType", e.target.value)
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="border px-4 py-2">
                      <select
                        value={row.platform}
                        onChange={(e) =>
                          handleChange(tableIndex, rowIndex, "platform", e.target.value)
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                      >
                        <option value="">Select</option>
                        <option value="Web">Web</option>
                        <option value="App">App</option>
                        <option value="Both">Both</option>
                      </select>
                    </td>
                    <td className="border px-4 py-2">
                      <input
                        type="text"
                        value={row.operations}
                        onChange={(e) =>
                          handleChange(tableIndex, rowIndex, "operations", e.target.value)
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="border px-4 py-2">
                      <input
                        type="text"
                        value={row.useCases}
                        onChange={(e) =>
                          handleChange(tableIndex, rowIndex, "useCases", e.target.value)
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {table.length > 1 && (
                        <button
                          onClick={() => removeRow(tableIndex, rowIndex)}
                          className="text-red-600 hover:text-red-800 font-bold"
                          title="Remove Row"
                        >
                          X
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => addRow(tableIndex)}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Row
            </button>
            {tables.length > 1 && (
              <button
                onClick={() => deleteTable(tableIndex)}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Table
              </button>
            )}
          </div>
        </div>
      ))}

      <div className="flex justify-between mt-10">
        <button
          onClick={onPrev}
          className="px-6 py-2 bg-slate-600 text-white rounded-lg"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Step5;
