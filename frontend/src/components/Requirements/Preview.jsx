import React, { useState } from "react";
import { useLocation } from "react-router-dom";

const Preview = () => {
  const { state } = useLocation();

  const [clientInfo, setClientInfo] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    notes: "",
  });

  if (!state) return <div className="p-10 text-center">No Data Found</div>;

  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setClientInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Format any value for display
  const formatValue = (value) => {
    if (Array.isArray(value)) return value.join(", ");
    if (value === null || value === undefined || value === "") return "Not Provided";
    if (typeof value === "object") return JSON.stringify(value);
    return value;
  };

  // Build requirements object
  const requirements = {
    "Step 1 – Development Requirements": {
      "Website Designing": {},
      "Static Website Designing": { "Number of Pages": state["Number of Pages WP"] },
      "Dynamic CMS WordPress Website Designing": {
        "Themes License": state["Themes License"],
        "Plugins": state["Plugins"],
        "Number of Pages": state["Number of Pages WP"],
      },
      "Dynamic CMS WordPress Subscription": { "Subscription / Blogs / etc.": state["Subscription / Blogs"] },
      "Dynamic CMS WordPress | Shopify eCommerce Website Designing": {
        "Number of Pages": state["Number of Pages Ecom"],
        "Number of Products": state["Number of Products"],
      },
      "Web Portal Development": state["Web Portal Development"],
      "Mobile App Development": state["Mobile App Development"],
      "Custom Software Development": state["Custom Software Development"],
      "API Integration": state["API Integration"],
    },
    "Step 2 – Tech Stack": {
      "UI / UX Designing": state["1. UI / UX Designing"],
      "Front-End Development": state["2. Front-End Development"],
      "Backend API": state["3. Web Service Backend API"],
      "Database": state["4. Database"],
      "Contents": state["5. Contents"],
      "Testing / Staging": state["6. Testing / Staging"],
      "3rd Party API Integration(s)": state["7. 3rd Party API Integration(s)"],
      "SMTP Mailer Service": state["8. SMTP Mailer Service"],
    },
    "Step 3 – Purchases Requirements": {
      "Number of Domain(s)": state["Number of Domain(s)"],
      "Hosting Server": state["Hosting Server"],
      "Hosting Service Provider": state["Hosting Service Provider"],
      "Media Storage": state["Media Storage"],
      "Mail Account(s)": state["Mail Account(s)"],
      "API Paid Subscriptions": state["API Paid Subscriptions"],
      "Theme License | Plugins": state["Theme License | Plugins"],
      "Other Purchases": state["Other Purchases"],
      "Renewal & Maintenance": state["Renewal & Maintenance"],
    },
    "Step 4 – Requirement Specifications": {
      "Website Pages": state["Website Pages"],
      "Graphic Designing": state["Graphic Designing"],
      "Web Portal Pages": state["Web Portal Pages"],
      "Mobile App Pages": state["Mobile App Pages"],
      "Modules (CRUD)": state["Modules (CRUD)"],
      "Registration Support": state["Registration Support"],
      "Documentation": state["Documentation"],
    },
    "Step 5 – User Flow Table": state.step5,
  };

  // Submit to backend
  const handleSubmit = async () => {
    if (!clientInfo.name || !clientInfo.phone || !clientInfo.email) {
      alert("Name, Phone and Email are required");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientInfo, requirements }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Requirements submitted successfully!");

        // Save locally as backup
        const existing = JSON.parse(localStorage.getItem("submissions") || "[]");
        existing.push({ clientInfo, requirements });
        localStorage.setItem("submissions", JSON.stringify(existing));
      } else {
        alert(data.error || "Submission failed");
      }
    } catch (err) {
      console.error("Server Error:", err);
      alert("Server error. Check backend logs.");
    }
  };

  // Nested renderer
  const renderNested = (data, level = 0) =>
    Object.entries(data).map(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return (
          <div key={key} className={`ml-${level * 4} mb-2`}>
            <p className="font-normal">{key}</p>
            {renderNested(value, level + 1)}
          </div>
        );
      } else {
        return (
          <div
            key={key}
            className={`flex justify-between px-4 py-2 rounded-lg ml-${level * 4} bg-slate-50`}
          >
            <span className="font-normal">{key}</span>
            <span>{formatValue(value)}</span>
          </div>
        );
      }
    });

  const renderCard = (title) => {
    const stepData = requirements[title];
    if (!stepData) return null;
    return (
      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="space-y-2">{renderNested(stepData)}</div>
      </div>
    );
  };

  const renderStep5 = (tables) => (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Step 5: User Requirements Tables</h2>
      {tables?.length > 0 ? (
        tables.map((table, idx) => (
          <div key={idx} className="mb-4 border rounded-lg overflow-x-auto">
            <h3 className="font-medium p-2 bg-slate-100">Table {idx + 1}</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-200">
                  <th className="border px-4 py-2">User Type</th>
                  <th className="border px-4 py-2">Web / App</th>
                  <th className="border px-4 py-2">Operations</th>
                  <th className="border px-4 py-2">Use Cases</th>
                </tr>
              </thead>
              <tbody>
                {table.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="border px-4 py-2">{row.userType || "N/A"}</td>
                    <td className="border px-4 py-2">{row.platform || "N/A"}</td>
                    <td className="border px-4 py-2">{row.operations || "N/A"}</td>
                    <td className="border px-4 py-2">{row.useCases || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      ) : (
        <p>No Table Data Available</p>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Preview Your Selections</h1>

      {/* Client Details */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Client Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="name" placeholder="Name *" value={clientInfo.name} onChange={handleClientChange} className="border rounded-lg px-4 py-2" />
          <input name="phone" placeholder="Phone *" value={clientInfo.phone} onChange={handleClientChange} className="border rounded-lg px-4 py-2" />
          <input name="email" placeholder="Email *" value={clientInfo.email} onChange={handleClientChange} className="border rounded-lg px-4 py-2" />
          <input name="company" placeholder="Company (Optional)" value={clientInfo.company} onChange={handleClientChange} className="border rounded-lg px-4 py-2" />
        </div>
        <textarea name="notes" placeholder="Notes / Comments" value={clientInfo.notes} onChange={handleClientChange} className="border rounded-lg px-4 py-2 w-full mt-4" rows={4} />
      </div>

      {/* Render all steps */}
      {renderCard("Step 1 – Development Requirements")}
      {renderCard("Step 2 – Tech Stack")}
      {renderCard("Step 3 – Purchases Requirements")}
      {renderCard("Step 4 – Requirement Specifications")}
      {renderStep5(state.step5)}

      <div className="flex gap-4 mt-6">
        <button onClick={() => window.history.back()} className="px-6 py-2 bg-gray-600 text-white rounded-lg">Previous</button>
        <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Submit</button>
      </div>
    </div>
  );
};

export default Preview;
