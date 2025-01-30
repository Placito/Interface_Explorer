import { invoke } from "@tauri-apps/api";
import React, { useState, useEffect } from "react";
import './styles.css'; // Import the CSS file

function App() {
  const [interfaces, setInterfaces] = useState([]);

  const fetchInterfaces = async () => {
    const result = await invoke("list_network_interfaces");
    setInterfaces(result);
  };

  const saveInterfaces = async () => {
    await invoke("save_network_interfaces", { interfaces });
    alert("Interfaces salvas com sucesso!");
  };

  const loadInterfaces = async () => {
    const savedInterfaces = await invoke("load_network_interfaces");
    setInterfaces(savedInterfaces);
    alert("Interfaces loaded successfully!");
  };

  useEffect(() => {
    loadInterfaces();
  }, []);

  return (
    <div className="center">
      <div className="p-4">
        <h1>Network Interface Details</h1>

        {/* Centered buttons container */}
        <div className="button-container">
          <button onClick={fetchInterfaces} className="button">
            Display Interfaces
          </button>
          <button onClick={saveInterfaces} className="button">
            Save Interfaces
          </button>
          <button onClick={loadInterfaces} className="button">
            Load Interfaces
          </button>
        </div>

        {/* Table to display interfaces */}
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
      </div>
    </div>
  );
}

export default App;
