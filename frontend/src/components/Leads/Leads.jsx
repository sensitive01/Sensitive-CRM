import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const LeadForm = () => {
  const [lead, setLead] = useState({
    name: "",
    contact: "",
    email: "",
    requirements: "",
    company: "",
    location: "",
    links: "",
    comments: "",
    status: "",
  });
  const navigate = useNavigate();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLead((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const timestamp = new Date().toISOString();
    const leadData = {
      ...lead,
      createdAt: timestamp,
    };

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/leads/create`,
        leadData,
      );
      if (response.status === 201) {
        alert("Lead data submitted successfully!");
        setLead({
          name: "",
          contact: "",
          email: "",
          requirements: "",
          company: "",
          location: "",
          links: "",
          comments: "",
          status: "",
        });
        navigate("/lead-table");
      } else {
        alert("There was an issue with the submission.");
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      alert("There was an error submitting the data");
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex justify-center items-start pt-20">
      <div className="w-full max-w-5xl p-8 bg-white rounded-2xl shadow-2xl">
        {/* Title */}
        <div className="flex justify-center mt-8">
          <h2 className="text-4xl font-bold mb-10 px-6 py-3 bg-indigo-100 text-indigo-800 rounded-lg inline-block">
            Lead Details Form
          </h2>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* First Column */}
          <div className="border border-blue-200 p-6 rounded-lg shadow-inner bg-indigo-50">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium pb-2">Name:</label>
                <input
                  type="text"
                  name="name"
                  value={lead.name}
                  onChange={handleChange}
                  required
                  className="border border-blue-300 p-2 w-full rounded focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium pb-2">
                  Contact:
                </label>
                <input
                  type="tel"
                  name="contact"
                  value={lead.contact}
                  onChange={handleChange}
                  required
                  className="border border-blue-300 p-2 w-full rounded focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium pb-2">Email:</label>
                <input
                  type="email"
                  name="email"
                  value={lead.email}
                  onChange={handleChange}
                  required
                  className="border border-blue-300 p-2 w-full rounded focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium pb-2">
                  Company:
                </label>
                <input
                  type="text"
                  name="company"
                  value={lead.company}
                  onChange={handleChange}
                  required
                  className="border border-blue-300 p-2 w-full rounded focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium pb-2">
                  Location:
                </label>
                <input
                  type="text"
                  name="location"
                  value={lead.location}
                  onChange={handleChange}
                  className="border border-blue-300 p-2 w-full rounded focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Second Column */}
          <div className="border border-blue-200 p-6 rounded-lg shadow-inner bg-indigo-50">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium pb-2">
                  Requirements:
                </label>
                <textarea
                  name="requirements"
                  value={lead.requirements}
                  onChange={handleChange}
                  required
                  className="border border-blue-300 p-2 w-full rounded h-24 focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium pb-2">Links:</label>
                <input
                  type="text"
                  name="links"
                  value={lead.links}
                  onChange={handleChange}
                  className="border border-blue-300 p-2 w-full rounded focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium pb-2">
                  Comments:
                </label>
                <textarea
                  name="comments"
                  value={lead.comments}
                  onChange={handleChange}
                  className="border border-blue-300 p-2 w-full rounded h-24 focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium pb-2">
                  Status:
                </label>
                <select
                  name="status"
                  value={lead.status}
                  onChange={handleChange}
                  required
                  className="border border-blue-300 p-2 w-full rounded focus:ring-2 focus:ring-indigo-400 outline-none"
                >
                  <option value="">Select Status</option>
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="qualified">Qualified</option>
                  <option value="unqualified">Unqualified</option>
                  <option value="converted">Converted</option>
                </select>
              </div>

              <div className="flex justify-center mt-6 space-x-4">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="bg-gray-300 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadForm;
