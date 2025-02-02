import { invoke } from "@tauri-apps/api";
import React, { useState, useRef, useEffect } from "react";
import "./styles.css"; // Import the CSS file

function App() {
  const [interfaces, setInterfaces] = useState([]);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [activeButton, setActiveButton] = useState(null);
  const [activeInput, setActiveInput] = useState(null);
  const [filteredInterfaces, setFilteredInterfaces] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedInterface, setSelectedInterface] = useState(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [newInterface, setNewInterface] = useState({
    name: "",
    interface_type: "",
    status: "",
    mac_address: "",
    ip_address: "",
    ipv4_address: "",
  });
  const [editableIpv4s, setEditableIpv4s] = useState({});
  const [ipv4Temp, setIpv4Temp] = useState(""); // Fixed to an empty string
  const [gateway, setGateway] = useState('');
  const [dns, setDns] = useState('');
  const inputRef = useRef(null);  // Create a ref for the input element

  const fetchInterfaces = async () => {
    try {
      const result = await invoke("list_network_interfaces");
      console.log(result);
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
      if (value === "active") return iface.status?.toLowerCase() === "active";
      if (value === "inactive")
        return iface.status?.toLowerCase() === "inactive";
      if (value === "wifi")
        return iface.interface_type?.toLowerCase().includes("wi-fi");
      if (value === "eth")
        return iface.interface_type?.toLowerCase().includes("eth");
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
    setIsDropdownVisible(value.length > 0 && filtered.length > 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && filteredInterfaces.length > 0) {
      const selected = filteredInterfaces[0];
      setSelectedInterface(selected);
      setQuery(selected.name);
      setIsDropdownVisible(false);
    }
  };

  const togglePanelVisibility = () => {
    if (isFormVisible) {
      setIsFormVisible(false);
    } else {
      setIsPanelVisible((prev) => !prev);
    }
    setSelectedInterface(null);
    setQuery("");
    setFilteredInterfaces(interfaces);
  };

  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName);
  };

  const handleAddInterfaceClick = () => {
    setIsFormVisible(true);
    setIsPanelVisible(false);
    setActiveButton("save");

    setNewInterface({
      name: "",
      interface_type: "",
      status: "",
      mac_address: "",
      ip_address: "",
      ipv4_address: "",
      gateway: "",
      dns: "",
    });
  };

  const handleAddInterface = async () => {
    try {
      const updatedInterfaces = [...interfaces, newInterface];
      await invoke("save_network_interfaces", {
        interfaces: updatedInterfaces,
      });
      setInterfaces(updatedInterfaces);
      setFilteredInterfaces(updatedInterfaces);

      setNewInterface({
        name: "",
        interface_type: "",
        status: "",
        mac_address: "",
        ip_address: "",
        ipv4_address: "",
        gateway: "",
        dns: "",
      });

      console.log("New interface added successfully!");
    } catch (error) {
      console.error("Error adding new interface:", error);
    }
  };

  useEffect(() => {
    fetchInterfaces();
  }, []);

  const saveInterfaces = async () => {
    try {
      await invoke("save_network_interfaces", { interfaces: interfaces });
      console.log("Interfaces saved successfully!");
    } catch (error) {
      console.error("Error saving interfaces:", error);
    }
  };

  const highlightMatch = (text, query) => {
    if (!query || !text) return text; // Handle empty values safely
  
    const regex = new RegExp(`(${query})`, "gi");
    return text.split(regex).map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} style={{ backgroundColor: "yellow", fontWeight: "bold" }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };
  
  const getInterfaceName = (iface) => {
    if (!iface) return "";
    return typeof iface.name === "string" ? iface.name : JSON.stringify(iface.name);
  };
  

  const handleDeleteIPv4 = async (ifaceToUpdate) => {
    const updatedInterfaces = filteredInterfaces.map((iface) =>
      iface === ifaceToUpdate ? { ...iface, ipv4_address: "N/A" } : iface
    );

    try {
      await invoke("save_network_interfaces", {
        interfaces: updatedInterfaces,
      });
      setFilteredInterfaces(updatedInterfaces);
      setInterfaces(updatedInterfaces);
      console.log("IPv4 address deleted successfully!");
    } catch (error) {
      console.error("Error deleting IPv4 address:", error);
    }
  };

  const handleEditClick = (index, ipv4Value) => {
    setEditableIpv4s((prev) => ({ ...prev, [index]: true }));
    setIpv4Temp(ipv4Value || "");
    setActiveInput(index);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInterface({
      ...newInterface,
      [name]: value,
    });
    setActiveInput(name);
  };

  const handleUpdate = (e, index) => {
    setIpv4Temp(e.target.value);
  };

  const handleKeyDownIPv4 = async (e, index, ifaceToUpdate) => {
    if (e.key === "Enter") {
      const updatedInterfaces = filteredInterfaces.map((iface, i) =>
        i === index ? { ...iface, ipv4_address: ipv4Temp } : iface
      );

      try {
        await invoke("save_network_interfaces", {
          interfaces: updatedInterfaces,
        });
        setFilteredInterfaces(updatedInterfaces);
        setInterfaces(updatedInterfaces);
        setEditableIpv4s((prev) => ({ ...prev, [index]: false }));
        console.log("IPv4 address updated successfully!");
      } catch (error) {
        console.error("Error updating IPv4 address:", error);
      }
    }
  };

  // function to handle the gateway input - Gateways provide connectivity between two or more networks, convert data and information sent from a network into a format compatible with the receiving network.
  const handleGatewayChange = (e) => {
    setGateway(e.target.value);  // Update gateway state
  };

  // function to handle the DNS (Domain Name System) input
  const handleDnsChange = (e) => {
    setDns(e.target.value);  // Update DNS state
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
              if (!isPanelVisible) {
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
            onClick={handleAddInterfaceClick}
            className={`button ${activeButton === "save" ? "active" : ""}`}
          >
            Add Interface
          </button>
        </div>

        <div className="filters-container">
          <h3>Select an Interface:</h3>
          <div className="filters">
            <div>
              <input
                type="text"
                className="glass-input"
                placeholder="Search by Name, Status, Type, etc..."
                value={query}
                onChange={handleFilterChange}
                onKeyDown={handleKeyDown}
                ref={inputRef} 
              />
              {isDropdownVisible && (
  <ul className="autocomplete-dropdown">
    {filteredInterfaces.map((iface, index) => (
      <li
        key={index}
        onClick={() => {
          setSelectedInterface(iface);
          setQuery(iface.name);
          setIsDropdownVisible(false);
        }}
      >
         {/* Highlight matched text */}
      {/* Use safe function to get the name */}
      {highlightMatch(iface.name, query)}

      {/* Highlight extra info dynamically */}
      {iface.status?.toLowerCase() === "active" && (
        <span> {highlightMatch("(Active)", query)}</span>
      )}
      {iface.status?.toLowerCase() === "inactive" && (
        <span> {highlightMatch("(Inactive)", query)}</span>
      )}
      {iface.interface_type?.toLowerCase().includes("wi-fi") && (
        <span> {highlightMatch("(Wi-Fi)", query)}</span>
      )}
      {iface.interface_type?.toLowerCase().includes("eth") && (
        <span> {highlightMatch("(Ethernet)", query)}</span>
      )}
</li>
))}
</ul>
)}
            </div>
          </div>
        </div>

        {selectedInterface && (
          <div className="selected-interface-details">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th title="Media Access Control">MAC</th>
                  <th title="IP address">IP</th>
                  <th>Gateway</th>
                  <th title="Domain Name System">DNS</th>
                  <th title="Internet Protocol version 4">IPv4</th>
                  <th title="Actions performe on the IPv4 atribute">
                      Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{selectedInterface.name}</td>
                  <td>{selectedInterface.interface_type}</td>
                  <td>{selectedInterface.status}</td>
                  <td>{selectedInterface.mac_address || "N/A"}</td>
                  <td>{selectedInterface.ip_address || "N/A"}</td>
                  <td>{selectedInterface.gateway|| "N/A"}</td>
                  <td>{selectedInterface.dns || "N/A"}</td>
                  <td>{selectedInterface.ipv4_address || "N/A"}</td>
                  <td>
                        <div className="button_Actions">
                          <button
                            onClick={() =>
                              handleEditClick(index, iface.ipv4_address)
                            }
                            className={`button_Icon nputFormatted ${
                              activeInput === "display" ? "active" : ""
                            }`}
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
              </tbody>
            </table>
          </div>
        )}

        {isFormVisible && (
          <div className="add-interface-form">
            <h2>Add New Interface</h2>
            <div>
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
                        <label htmlFor="mac_address">MAC</label>
                      </td>
                      <td>
                        <input
                          type="text"
                          name="mac_address"
                          value={newInterface.mac_address}
                          onChange={handleInputChange}
                          placeholder="MAC (Media Access Control)"
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
                      <td>
                        <label htmlFor="gateway">Gateway</label>
                      </td>
                      <td>
                        <input
                          type="text"
                          name="gateway"
                          value={newInterface.gateway}
                          onChange={handleInputChange}
                          placeholder="Gateway"
                        />
                      </td>
                      </tr>
                      <tr>
                        <td>
                          <label htmlFor="dns">DNS</label>
                        </td>
                        <td>
                          <input
                            type="text"
                            name="dns"
                            value={newInterface.dns}
                            onChange={handleInputChange}
                            placeholder="DNS (Domain Name System)"
                          />
                        </td>
                      </tr>
                    <tr>
                      <td colSpan="2">
                        <div className="button_container">
                          <button type="submit" className="button">
                            Save Interface
                          </button>
                          <button
                            onClick={() => setIsFormVisible(false)}
                            className="button"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </form>
            </div>
          </div>
        )}

        {isPanelVisible && (
          <div >
            {filteredInterfaces.length > 0 ? (
              <table>
                <thead>
                  <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th title="Media Access Control">MAC</th>
                  <th title="IP address">IP</th>
                  <th>Gateway</th>
                  <th title="Domain Name System">DNS</th>
                  <th title="Internet Protocol version 4">IPv4</th>
                  <th title="Actions performe on the IPv4 atribute">
                      Actions
                  </th>
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
                      <td>{iface.gateway|| "N/A"}</td>
                      <td>{iface.dns || "N/A"}</td>
                      <td>
                        {editableIpv4s[index] ? (
                          <input
                            type="text"
                            value={ipv4Temp}
                            onChange={(e) => handleUpdate(e, index)} // Update on input change
                            placeholder="IPv4 address"
                            onKeyDown={(e) =>
                              handleKeyDownIPv4(e, index, iface)
                            } // Save on Enter key press
                            onBlur={() =>
                              setEditableIpv4s((prev) => ({
                                ...prev,
                                [index]: false,
                              }))
                            } // Close input when clicking outside
                            autoFocus
                          />
                        ) : (
                          <span>{iface.ipv4_address || "N/A"}</span>
                        )}
                      </td>

                      <td>
                        <div className="button_Actions">
                          <button
                            onClick={() =>
                              handleEditClick(index, iface.ipv4_address)
                            }
                            className={`button_Icon nputFormatted ${
                              activeInput === "display" ? "active" : ""
                            }`}
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
              <div>No interfaces available</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
