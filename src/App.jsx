import { invoke } from "@tauri-apps/api";
import React, { useState, useEffect } from "react";
import './styles.css'; // Import the CSS file

function App() {
  const [interfaces, setInterfaces] = useState([]);
  const [isPanelVisible, setIsPanelVisible] = useState(false); // Track visibility of panel
  const [activeButton, setActiveButton] = useState(null); // Track the active button
  const [filteredInterfaces, setFilteredInterfaces] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    status: "",
    mac_address: "",
    ip_address: "",
  });

  const fetchInterfaces = async () => {
    try {
      const result = await invoke("list_network_interfaces");
      setInterfaces(result); // Set fetched interfaces to state
    } catch (error) {
      console.error("Error fetching network interfaces:", error);
    }
  };  

  const saveInterfaces = async () => {
    try {
      await invoke("save_network_interfaces", { interfaces });
      alert("Interfaces saved successfully!");
    } catch (error) {
      console.error('Error saving network interfaces:', error);
    }
  };

  const loadInterfaces = async () => {
    try {
      const savedInterfaces = await invoke("load_network_interfaces");
      setInterfaces(savedInterfaces);
      alert("Interfaces loaded successfully!");
    } catch (error) {
      console.error('Error loading network interfaces:', error);
    }
  };

  // Filter interfaces based on user input
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));

    // Apply filters to the list of interfaces
    const filtered = interfaces.filter((iface) => {
      return (
        (!filters.name || iface.name.toLowerCase().includes(filters.name.toLowerCase())) &&
        (!filters.status || iface.status.toLowerCase().includes(filters.status.toLowerCase())) &&
        (!filters.mac_address || (iface.mac_address || "").toLowerCase().includes(filters.mac_address.toLowerCase())) &&
        (!filters.ip_address || (iface.ip_address || "").toLowerCase().includes(filters.ip_address.toLowerCase()))
      );
    });
    setFilteredInterfaces(filtered);
  };

  // Toggle the visibility of the panel
  const togglePanelVisibility = () => {
    setIsPanelVisible(prev => !prev);
  };

  // Set the clicked button as active
  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName); 
  };

  // Optionally load interfaces on component mount (if needed)
  useEffect(() => {
    loadInterfaces();
  }, []);

  return (
    <div className="center">
      <div className="p-4">
        <h1>Network Interface Details</h1>

        {/* Button to toggle visibility */}
        {/* Centered buttons container */}
         <div className="button-container">
         <button
          onClick={() => {
            fetchInterfaces();
            togglePanelVisibility(); // Toggle panel visibility
            handleButtonClick("display"); // Set active button
          }}
          className={`button ${activeButton === "display" ? "active" : ""}`}
        >
          {isPanelVisible ? "Hide Network Interfaces" : "Show Network Interfaces"}
        </button>
          <button onClick={() => {
            saveInterfaces();
            togglePanelVisibility();
            handleButtonClick("display"); 
          }}  className={`button ${activeButton === "display" ? "active" : ""}`}>
            Save Interfaces
          </button>
        </div>
        {/* Filters */}
        <div className="filters-container">
          <h3>Filter Interfaces: Search by Name, Status, MAC, or IP</h3>
          <div className="filters">
            <input
              type="text"
              placeholder="Search by Name, Status, MAC, or IP"
              value={filters.query}
              onChange={(e) => {
                const query = e.target.value.toLowerCase();
                setFilters({ ...filters, query });

                // Apply the unified filter
                const filtered = interfaces.filter((iface) =>
                  iface.name.toLowerCase().includes(query) ||
                  iface.status.toLowerCase().includes(query) ||
                  (iface.mac_address || "").toLowerCase().includes(query) ||
                  (iface.ip_address || "").toLowerCase().includes(query)
                );
                setFilteredInterfaces(filtered);
              }}
            />
          </div>
        </div>

        {/* Display Interfaces */}
        {/* Table to display interfaces, only show if the panel is visible */}
        {isPanelVisible && (
          <div className="table-container">
            {interfaces.length > 0 ? (
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
                  {interfaces.map((iface, index) => (
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
              <p className="no-interfaces">No interface found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
