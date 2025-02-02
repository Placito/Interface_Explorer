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
  const [editableFields, setEditableFields] = useState({});
  const [tempValues, setTempValues] = useState({
    ipv4_address: "",
    gateway: "",
    dns: ""
  });
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
      if (value === "inactive") return iface.status?.toLowerCase() === "inactive";
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
      setIsPanelVisible(false); // Ensure the panel with all details is hidden
    }
  };

  const togglePanelVisibility = () => {
    setSelectedInterface(null);
    setQuery("");
    setFilteredInterfaces(interfaces);
    setIsPanelVisible((prev) => !prev);
  };

  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName);
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
  
  const handleDeleteIPv4 = async (ifaceToUpdate) => {
    const updatedInterfaces = interfaces.map((iface) =>
      iface === ifaceToUpdate ? { ...iface, ipv4_address: "N/A" } : iface
    );

    try {
      await invoke("save_network_interfaces", {
        interfaces: updatedInterfaces,
      });
      setFilteredInterfaces(updatedInterfaces);
      setInterfaces(updatedInterfaces);
      if (selectedInterface === ifaceToUpdate) {
        setSelectedInterface({ ...ifaceToUpdate, ipv4_address: "N/A" });
      }
      console.log("IPv4 address deleted successfully!");
    } catch (error) {
      console.error("Error deleting IPv4 address:", error);
    }
  };

  const handleEditClick = (index, fields, values) => {
    const newEditableFields = {};
    const newTempValues = {};
    fields.forEach((field, i) => {
      newEditableFields[field] = true;
      newTempValues[field] = values[i] || "";
    });
    setEditableFields((prev) => ({ ...prev, ...newEditableFields }));
    setTempValues((prev) => ({ ...prev, ...newTempValues }));
    setActiveInput(index);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleKeyDownField = async (e, index, field) => {
    if (e.key === "Enter") {
      const updatedInterfaces = interfaces.map((iface, i) =>
        i === index ? { ...iface, [field]: tempValues[field] } : iface
      );

      try {
        await invoke("save_network_interfaces", {
          interfaces: updatedInterfaces,
        });
        setFilteredInterfaces(updatedInterfaces);
        setInterfaces(updatedInterfaces);
        setEditableFields((prev) => ({ ...prev, [field]: false }));
        if (selectedInterface && selectedInterface[field] === interfaces[index][field]) {
          setSelectedInterface({ ...selectedInterface, [field]: tempValues[field] });
        }
        console.log(`${field} updated successfully!`);
      } catch (error) {
        console.error(`Error updating ${field}:`, error);
      }
    }
  };

  const handleAddClick = (index) => {
    if (index !== null && index !== undefined) {
      handleEditClick(index, ["gateway", "dns", "ipv4_address"], [interfaces[index].gateway, interfaces[index].dns, interfaces[index].ipv4_address]);
    } else {
      console.error("No interface selected");
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
                        setIsPanelVisible(false); // Ensure the panel with all details is hidden
                      }}
                    >
                      {highlightMatch(iface.name, query)}
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
                  <th title="Actions performe on the IPv4 atribute">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{selectedInterface.name}</td>
                  <td>{selectedInterface.interface_type}</td>
                  <td>{selectedInterface.status}</td>
                  <td>{selectedInterface.mac_address || "N/A"}</td>
                  <td>{selectedInterface.ip_address || "N/A"}</td>
                  <td>
                    {editableFields.gateway ? (
                      <input
                        type="text"
                        name="gateway"
                        value={tempValues.gateway}
                        onChange={handleInputChange}
                        placeholder="Gateway"
                        onKeyDown={(e) => handleKeyDownField(e, 0, "gateway")} // Save on Enter key press
                        onBlur={() =>
                          setEditableFields((prev) => ({
                            ...prev,
                            gateway: false,
                          }))
                        } // Close input when clicking outside
                        autoFocus
                      />
                    ) : (
                      <span>{selectedInterface.gateway || "N/A"}</span>
                    )}
                  </td>
                  <td>
                    {editableFields.dns ? (
                      <input
                        type="text"
                        name="dns"
                        value={tempValues.dns}
                        onChange={handleInputChange}
                        placeholder="DNS"
                        onKeyDown={(e) => handleKeyDownField(e, 0, "dns")} // Save on Enter key press
                        onBlur={() =>
                          setEditableFields((prev) => ({
                            ...prev,
                            dns: false,
                          }))
                        } // Close input when clicking outside
                        autoFocus
                      />
                    ) : (
                      <span>{selectedInterface.dns || "N/A"}</span>
                    )}
                  </td>
                  <td>
                    {editableFields.ipv4_address ? (
                      <input
                        type="text"
                        name="ipv4_address"
                        value={tempValues.ipv4_address}
                        onChange={handleInputChange}
                        placeholder="IPv4 address"
                        onKeyDown={(e) => handleKeyDownField(e, 0, "ipv4_address")} // Save on Enter key press
                        onBlur={() =>
                          setEditableFields((prev) => ({
                            ...prev,
                            ipv4_address: false,
                          }))
                        } // Close input when clicking outside
                        autoFocus
                      />
                    ) : (
                      <span>{selectedInterface.ipv4_address || "N/A"}</span>
                    )}
                  </td>
                  <td>
                    <div className="button_Actions">
                      <button
                        onClick={() =>
                          handleAddClick(
                            0,
                            ["gateway"],
                            [selectedInterface.gateway],
                            ["dns"],
                            [selectedInterface.dns],
                            ["ipv4_address"],
                            [selectedInterface.ipv4_address]
                          )
                        }
                        className={`button_Icon nputFormatted ${activeInput === "display" ? "active" : ""}`}
                      >
                        <i className="fa-regular fa-address-book"></i>
                      </button>
                      <button
                        onClick={() => handleEditClick(0, ["ipv4_address"], [selectedInterface.ipv4_address])}
                        className={`button_Icon nputFormatted ${activeInput === "display" ? "active" : ""}`}
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteIPv4(selectedInterface)}
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

        {isPanelVisible && !selectedInterface && (
          <div>
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
                    <th title="Actions performe on the IPv4 atribute">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterfaces.map((iface, index) => (
                    <tr key={index}>
                      <td>{highlightMatch(iface.name, query)}</td>
                      <td>{iface.interface_type}</td>
                      <td>{iface.status}</td>
                      <td>{iface.mac_address || "N/A"}</td>
                      <td>{iface.ip_address || "N/A"}</td>
                      <td>
                        {editableFields.gateway && activeInput === index ? (
                          <input
                            type="text"
                            name="gateway"
                            value={tempValues.gateway}
                            onChange={handleInputChange}
                            placeholder="Gateway"
                            onKeyDown={(e) => handleKeyDownField(e, index, "gateway")} // Save on Enter key press
                            onBlur={() =>
                              setEditableFields((prev) => ({
                                ...prev,
                                gateway: false,
                              }))
                            } // Close input when clicking outside
                            autoFocus
                          />
                        ) : (
                          <span>{iface.gateway || "N/A"}</span>
                        )}
                      </td>
                      <td>
                        {editableFields.dns && activeInput === index ? (
                          <input
                            type="text"
                            name="dns"
                            value={tempValues.dns}
                            onChange={handleInputChange}
                            placeholder="DNS"
                            onKeyDown={(e) => handleKeyDownField(e, index, "dns")} // Save on Enter key press
                            onBlur={() =>
                              setEditableFields((prev) => ({
                                ...prev,
                                dns: false,
                              }))
                            } // Close input when clicking outside
                            autoFocus
                          />
                        ) : (
                          <span>{iface.dns || "N/A"}</span>
                        )}
                      </td>
                      <td>
                        {editableFields.ipv4_address && activeInput === index ? (
                          <input
                            type="text"
                            name="ipv4_address"
                            value={tempValues.ipv4_address}
                            onChange={handleInputChange}
                            placeholder="IPv4 address"
                            onKeyDown={(e) => handleKeyDownField(e, index, "ipv4_address")} // Save on Enter key press
                            onBlur={() =>
                              setEditableFields((prev) => ({
                                ...prev,
                                ipv4_address: false,
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
                          handleAddClick(
                            index,
                            ["gateway"],
                            [iface.gateway],
                            ["dns"],
                            [iface.dns],
                            ["ipv4_address"],
                            [iface.ipv4_address]
                          )
                        }
                        className={`button_Icon nputFormatted ${activeInput === "display" ? "active" : ""}`}
                      >
                        <i className="fa-regular fa-address-book"></i>
                      </button>
                          <button
                            onClick={() => handleEditClick(index, ["ipv4_address"], [iface.ipv4_address])}
                            className={`button_Icon nputFormatted ${activeInput === index ? "active" : ""}`}
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