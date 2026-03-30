import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

function ClientEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState({
    organization: "",
    contactPerson: "",
    contactNumber: "",
    alternateContact: "",
    emailId: "",
    alternateMailId: "",
    businessCategory: "",
    officeLocation: {
      addressLine: "",
      area: "",
      city: "",
      state: "",
      pincode: "",
      landmark: "",
    },
    registeredAddress: {
      addressLine: "",
      area: "",
      city: "",
      state: "",
      pincode: "",
      landmark: "",
    },
    status: "",
  });

  useEffect(() => {
    if (!id) return;

    const fetchClientDetails = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/clients/get/${id}`,
        );
        if (response.status === 200) {
          setClient(response.data);
        }
      } catch (error) {
        console.error("Error fetching client details:", error);
      }
    };

    fetchClientDetails();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("officeLocation") || name.includes("registeredAddress")) {
      const [field, subfield] = name.split(".");
      setClient((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [subfield]: value,
        },
      }));
    } else {
      setClient((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/clients/update/${id}`,
        client,
      );

      if (response.status === 200) {
        alert("Client updated successfully!");
        navigate("/client-table");
      }
    } catch (error) {
      alert("Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-indigo-700 mb-12">
          Edit Client Details
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* Left Card */}
          <div className="bg-white rounded-xl shadow-xl p-8 border border-indigo-100">
            <h3 className="text-xl font-semibold text-indigo-600 mb-6">
              Client Information
            </h3>

            <div className="space-y-5">
              {[
                { label: "Organization", name: "organization" },
                { label: "Contact Person", name: "contactPerson" },
                { label: "Contact Number", name: "contactNumber" },
                { label: "Alternate Contact", name: "alternateContact" },
                { label: "Email ID", name: "emailId", type: "email" },
                {
                  label: "Alternate Email ID",
                  name: "alternateMailId",
                  type: "email",
                },
                { label: "Business Category", name: "businessCategory" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type || "text"}
                    name={field.name}
                    value={client[field.name]}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Card */}
          <div className="bg-white rounded-xl shadow-xl p-8 border border-indigo-100">
            <h3 className="text-xl font-semibold text-indigo-600 mb-6">
              Address Details
            </h3>

            {/* Office Address */}
            <div className="mb-6">
              <p className="font-medium text-gray-700 mb-3">Office Location</p>
              {Object.keys(client.officeLocation).map((field) => (
                <input
                  key={field}
                  type="text"
                  name={`officeLocation.${field}`}
                  value={client.officeLocation[field]}
                  onChange={handleChange}
                  placeholder={field.replace(/([A-Z])/g, " $1")}
                  required
                  className="w-full mb-2 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />
              ))}
            </div>

            {/* Registered Address */}
            <div>
              <p className="font-medium text-gray-700 mb-3">
                Registered Address
              </p>
              {Object.keys(client.registeredAddress).map((field) => (
                <input
                  key={field}
                  type="text"
                  name={`registeredAddress.${field}`}
                  value={client.registeredAddress[field]}
                  onChange={handleChange}
                  placeholder={field.replace(/([A-Z])/g, " $1")}
                  required
                  className="w-full mb-2 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex justify-center gap-6 mt-8">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-2 rounded-lg shadow"
              >
                Update
              </button>

              <button
                type="button"
                onClick={() => navigate("/client-table")}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-8 py-2 rounded-lg shadow"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClientEdit;
