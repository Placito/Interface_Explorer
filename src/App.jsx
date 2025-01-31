import { invoke } from "@tauri-apps/api";
import React, { useState, useEffect } from "react";
import './styles.css'; // Import the CSS file

function App() {
  const [interfaces, setInterfaces] = useState([]);
  const [isPanelVisible, setIsPanelVisible] = useState(false); // Track visibility of panel

  const fetchInterfaces = async () => {
    try {
      const result = await invoke("list_network_interfaces");
      setInterfaces(result); // Set fetched interfaces to state
      setIsPanelVisible(true); // Make panel visible after data is fetched
    } catch (error) {
      console.error('Error fetching network interfaces:', error);
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

  // Toggle the visibility of the panel
  const togglePanelVisibility = () => {
    setIsPanelVisible(prev => !prev);
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
         <button onClick={togglePanelVisibility} className="button">
          {isPanelVisible ? "Hide Network Interfaces" : "Show Network Interfaces"}
        </button>
          <button onClick={saveInterfaces} className="button">
            Save Interfaces
          </button>
        </div>

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
