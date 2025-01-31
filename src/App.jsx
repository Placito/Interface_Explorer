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
      setInterfaces(result);
      setFilteredInterfaces(result);
    } catch (error) {
      console.error("Error fetching network interfaces:", error);
    }
  };

  // Filter interfaces based on query
  const handleFilterChange = (e) => {
    const value = e.target.value.toLowerCase();
    setQuery(value); // Set the search query

    // Filter interfaces based on the search query
    const filtered = interfaces.filter((iface) =>
      iface.name.toLowerCase().includes(value) ||
      iface.status.toLowerCase().includes(value) ||
      (iface.mac_address || "").toLowerCase().includes(value) ||
      (iface.ip_address || "").toLowerCase().includes(value)
    );

    setFilteredInterfaces(filtered);
    setIsDropdownVisible(filtered.length > 0); // Show dropdown if there are results
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
  };

  // Set the clicked button as active
  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName);
  };

  // Fetch interfaces when the component mounts
  useEffect(() => {
    fetchInterfaces();
  }, []);

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
            {isPanelVisible ? (
              "Hide Network Interfaces"
            ) : (
              <>
                <i className="fas fa-glass-martini" style={{ marginRight: "8px" }}></i>
                Show Network Interfaces
              </>
            )}
          </button>
          <button
            onClick={() => {
              saveInterfaces();
              togglePanelVisibility();
              handleButtonClick("save");
            }}
            className={`button ${activeButton === "save" ? "active" : ""}`}
          >
            <i className="fas fa-save" style={{ marginRight: "8px" }}></i>
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
                placeholder="Search by Name, Status, MAC, or IP"
                value={query}
                onChange={handleFilterChange}
                onKeyDown={handleKeyDown}
              />
              <i className="fa-solid fa-magnifying-glass search-icon"></i>
              {/* Autocomplete dropdown */}
              {isDropdownVisible && (
                <ul className="autocomplete-dropdown">
                  {filteredInterfaces.map((iface, index) => (
                    <li key={index} onClick={() => {
                    setSelectedInterface(iface);
                    setQuery(iface.name); // Update query to selected interface name
                    setIsDropdownVisible(false); // Hide dropdown after selection
                  }}>
                    {iface.name}
                  </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

         {/* Display selected interface details */}
         {selectedInterface && (
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
                  </tr>
                </thead>
                <tbody>
                    <tr >
                    <td>{selectedInterface.name}</td>
                    <td>{selectedInterface.interface_type}</td>
                    <td>{selectedInterface.status}</td>
                    <td>{selectedInterface.mac_address || "N/A"}</td>
                    <td>{selectedInterface.ip_address || "N/A"}</td>
                    </tr>
                </tbody>
              </table>
            ) : (
              <p className="no-interfaces">No interfaces found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
