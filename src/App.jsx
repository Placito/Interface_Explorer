import { invoke } from "@tauri-apps/api";
import React, { useState, useEffect } from "react";
import "./styles.css"; // Import the CSS file

function App() {
  const [interfaces, setInterfaces] = useState([]);
  const [isPanelVisible, setIsPanelVisible] = useState(false); // Panel visibility for interfaces table
  const [activeButton, setActiveButton] = useState(null);
  const [filteredInterfaces, setFilteredInterfaces] = useState([]);
  const [query, setQuery] = useState(""); // Single query state for search
  const [selectedInterface, setSelectedInterface] = useState(null); // Track selected interface
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // Manage dropdown visibility
  const [isFormVisible, setIsFormVisible] = useState(false); // Manage form visibility
  const [newInterface, setNewInterface] = useState({
    name: "",
    interface_type: "",
    status: "",
    mac_address: "",
    ip_address: "",
    ipv4_address: "",
  });
  const [editableIpv4s, setEditableIpv4s] = useState({}); // Track which interface is editable
  const [ipv4Temp, setIpv4Temp] = useState(!""); // Store temp IPv4 value


  // Fetch network interfaces
  const fetchInterfaces = async () => {
    try {
      const result = await invoke("list_network_interfaces");
      console.log(result); // Check what the result contains
      setInterfaces(result);
      setFilteredInterfaces(result);
    } catch (error) {
      console.error("Error fetching network interfaces:", error);
    }
  };

  const matchesFilter = (iface, value) => {
    const fields = [
      iface.mac_address,
      iface.ip_address,
      iface.ipv4_address,
      iface.status,
      iface.name,
      iface.interface_type,
    ];
    const lowerValue = value.toLowerCase();

    return fields.some((field) =>
      field?.toLowerCase().trim().includes(lowerValue)
    );
  };

  const handleFilterChange = (e) => {
    const value = e.target.value.trim().toLowerCase();
    setQuery(value);

    const filtered = interfaces.filter((iface) => {
      // Strictly include only active interfaces if "active" is typed
      if (value === "active") return iface.status?.toLowerCase() === "active";

      // Strictly include only inactive interfaces if "inactive" is typed
      if (value === "inactive")
        return iface.status?.toLowerCase() === "inactive";

      // Filters for "wifi" or "eth" queries
      if (value === "wifi")
        return iface.interface_type?.toLowerCase().includes("wi-fi");
      if (value === "eth")
        return iface.interface_type?.toLowerCase().includes("eth");

      // General match for other queries
      return matchesFilter(iface, value);
    });

    setFilteredInterfaces(filtered);

    // Show the dropdown only if there are results and the query is not empty
    setIsDropdownVisible(value.length > 0 && filtered.length > 0);
  };

  // Handle key down event for Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && filteredInterfaces.length > 0) {
      // When Enter is pressed, select the first item in the filtered list
      const selected = filteredInterfaces[0];
      setSelectedInterface(selected); // Set selected interface
      setQuery(selected.name); // Update the query with the selected name
      setIsDropdownVisible(false); // Hide the dropdown
    }
  };

  // Toggle the visibility of the panel
  const togglePanelVisibility = () => {
    if (isFormVisible) {
      setIsFormVisible(false); // Close the form if it's open
    } else {
      setIsPanelVisible((prev) => !prev); // Toggle the visibility of the interfaces table
    }
    setSelectedInterface(null); // Clear selected interface when toggling visibility
    setQuery(""); // Reset search query
    setFilteredInterfaces(interfaces); // Reset filtered list
  };

  // Set the clicked button as active
  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName);
  };

  // Handle the "Add Interface" button click
  const handleAddInterfaceClick = () => {
    setIsFormVisible(true); // Show the form
    setIsPanelVisible(false); // Hide the interfaces table
    setActiveButton("save");
  };

  // Fetch interfaces when the component mounts
  useEffect(() => {
    fetchInterfaces();
  }, []);

  // Define saveInterfaces function
  const saveInterfaces = async () => {
    try {
      // Ensure interfaces is being passed as an array of NetworkInterface objects
      await invoke("save_network_interfaces", { interfaces: interfaces });
      console.log("Interfaces saved successfully!");
    } catch (error) {
      console.error("Error saving interfaces:", error);
    }
  };

  // Highlight the matched text in the query
  const highlightMatch = (text) => {
    const regex = new RegExp(`(${query})`, "gi");
    return text.split(regex).map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} style={{ backgroundColor: "yellow" }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Function for delete
  const handleDeleteIPv4 = (ifaceToUpdate) => {
    const updatedInterfaces = filteredInterfaces.map((iface) =>
      iface === ifaceToUpdate ? { ...iface, ipv4_address: "N/A" } : iface
    );
  
    setFilteredInterfaces(updatedInterfaces);
    setInterfaces(updatedInterfaces); // Update the original list if needed
  };
  

  // Enable editing mode for a specific row
const handleEditClick = (index, ipv4Value) => {
  setEditableIpv4s((prev) => ({ ...prev, [index]: true }));
  setIpv4Temp(ipv4Value || ""); // Store current IPv4 value
};

// Handle update on input change
const handleUpdate = (e, index) => {
  setIpv4Temp(e.target.value); // Update temp IPv4 state
};

// Save updated IPv4 and exit edit mode
const handleKeyDownIPv4 = (e, index, ifaceToUpdate) => {
  if (e.key === "Enter") {
    const updatedInterfaces = filteredInterfaces.map((iface, i) =>
      i === index ? { ...iface, ipv4_address: ipv4Temp } : iface
    );

    setFilteredInterfaces(updatedInterfaces);
    setInterfaces(updatedInterfaces); // Update the original list
    setEditableIpv4s((prev) => ({ ...prev, [index]: false })); // Exit edit mode
  }
};
  
  
  return (
    <div className="center">
      <div className="p-4">
        <h1>Network Interface Details</h1>

        <div className="button-container">
          <button
            onClick={() => {
              togglePanelVisibility(); // Toggle the visibility of the panel
              handleButtonClick("display"); // Track the active button
              // Call saveInterfaces only when the panel is shown
              if (!isPanelVisible) {
                // Only save when panel is being shown
                saveInterfaces();
              }
            }}
            className={`button ${activeButton === "display" ? "active" : ""}`}
          >
            {isPanelVisible
              ? "Hide Network Interfaces"
              : "Show Network Interfaces"}
          </button>
          <button
            onClick={() => {
              handleAddInterfaceClick();
              handleButtonClick("save");
            }}
            className={`button ${activeButton === "save" ? "active" : ""}`}
          >
            Add Interface
          </button>
        </div>

        <div className="filters-container">
          <h3>Select an Interface:</h3>
          <div className="filters">
            <div className="search-container">
              <input
                type="text"
                className="glass-input"
                placeholder="Search by Name, Status, Type, etc..."
                value={query}
                onChange={handleFilterChange}
                onKeyDown={handleKeyDown}
              />
              <i className="fa-solid fa-magnifying-glass search-icon"></i>
              {/* Autocomplete dropdown */}
              {isDropdownVisible && (
                <ul className="autocomplete-dropdown">
                  {filteredInterfaces.map((iface, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setSelectedInterface(iface);
                        setQuery(iface.name); // Update query to selected interface name
                        setIsDropdownVisible(false); // Hide dropdown after selection
                      }}
                    >
                      {highlightMatch(iface.name)}
                      {/* Add labels for active/inactive status */}
                      {query === "active" &&
                        iface.status?.toLowerCase() === "active" && (
                          <span> (Active)</span>
                        )}
                      {query === "inactive" &&
                        iface.status?.toLowerCase() === "inactive" && (
                          <span> (Inactive)</span>
                        )}
                      {query === "wifi" &&
                        iface.interface_type
                          ?.toLowerCase()
                          .includes("wi-fi") && <span> (Wi-Fi)</span>}
                      {query === "eth" &&
                        iface.interface_type?.toLowerCase().includes("eth") && (
                          <span> (Ethernet)</span>
                        )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Add new interface form */}
        {isFormVisible && (
          <div className="add-interface-form">
            <h2>Add New Interface</h2>
            <div className="table-container">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddInterface();
                }}
              >
                <table>
                  <tbody>
                    <tr>
                      <td>
                        <label htmlFor="name">Name</label>
                      </td>
                      <td>
                        <input
                          type="text"
                          name="name"
                          value={newInterface.name}
                          onChange={handleInputChange}
                          placeholder="name"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <label htmlFor="interface_type">Interface Type</label>
                      </td>
                      <td>
                        <input
                          type="text"
                          name="interface_type"
                          value={newInterface.interface_type}
                          onChange={handleInputChange}
                          placeholder="type of interface"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <label htmlFor="status">Status</label>
                      </td>
                      <td>
                        <input
                          type="text"
                          name="status"
                          value={newInterface.status}
                          onChange={handleInputChange}
                          placeholder="Status (active/inactive)"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <label htmlFor="mac_address">MAC Address</label>
                      </td>
                      <td>
                        <input
                          type="text"
                          name="mac_address"
                          value={newInterface.mac_address}
                          onChange={handleInputChange}
                          placeholder="MAC address"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <label htmlFor="ip_address">IP Address</label>
                      </td>
                      <td>
                        <input
                          type="text"
                          name="ip_address"
                          value={newInterface.ip_address}
                          onChange={handleInputChange}
                          placeholder="IP address"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <label htmlFor="ipv4_address">IPv4 Address</label>
                      </td>
                      <td>
                        <input
                          type="text"
                          name="ipv4_address"
                          value={newInterface.ipv4_address}
                          onChange={handleInputChange}
                          placeholder="IPv4 address"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="2">
                        <button type="submit" className="button">
                          Add Interface
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </form>
            </div>
          </div>
        )}

        {/* Display network interfaces when panel is visible */}
        {isPanelVisible && (
          <div className="table-container">
            {filteredInterfaces.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>MAC</th>
                    <th>IP</th>
                    <th>IPv4</th>
                    <th>Actions</th> 
                  </tr>
                </thead>
                <tbody>
                  {filteredInterfaces.map((iface, index) => (
                    <tr key={index}>
                      <td>{highlightMatch(iface.name)}</td>
                      <td>{iface.interface_type}</td>
                      <td>{iface.status}</td>
                      <td>{iface.mac_address || "N/A"}</td>
                      <td>{iface.ip_address || "N/A"}</td>
                      <td>
  {editableIpv4s[index] ? (
    <input
      type="text"
      value={ipv4Temp}
      onChange={(e) => handleUpdate(e, index)} // Update on input change
      placeholder="IPv4 address"
      onKeyDown={(e) => handleKeyDownIPv4(e, index, iface)} // Save on Enter key press
      onBlur={() => setEditableIpv4s((prev) => ({ ...prev, [index]: false }))} // Close input when clicking outside
      autoFocus
    />
  ) : (
    <span onClick={() => handleEditClick(index, iface.ipv4_address)}>
      {iface.ipv4_address || "N/A"}
    </span>
  )}
</td>

                      <td>
                        <div className="button_Actions">
                          <button
                             onClick={() => {
                              handleUpdate(iface.ipv4Temp);
                            }}
                            className="button_Icon"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteIPv4(iface)}
                            className="button_Icon"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No interfaces found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;