import { invoke } from "@tauri-apps/api";
import React, { useState, useEffect } from "react";
import './styles.css'; // Import the CSS file

function App() {
  const [interfaces, setInterfaces] = useState([]);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [activeButton, setActiveButton] = useState(null);
  const [filteredInterfaces, setFilteredInterfaces] = useState([]);
  const [query, setQuery] = useState(''); // Single query state for search
  const [selectedInterface, setSelectedInterface] = useState(null); // Track selected interface
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // Manage dropdown visibility

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
  
    return fields.some((field) => field?.toLowerCase().trim().includes(lowerValue));
  };
  
  const handleFilterChange = (e) => {
    const value = e.target.value.trim().toLowerCase();
    setQuery(value);
  
    const filtered = interfaces.filter((iface) => {
      // Strictly include only active interfaces if "active" is typed
      if (value === "active") return iface.status?.toLowerCase() === "active";
  
      // Strictly include only inactive interfaces if "inactive" is typed
      if (value === "inactive") return iface.status?.toLowerCase() === "inactive";
  
      // Filters for "wifi" or "eth" queries
      if (value === "wifi") return iface.interface_type?.toLowerCase().includes("wi-fi");
      if (value === "eth") return iface.interface_type?.toLowerCase().includes("eth");
  
      // General match for other queries
      return matchesFilter(iface, value);
    });
  
    setFilteredInterfaces(filtered);
  
    // Show the dropdown only if there are results and the query is not empty
    setIsDropdownVisible(value.length > 0 && filtered.length > 0);
  };  

  // Handle key down event for Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filteredInterfaces.length > 0) {
      // When Enter is pressed, select the first item in the filtered list
      const selected = filteredInterfaces[0];
      setSelectedInterface(selected); // Set selected interface
      setQuery(selected.name); // Update the query with the selected name
      setIsDropdownVisible(false); // Hide the dropdown
    }
  };

  // Toggle the visibility of the panel
  const togglePanelVisibility = () => {
    setIsPanelVisible((prev) => !prev);
    setSelectedInterface(null); // Clear selected interface when toggling visibility
    setQuery(""); // Reset search query
    setFilteredInterfaces(interfaces); // Reset the filtered list
  };

  // Set the clicked button as active
  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName);
  };

  // Fetch interfaces when the component mounts
  useEffect(() => {
    fetchInterfaces();
  }, []);

  // Define saveInterfaces function 
  const saveInterfaces = async () => {
    try {
        // Call the Tauri command to save interfaces
        await invoke('save_network_interfaces', { interfaces: interfaces });
        console.log("Interfaces saved successfully!");
    } catch (error) {
        console.error("Error saving interfaces:", error);
    }
  };

  // Highlight the matched text in the query
  const highlightMatch = (text) => {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.split(regex).map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} style={{ backgroundColor: 'yellow' }}>{part}</span>
      ) : part
    );
  };

  // funtion for delete
  const handleDelete = (ifaceToDelete) => {
    // Remove the interface from the list
    const updatedInterfaces = filteredInterfaces.filter(
      (iface) => iface !== ifaceToDelete
    );
    setFilteredInterfaces(updatedInterfaces);
    setInterfaces(updatedInterfaces); // Update the original list if needed
  };

  // function for update
  const handleUpdate = (ifaceToUpdate) => {
    const updatedName = prompt("Enter the new name:", ifaceToUpdate.name);
    if (updatedName) {
      const updatedInterfaces = filteredInterfaces.map((iface) =>
        iface === ifaceToUpdate ? { ...iface, name: updatedName } : iface
      );
      setFilteredInterfaces(updatedInterfaces);
      setInterfaces(updatedInterfaces); // Update the original list if needed
    }
  };  

  return (
    <div className="center">
      <div className="p-4">
        <h1>Network Interface Details</h1>

        <div className="button-container">
          <button
            onClick={() => {
              togglePanelVisibility();
              handleButtonClick("display");
            }}
            className={`button ${activeButton === "display" ? "active" : ""}`}
          >
            {isPanelVisible ? "Hide Network Interfaces" : "Show Network Interfaces"}
          </button>
          <button
            onClick={() => {
              saveInterfaces();
              togglePanelVisibility();
              handleButtonClick("save");
            }}
            className={`button ${activeButton === "save" ? "active" : ""}`}
          >
            Save Interfaces
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
                      {query === "active" && iface.status?.toLowerCase() === "active" && (
                        <span> (Active)</span>
                      )}
                      {query === "inactive" && iface.status?.toLowerCase() === "inactive" && (
                        <span> (Inactive)</span>
                      )}
                      {query === "wifi" && iface.interface_type?.toLowerCase().includes("wi-fi") && (
                        <span> (Wi-Fi)</span>
                      )}
                      {query === "eth" && iface.interface_type?.toLowerCase().includes("eth") && (
                        <span> (Ethernet)</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

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
                    <th>Actions</th> {/* New column for buttons */}
                  </tr>
                </thead>
                <tbody>
                  {filteredInterfaces.map((iface, index) => (
                    <tr key={index}>
                      <td>{iface.name}</td>
                      <td>{iface.interface_type}</td>
                      <td>{iface.status}</td>
                      <td>{iface.mac_address || "N/A"}</td>
                      <td>{iface.ip_address || "N/A"}</td>
                      <td>{iface.ipv4_address || "N/A"}</td>
                      <td>
                        <div className="button_Actions">
                          <button
                            onClick={() => handleUpdate(iface)}
                            className="button_Icon"
                          >
                            <i class="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(iface)}
                            className="button_Icon"
                          >
                            <i class="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-interfaces">No interfaces found.</p>
            )}
          </div>
        )}

        {/* Display selected interface details */}
        {selectedInterface && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>MAC</th>
                  <th>IP</th>
                  <th>IPv4</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{selectedInterface.name}</td>
                  <td>{selectedInterface.interface_type}</td>
                  <td>{selectedInterface.status}</td>
                  <td>{selectedInterface.mac_address || "N/A"}</td>
                  <td>{selectedInterface.ip_address || "N/A"}</td>
                  <td>{selectedInterface.ipv4_address || "N/A"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
