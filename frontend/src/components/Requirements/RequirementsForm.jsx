import React, { useState } from "react";
import logo from "../../assets/logo.png";
import Step5 from "./Step5";
import { useNavigate } from "react-router-dom";
import Preview from "./Preview";

/* ================= TECH DROPDOWN ================= */

const TechDropdown = ({
  title,
  options,
  open,
  onToggle,
  selections,
  setSelections,
  withOthers = false,
}) => {
  const [showOther, setShowOther] = useState(false);

  const handleChange = (option) => {
    const prev = selections[title] || [];
    let updated;

    if (prev.includes(option)) {
      updated = prev.filter((i) => i !== option);
    } else {
      updated = [...prev, option];
    }

    setSelections({
      ...selections,
      [title]: updated,
    });

    if (option === "Others" && withOthers) setShowOther(!showOther);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center text-left font-semibold text-base text-slate-800"
      >
        {title}
        <span className="text-blue-600">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-3">
          {options.map((o) => (
            <label
              key={o}
              className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg hover:bg-slate-100 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                className="accent-blue-600"
                checked={selections[title]?.includes(o) || false}
                onChange={() => handleChange(o)}
              />
              {o}
            </label>
          ))}

          {withOthers && showOther && (
            <input
              type="text"
              placeholder="Please specify..."
              value={selections[`${title}_other`] || ""}
              onChange={(e) =>
                setSelections({
                  ...selections,
                  [`${title}_other`]: e.target.value,
                })
              }
              className="border rounded-lg p-2 text-sm"
            />
          )}
        </div>
      )}
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */

const RequirementsForm = () => {
  const [step, setStep] = useState(1);
  const [openMain, setOpenMain] = useState(null);
  const [openWebSub, setOpenWebSub] = useState(null);
  const [openWpChild, setOpenWpChild] = useState(null);

  // Centralized state for all selections
  const [selections, setSelections] = useState({});
  const navigate = useNavigate();

  const toggleMain = (key) => {
    setOpenMain(openMain === key ? null : key);
    setOpenWebSub(null);
    setOpenWpChild(null);
  };

  /* ================= STEP 1 VALIDATION ================= */
  /* ================= WEBSITE DESIGNING (ALL SUB DATA REQUIRED) ================= */

  const validateStep1 = () => {
    // Only validate that "Others" text inputs are filled if "Others" is selected
    const mainDropdowns = [
      "Web Portal Development",
      "Mobile App Development",
      "Custom Software Development",
      "API Integration",
    ];

    for (let key of mainDropdowns) {
      const selected = selections[key];
      if (selected === "Others" && !selections[`${key}_other`]?.trim()) {
        return false;
      }
    }

    return true; // Don't force users to fill out everything
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-blue-600 border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-center">
          <div className="flex items-center gap-4">
            <img
              src={logo}
              alt="Sensitive Technologies"
              className="h-10 w-auto object-contain"
            />

            <span className=" text-2xl font-semibold tracking-wide text-white font-sans">
              Sensitive Technologies
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* STEP INDICATOR */}
        <div className="flex justify-center gap-6 mb-10">
          <Step active={step === 1}>Development Requirements</Step>
          <Step active={step === 2}>Tech Stack</Step>
          <Step active={step === 3}>Purchases Requirements</Step>
          <Step active={step === 4}>Requirement Specifications</Step>
          <Step active={step === 5}>Table</Step>
          {/* <Step active={step === 6}>preview</Step> */}
        </div>

        {/* ================= STEP 1 ================= */}
        {step === 1 && (
          <Step1
            openMain={openMain}
            openWebSub={openWebSub}
            openWpChild={openWpChild}
            toggleMain={toggleMain}
            selections={selections}
            setSelections={setSelections}
            setOpenWebSub={setOpenWebSub}
            setOpenWpChild={setOpenWpChild}
            onNext={() => {
              if (validateStep1()) setStep(2);
              else alert("Please fill all required fields in Step 1 ✅");
            }}
          />
        )}

        {/* ================= STEP 2 ================= */}
        {step === 2 && (
          <Step2
            openMain={openMain}
            toggleMain={toggleMain}
            selections={selections}
            setSelections={setSelections}
            onPrev={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {/* ================= STEP 3 ================= */}
        {step === 3 && (
          <Step3
            selections={selections}
            setSelections={setSelections}
            onPrev={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {/* ================= STEP 4 ================= */}
        {step === 4 && (
          <Step4
            selections={selections}
            setSelections={setSelections}
            onPrev={() => setStep(3)}
            onNext={() => setStep(5)}
            openMain={openMain}
            toggleMain={toggleMain}
          />
        )}

        {step === 5 && (
          <Step5
            onPrev={() => setStep(4)}
            selections={selections}
            // all previous steps
            onNext={(step5Data) => {
              // Navigate to preview and pass all steps
              navigate("/preview", {
                state: {
                  ...selections,
                  step5: step5Data,
                },
              });
            }}
          />
        )}

        {step === 6 && (
          <Preview
            onPrevious={() => setStep(5)}
            // go back to Step5
            onSubmit={(allData) => {
              console.log("Final Submission:", allData);
              alert("Data submitted successfully!");
            }}
          />
        )}
      </div>
    </div>
  );
};

/* ================= STEP 1 COMPONENT ================= */

const Step1 = ({
  openMain,
  openWebSub,
  openWpChild,
  toggleMain,
  selections,
  setSelections,
  setOpenWebSub,
  setOpenWpChild,
  onNext,
}) => (
  <div className="space-y-6">
    {/* Website Designing */}
    <Card>
      <CardHeader
        title="Website Designing"
        onClick={() => toggleMain("web")}
        active={openMain === "web"}
      />

      {openMain === "web" && (
        <div className="mt-6 space-y-4">
          <SubDropdown
            title="Static Website Designing"
            active={openWebSub === "static"}
            onClick={() => setOpenWebSub("static")}
          >
            <Input
              label="Static Website Pages"
              type="number"
              selections={selections}
              setSelections={setSelections}
            />
          </SubDropdown>

          <SubDropdown
            title="Dynamic CMS WordPress Website Designing"
            active={openWebSub === "wp"}
            onClick={() => {
              setOpenWebSub(openWebSub === "wp" ? null : "wp");
              setOpenWpChild(null);
            }}
          >
            {/* MAIN FIELDS */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input
                label="Themes License"
                selections={selections}
                setSelections={setSelections}
              />
              <Input
                label="Plugins"
                selections={selections}
                setSelections={setSelections}
              />
            </div>

            {/* CHILD 1 */}
            <SubDropdown
              title="Dynamic CMS WordPress Website Designing "
              active={openWpChild === "pages"}
              onClick={() =>
                setOpenWpChild(openWpChild === "pages" ? null : "pages")
              }
            >
              <Input
                label="Number of Pages WP"
                type="number"
                selections={selections}
                setSelections={setSelections}
              />
            </SubDropdown>

            {/* CHILD 2 */}
            <SubDropdown
              title="Dynamic CMS WordPress Subscription "
              active={openWpChild === "blogs"}
              onClick={() =>
                setOpenWpChild(openWpChild === "blogs" ? null : "blogs")
              }
            >
              <Input
                label="Subscription / Blogs"
                selections={selections}
                setSelections={setSelections}
              />
            </SubDropdown>
          </SubDropdown>

          <SubDropdown
            title="Dynamic CMS WordPress / Shopify eCommerce Website Designing"
            active={openWebSub === "ecom"}
            onClick={() => setOpenWebSub("ecom")}
          >
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Number of Pages Ecom"
                type="number"
                selections={selections}
                setSelections={setSelections}
              />
              <Input
                label="Number of Products"
                type="number"
                selections={selections}
                setSelections={setSelections}
              />
            </div>
          </SubDropdown>
        </div>
      )}
    </Card>

    {/* Single dropdowns */}
    <SingleDropdown
      title="Web Portal Development"
      options={[
        "Single Vendor online shopping eCommerce website",
        "Single Vendor Fully Functional eCommerce ",
        "Multi-Vendor Fully Functional eCommerce Portal ",
        "Booking Portal ",
        "Subscription Portal",
        "Custom Web Portal",
      ]}
      open={openMain === "portal"}
      onToggle={() => toggleMain("portal")}
      selections={selections}
      setSelections={setSelections}
    />

    <SingleDropdown
      title="Mobile App Development"
      options={[
        "Single Android App ",
        "Single Android / IOS App ",
        "Multiple Android App ",
        "Multiple Android / IOS App",
      ]}
      open={openMain === "mobile"}
      onToggle={() => toggleMain("mobile")}
      selections={selections}
      setSelections={setSelections}
    />

    <SingleDropdown
      title="Custom Software Development"
      options={[
        "CRM",
        "ERP",
        "Billing",
        "Accounting",
        "Dailer",
        "SCM",
        "Others",
      ]}
      open={openMain === "software"}
      onToggle={() => toggleMain("software")}
      selections={selections}
      setSelections={setSelections}
      withOthers
    />

    <SingleDropdown
      title="API Integration"
      options={[
        "SMTP",
        "SMS Gateway",
        "Payment Gateway",
        "Firebase Push Notification",
        "Google Cloud Console",
        "Video / Voice Meeting API",
        "Custom API Integration",
        "Others",
      ]}
      open={openMain === "api"}
      onToggle={() => toggleMain("api")}
      selections={selections}
      setSelections={setSelections}
      withOthers
    />

    <NavButtons disablePrev onNext={onNext} />
  </div>
);

/* ================= STEP 2 COMPONENT ================= */

const Step2 = ({
  openMain,
  toggleMain,
  selections,
  setSelections,
  onPrev,
  onNext,
}) => (
  <div className="space-y-6">
    <TechDropdown
      title="1. UI / UX Designing"
      options={["Figma", "Adobe XD", "HTML & CSS", "Photoshop"]}
      open={openMain === "uiux"}
      onToggle={() => toggleMain("uiux")}
      selections={selections}
      setSelections={setSelections}
    />

    <TechDropdown
      title="2. Front-End Development"
      options={["React JS", "Next JS", "HTML & CSS"]}
      open={openMain === "frontend"}
      onToggle={() => toggleMain("frontend")}
      selections={selections}
      setSelections={setSelections}
    />

    <TechDropdown
      title="3. Web Service Backend API"
      options={["Node JS", "Express JS", "PHP"]}
      open={openMain === "backend"}
      onToggle={() => toggleMain("backend")}
      selections={selections}
      setSelections={setSelections}
    />

    <TechDropdown
      title="4. Database"
      options={["MySQL", "MongoDB", "PostgreSQL"]}
      open={openMain === "db"}
      onToggle={() => toggleMain("db")}
      selections={selections}
      setSelections={setSelections}
    />

    <TechDropdown
      title="5. Contents"
      options={["LLM Based", "Dedicated Resource"]}
      open={openMain === "content"}
      onToggle={() => toggleMain("content")}
      selections={selections}
      setSelections={setSelections}
    />

    <TechDropdown
      title="6. Testing / Staging"
      options={["Developer", "Dedicated Resource"]}
      open={openMain === "testing"}
      onToggle={() => toggleMain("testing")}
      selections={selections}
      setSelections={setSelections}
    />

    <TechDropdown
      title="7. 3rd Party API Integration(s)"
      options={[
        "SMTP",
        "SMS Gateway",
        "Payment Gateway",
        "Firebase Push Notification",
        "Google Cloud Console",
        "Video / Voice Meeting API",
        "Custom API Integration",
        "Others",
      ]}
      open={openMain === "techapi"}
      onToggle={() => toggleMain("techapi")}
      selections={selections}
      setSelections={setSelections}
      withOthers
    />

    <TechDropdown
      title="8. SMTP Mailer Service"
      options={["Google Workspace", "Microsoft 365", "Others"]}
      open={openMain === "smtp"}
      onToggle={() => toggleMain("smtp")}
      selections={selections}
      setSelections={setSelections}
      withOthers
    />

    <NavButtons onPrev={onPrev} onNext={onNext} />
  </div>
);

/* ================= STEP 3 COMPONENT ================= */

const Step3 = ({ selections, setSelections, onPrev, onNext }) => {
  const purchases = [
    { label: "Number of Domain(s)", type: "text" },
    {
      label: "Hosting Server",
      type: "select",
      options: ["Shared", "VPS", "Local"],
    },
    {
      label: "Hosting Service Provider",
      type: "select",
      options: ["AWS", "Hostinger", "Others"],
    },
    {
      label: "Media Storage",
      type: "select",
      options: ["Cloudinary", "AWS S3"],
    },
    {
      label: "Mail Account(s)",
      type: "select",
      options: [
        "FREE Server mails",
        "Godaddy Professional mails",
        "Microsoft 365",
        "Google GSuite",
      ],
    },
    {
      label: "API Paid Subscriptions",
      type: "select",
      options: ["DB", "Firebase"],
    },
    { label: "Theme License | Plugins", type: "text" },
    { label: "Other Purchases", type: "text" },
    {
      label: "Renewal & Maintenance",
      type: "select",
      options: ["One-Time", "Recurring"],
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Purchases Requirements</h2>

      {purchases.map((p) => {
        const ownerKey = `${p.label}_owner`;

        return (
          <div key={p.label} className="flex items-center gap-4">
            <label className="w-1/3 text-sm font-medium">{p.label}</label>

            {/* INPUT / SELECT */}
            {p.type === "text" && (
              <input
                type="text"
                value={selections[p.label] || ""}
                onChange={(e) =>
                  setSelections({
                    ...selections,
                    [p.label]: e.target.value,
                  })
                }
                className="w-2/3 border rounded-lg px-3 py-2"
              />
            )}

            {p.type === "select" && (
              <select
                value={selections[p.label] || ""}
                onChange={(e) =>
                  setSelections({
                    ...selections,
                    [p.label]: e.target.value,
                  })
                }
                className="w-2/3 border rounded-lg px-3 py-2"
              >
                <option value="">Select</option>
                {p.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            )}

            {/* OWNER SELECT */}
            <select
              value={selections[ownerKey] || ""}
              onChange={(e) =>
                setSelections({
                  ...selections,
                  [ownerKey]: e.target.value,
                })
              }
              className="w-1/3 border rounded-lg px-3 py-2"
            >
              <option value="">Customer / Vendor</option>
              <option value="Customer">Customer</option>
              <option value="Vendor">Vendor</option>
            </select>
          </div>
        );
      })}

      <NavButtons onPrev={onPrev} onNext={onNext} />
    </div>
  );
};
/* ================= STEP 4 COMPONENT ================= */

const Step4 = ({
  selections,
  setSelections,
  onPrev,
  onNext,
  openMain,
  toggleMain,
}) => {
  const fields = [
    { title: "Website Pages", type: "text" },
    {
      title: "Graphic Designing",
      type: "dropdown",
      options: ["Logo", "Brochure", "Assets", "Others"],
    },
    { title: "Web Portal Pages", type: "text" },
    { title: "Mobile App Pages", type: "text" },
    { title: "Modules (CRUD)", type: "text" },
    {
      title: "Registration Support",
      type: "dropdown",
      options: [
        "Domain Registration",
        "Hosting",
        "File Storage",
        "Database Account",
        "Version Control",
        "GitHub",
        "DLT",
        "D.U.N.S",
        "Play Store",
        "App Store",
        "SMS Header",
        "SMS Template",
        "Payment Gateway",
        "Others",
      ],
    },
    {
      title: "Documentation",
      type: "dropdown",
      options: ["NDA", "MSA", "Workflow", "KT", "Others"],
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Requirement Specifications</h2>

      {fields.map((field) => {
        const otherKey = `${field.title}_other`;

        return (
          <Card key={field.title}>
            <CardHeader
              title={field.title}
              onClick={() => toggleMain(field.title)}
              active={openMain === field.title}
            />

            {openMain === field.title && (
              <div className="mt-4">
                {field.type === "text" ? (
                  <Input
                    label={field.title}
                    selections={selections}
                    setSelections={setSelections}
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    {field.options.map((opt) => (
                      <label
                        key={opt}
                        className="flex items-center gap-2 text-sm bg-slate-50 px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="accent-blue-600"
                          checked={
                            selections[field.title]?.includes(opt) || false
                          }
                          onChange={() => {
                            const prev = selections[field.title] || [];
                            const updated = prev.includes(opt)
                              ? prev.filter((i) => i !== opt)
                              : [...prev, opt];

                            setSelections({
                              ...selections,
                              [field.title]: updated,
                            });
                          }}
                        />
                        {opt}
                      </label>
                    ))}

                    {/* OTHERS INPUT */}
                    {field.options.includes("Others") &&
                      selections[field.title]?.includes("Others") && (
                        <input
                          type="text"
                          placeholder="Please specify..."
                          value={selections[otherKey] || ""}
                          onChange={(e) =>
                            setSelections({
                              ...selections,
                              [otherKey]: e.target.value,
                            })
                          }
                          className="mt-2 border rounded-lg px-3 py-2 text-sm"
                        />
                      )}
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}

      <NavButtons onPrev={onPrev} onNext={onNext} />
    </div>
  );
};

/* ================= SMALL COMPONENTS ================= */

const Step = ({ active, children }) => (
  <div
    className={`px-4 py-2 rounded-full text-sm font-medium ${
      active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
    }`}
  >
    {children}
  </div>
);

const Card = ({ children }) => (
  <div className="bg-white p-6 rounded-2xl border shadow-sm">{children}</div>
);

const CardHeader = ({ title, onClick, active }) => (
  <button
    onClick={onClick}
    className="w-full flex justify-between items-center text-left"
  >
    <h2 className="text-lg font-semibold">{title}</h2>
    <span className="text-xl">{active ? "−" : "+"}</span>
  </button>
);

const SubDropdown = ({ title, active, onClick, children }) => (
  <div className="border rounded-xl p-4">
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="font-medium w-full text-left"
    >
      {title}
    </button>

    {active && <div className="mt-4">{children}</div>}
  </div>
);

const SingleDropdown = ({
  title,
  options,
  open,
  onToggle,
  selections,
  setSelections,
  withOthers,
}) => {
  const handleChange = (option) => {
    setSelections({
      ...selections,
      [title]: option,
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm">
      <CardHeader title={title} onClick={onToggle} active={open} />

      {open && (
        <div className="mt-4 flex flex-col gap-3">
          {options.map((o) => (
            <label
              key={o}
              className="flex items-center gap-3 text-sm bg-slate-50 px-4 py-2 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <input
                type="radio"
                name={title}
                checked={selections[title] === o}
                onChange={() => handleChange(o)}
                className="accent-blue-600"
              />
              {o}
            </label>
          ))}

          {withOthers && selections[title] === "Others" && (
            <input
              type="text"
              placeholder="Please specify..."
              value={selections[`${title}_other`] || ""}
              onChange={(e) =>
                setSelections({
                  ...selections,
                  [`${title}_other`]: e.target.value,
                })
              }
              className="mt-2 border rounded-lg p-3 text-sm"
            />
          )}
        </div>
      )}
    </div>
  );
};

const Input = ({ label, type = "text", selections, setSelections }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>
    <input
      type={type}
      value={selections[label] || ""}
      onChange={(e) =>
        setSelections({ ...selections, [label]: e.target.value })
      }
      className="w-full mt-1 border rounded-lg px-3 py-2"
    />
  </div>
);

const NavButtons = ({ onPrev, onNext, disablePrev }) => (
  <div className="flex justify-between mt-10">
    <button
      disabled={disablePrev}
      onClick={onPrev}
      className={`px-6 py-2 rounded-lg ${
        disablePrev ? "bg-slate-200 text-slate-400" : "bg-slate-600 text-white"
      }`}
    >
      Previous
    </button>

    <button
      onClick={onNext}
      className="px-6 py-2 bg-blue-600 text-white rounded-lg"
    >
      Next
    </button>
  </div>
);

export default RequirementsForm;
