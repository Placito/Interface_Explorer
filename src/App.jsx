import { invoke } from "@tauri-apps/api";
import React, { useState, useEffect } from "react";
import './styles.css'; // Import the CSS file

function App() {
  const [interfaces, setInterfaces] = useState([]);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [activeButton, setActiveButton] = useState(null);
  const [filteredInterfaces, setFilteredInterfaces] = useState([]);
  const [query, setQuery] = useState(''); // Single query state for search

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
              />
              <i className="fa-solid fa-magnifying-glass search-icon"></i>
              {/* Autocomplete dropdown */}
              {query && filteredInterfaces.length > 0 && (
                <ul className="autocomplete-dropdown">
                  {filteredInterfaces.map((iface, index) => (
                    <li key={index} onClick={() => setQuery(iface.name)}>
                      {iface.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

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
                    </tr>
                  ))}
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
