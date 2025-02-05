import { invoke } from "@tauri-apps/api";
import React, { useState, useRef, useEffect } from "react";

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
    dns: "",
  });
  // useRef is used to create a reference to the input element. The focusInput function uses this reference to focus the input element when the button is clicked.
  const inputRef = useRef(null); 
  const [selectedInterfaceIndex, setSelectedInterfaceIndex] = useState(null); // Add state for selected interface index

  /**
 * Fetches the list of network interfaces from the backend.
 * This function is called when the component is mounted.
 */
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

/**
 * Checks if any field of the interface matches the filter value.
 * @param {Object} iface - The network interface object.
 * @param {string} value - The filter value.
 * @returns {boolean} - True if any field matches the filter value, false otherwise.
 */
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

/**
 * Handles the change event for the filter input.
 * Filters the list of interfaces based on the input value.
 * @param {Object} e - The event object.
 */
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

    // General match for other queries
    return matchesFilter(iface, value);
  });

  setFilteredInterfaces(filtered);
  setIsDropdownVisible(value.length > 0 && filtered.length > 0);
  if (filtered.length === 0) {
    setSelectedInterface(null);
  }
};

/**
 * Handles the keydown event for the filter input.
 * Selects the first filtered interface when the Enter key is pressed.
 * @param {Object} e - The event object.
 */
const handleKeyDown = (e) => {
  if (e.key === "Enter" && filteredInterfaces.length > 0) {
    const selected = filteredInterfaces[0];
    setSelectedInterface(selected);
    setQuery(selected.name);
    setIsDropdownVisible(false);
    setIsPanelVisible(false); // Ensure the panel with all details is hidden
  }
};

/**
 * Toggles the visibility of the panel displaying network interfaces.
 */
const togglePanelVisibility = () => {
  setSelectedInterface(null);
  setQuery("");
  setFilteredInterfaces(interfaces);
  setIsPanelVisible((prev) => !prev);
};

/**
 * Handles the click event for a button.
 * Sets the active button state.
 * @param {string} buttonName - The name of the button.
 */
const handleButtonClick = (buttonName) => {
  setActiveButton(buttonName);
};

/**
 * Fetches the list of network interfaces when the component is mounted.
 */
useEffect(() => {
  fetchInterfaces();
}, []);

/**
 * Saves the list of network interfaces to the backend.
 */
const saveInterfaces = async () => {
  try {
    await invoke("save_network_interfaces", { interfaces });
    console.log("Interfaces saved successfully!");
  } catch (error) {
    console.error("Error saving interfaces:", error);
  }
};

/**
 * Highlights the matching part of the text based on the query.
 * @param {string} text - The text to be highlighted.
 * @param {string} query - The query to match.
 * @returns {JSX.Element} - The highlighted text.
 */
const highlightMatch = (text, query) => {
  if (!query || !text) return text; // Handle empty values safely

  const regex = new RegExp(`(${query})`, "gi");
  return text.split(regex).map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span
        key={index}
        style={{ backgroundColor: "yellow", fontWeight: "bold" }}
      >
        {part}
      </span>
    ) : (
      part
    )
  );
};

/**
 * Handles the click event for deleting the IPv4 address of an interface.
 * @param {number} index - The index of the interface.
 */
const handleDeleteIPv4 = async (index) => {
  console.log("Function handleDeleteIPv4 called with index:", index);

  if (typeof index === "number" && index >= 0 && index < interfaces.length) {
    try {
      await invoke("delete_ipv4_address", { index });
      console.log("IPv4 address deleted successfully!");

      // Update the state to reflect the changes in the UI
      const updatedInterfaces = interfaces.map((iface, i) =>
        i === index ? { ...iface, ipv4_address: "N/A" } : iface
      );
      setInterfaces(updatedInterfaces);
      setFilteredInterfaces(updatedInterfaces);
      if (selectedInterface && selectedInterface.name === interfaces[index].name) {
        setSelectedInterface({ ...selectedInterface, ipv4_address: "N/A" });
      }
    } catch (error) {
      console.error("Error deleting IPv4 address:", error);
    }
  } else {
    console.error("No interface selected or invalid index");
  }
  console.log("Interfaces:", interfaces);
};

/**
 * Handles the click event for editing a field of an interface.
 * @param {number} index - The index of the interface.
 * @param {Array<string>} fields - The fields to be edited.
 * @param {Array<string>} values - The values of the fields.
 */
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

/**
 * Handles the change event for an input field.
 * Updates the temporary values state.
 * @param {Object} e - The event object.
 */
const handleInputChange = (e) => {
  const { name, value } = e.target;
  setTempValues((prev) => ({ ...prev, [name]: value }));
};

/**
 * Handles the keydown event for an input field.
 * Saves the updated value when the Enter key is pressed.
 * @param {Object} e - The event object.
 * @param {number} index - The index of the interface.
 * @param {string} field - The field to be updated.
 */
const handleKeyDownField = async (e, index, field) => {
  if (e.key === "Enter") {
    let value = tempValues[field];
    if (value === "N/A") {
      console.error(`Cannot update ${field}. Value is "N/A".`);
      return;
    }

    if (field === "gateway" || field === "dns") {
      const newValues = value.split(",").map((item) => item.trim());
      value = [...interfaces[index][field], ...newValues];
    }

    const updatedInterfaces = interfaces.map((iface, i) =>
      i === index ? { ...iface, [field]: value } : iface
    );

    try {
      await invoke("save_network_interfaces", {
        interfaces: updatedInterfaces,
      });
      setFilteredInterfaces(updatedInterfaces);
      setInterfaces(updatedInterfaces);
      setEditableFields((prev) => ({ ...prev, [field]: false }));
      if (
        selectedInterface &&
        selectedInterface[field] === interfaces[index][field]
      ) {
        setSelectedInterface({
          ...selectedInterface,
          [field]: value,
        });
      }
      console.log(`${field} updated successfully!`);
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  }
};

/**
 * Handles the click event for adding a gateway to an interface.
 */
const handleAddClickGateway = (index) => {
  console.log("Function handleAddClickGateway called with index:", index);

  if (typeof index === "number" && index >= 0 && index < interfaces.length) {
    const interfaceData = interfaces[index];
    console.log("Interface Data:", interfaceData);

    handleEditClick(index, ["gateway"], [interfaceData.gateway]);
    console.log("Add button clicked for gateway");
  } else {
    console.error("No interface selected or invalid index");
  }
  console.log("Interfaces:", interfaces);
};

/**
 * Handles the click event for adding a DNS entry to an interface.
 */
const handleAddClickDns = (index) => {
  console.log("Function handleAddClickDns called with index:", index);

  if (typeof index === "number" && index >= 0 && index < interfaces.length) {
    const interfaceData = interfaces[index];
    console.log("Interface Data:", interfaceData);

    handleEditClick(index, ["dns"], [interfaceData.dns]);
    console.log("Add button clicked for dns");
  } else {
    console.error("No interface selected or invalid index");
  }
  console.log("Interfaces:", interfaces);
};

  /**
 * Handles the click event for adding an IPv4 address.
 * This function is called when the add button is clicked.
 */
  const handleAddClickIpv4 = (index) => {
    console.log("Function handleAddClickIpv4 called with index:", index);
  
    if (typeof index === "number" && index >= 0 && index < interfaces.length) {
      const interfaceData = interfaces[index];
      console.log("Interface Data:", interfaceData);
  
      if (interfaceData.ipv4_address === "N/A" || interfaceData.ipv4_address === null || interfaceData.ipv4_address === "") {
        handleEditClick(index, ["ipv4_address"], [""]);
        console.log("Add button clicked for ipv4_address");
      } else {
        console.error("Cannot add. ipv4_address is not N/A, null, or empty.");
      }
    } else {
      console.error("No interface selected or invalid index");
    }
    console.log("Interfaces:", interfaces);
  };
/**
 * Handles the click event for updating an IPv4 address.
 * This function is called when the edit button is clicked.
 * It checks if the IPv4 address is not "N/A" and allows editing if true.
 */
  const handleUpdateClickIpv4 = async (index) => {
    console.log("Function handleUpdateClickIpv4 called with index:", index);

    if (typeof index === "number" && index >= 0 && index < interfaces.length) {
      const interfaceData = interfaces[index];
      console.log("Interface Data:", interfaceData);

      if (interfaceData.ipv4_address !== "N/A") {
        handleEditClick(index, ["ipv4_address"], [interfaceData.ipv4_address]);
        console.log("Update button clicked for ipv4_address");

        // Update the IPv4 address in the backend
        try {
          await invoke("update_ipv4_address", {
            index,
            ipv4_address: tempValues.ipv4_address,
          });
          console.log("IPv4 address updated successfully!");

          // Update the state to reflect the changes in the UI
          const updatedInterfaces = interfaces.map((iface, i) =>
            i === index ? { ...iface, ipv4_address: tempValues.ipv4_address } : iface
          );
          setInterfaces(updatedInterfaces);
          setFilteredInterfaces(updatedInterfaces);
          setSelectedInterface(updatedInterfaces[index]);
        } catch (error) {
          console.error("Error updating IPv4 address:", error);
        }
      } else {
        console.error("Cannot update. ipv4_address is N/A.");
      }
    } else {
      console.error("No interface selected or invalid index");
    }
    console.log("Interfaces:", interfaces);
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
              {isDropdownVisible ? (
                <ul className="autocomplete-dropdown" style={{ width: inputRef.current?.offsetWidth }}>
                  {filteredInterfaces.map((iface, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setSelectedInterface(iface);
                        setQuery(iface.name);
                        setIsDropdownVisible(false);
                        setIsPanelVisible(false); // Ensure the panel with all details is hidden
                        setSelectedInterfaceIndex(
                          interfaces.findIndex((i) => i.name === iface.name)
                        ); // Set the index of the selected interface
                      }}
                    >
                      {highlightMatch(iface.name, query)}
                      {iface.status?.toLowerCase() === "active" && (
                        <span> {highlightMatch("(Active)", query)}</span>
                      )}
                      {iface.status?.toLowerCase() === "inactive" && (
                        <span> {highlightMatch("(Inactive)", query)}</span>
                      )}
                      {iface.interface_type
                        ?.toLowerCase()
                        .includes("wi-fi") && (
                        <span> {highlightMatch("(Wi-Fi)", query)}</span>
                      )}
                      {iface.interface_type?.toLowerCase().includes("eth") && (
                        <span> {highlightMatch("(Ethernet)", query)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  {selectedInterface ? (
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
                                  onKeyDown={(e) => handleKeyDownField(e, selectedInterfaceIndex, "gateway")} // Save on Enter key press
                                  onBlur={() =>
                                    setEditableFields((prev) => ({
                                      ...prev,
                                      gateway: false,
                                    }))
                                  } // Close input when clicking outside
                                  autoFocus
                                />
                              ) : (
                                <span>
                                  {selectedInterface.gateway &&
                                  selectedInterface.gateway.length > 0
                                    ? selectedInterface.gateway.join(", ")
                                    : "N/A"}
                                  {selectedInterface.gateway !== "N/A" && (
                                    <i
                                      title="Add new entry"
                                      className="fa-solid fa-circle-plus"
                                      onClick={() => handleAddClickGateway(selectedInterfaceIndex)}
                                      style={{ cursor: "pointer", marginLeft: "5px" }}
                                    ></i>
                                  )}
                                </span>
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
                                  onKeyDown={(e) => handleKeyDownField(e, selectedInterfaceIndex, "dns")} // Save on Enter key press
                                  onBlur={() =>
                                    setEditableFields((prev) => ({
                                      ...prev,
                                      dns: false,
                                    }))
                                  } // Close input when clicking outside
                                  autoFocus
                                />
                              ) : (
                                <span>
                                  {selectedInterface.dns && selectedInterface.dns.length > 0
                                    ? selectedInterface.dns.join(", ")
                                    : "N/A"}
                                  {selectedInterface.dns !== "N/A" && (
                                    <i
                                      title="Add new entry"
                                      className="fa-solid fa-circle-plus"
                                      onClick={() => handleAddClickDns(selectedInterfaceIndex)}
                                      style={{ cursor: "pointer", marginLeft: "5px" }}
                                    ></i>
                                  )}
                                </span>
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
      onKeyDown={(e) => handleKeyDownField(e, selectedInterfaceIndex, "ipv4_address")} // Save on Enter key press
      onBlur={() =>
        setEditableFields((prev) => ({
          ...prev,
          ipv4_address: false,
        }))
      } // Close input when clicking outside
      autoFocus
      style={{ width: "150px" }} // Set smaller width for the input field
    />
  ) : (
    <span>{selectedInterface.ipv4_address === "N/A" || selectedInterface.ipv4_address === null || selectedInterface.ipv4_address === "" ? "N/A" : selectedInterface.ipv4_address}</span>
  )}
</td>
<td>
  <div className="button_Actions">
    {selectedInterface.ipv4_address === "N/A" || selectedInterface.ipv4_address === null || selectedInterface.ipv4_address === "" ? (
      <button
        onClick={() => handleAddClickIpv4(selectedInterfaceIndex)}
        className={`button_Icon nputFormatted ${
          activeInput === "display" ? "active" : ""
        }`}
      >
        <i
          title="Add new"
          className="fa-regular fa-address-book"
        ></i>
      </button>
    ) : (
      <button
        onClick={() => handleUpdateClickIpv4(selectedInterfaceIndex)}
        className={`button_Icon nputFormatted ${
          activeInput === "display" ? "active" : ""
        }`}
      >
        <i
          title="Edit"
          className="fa-solid fa-pen-to-square"
        ></i>
      </button>
    )}
    <button
      onClick={() => handleDeleteIPv4(selectedInterfaceIndex)}
      className="button_Icon"
    >
      <i title="Delete" className="fa-solid fa-trash-can"></i>
    </button>
  </div>
</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    !isDropdownVisible && query && !isPanelVisible && <div>No interfaces available to select</div>
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
                              <th>Gateway</th>
                              <th title="Domain Name System">DNS</th>
                              <th title="Internet Protocol version 4">IPv4</th>
                              <th title="IP address">IP</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredInterfaces.map((iface, index) => (
                              <tr className="clickable"
                                key={index}
                                onClick={() => {
                                  setSelectedInterface(iface);
                                  setIsPanelVisible(false); // Ensure the panel with all details is hidden
                                  setSelectedInterfaceIndex(
                                    interfaces.findIndex((i) => i.name === iface.name)
                                  ); // Set the index of the selected interface
                                }}
                              >
                                <td>{highlightMatch(iface.name, query)}</td>
                                <td>{iface.interface_type}</td>
                                <td>{iface.status}</td>
                                <td>{iface.mac_address || "N/A"}</td>
                                <td>{iface.gateway.length > 0 ? iface.gateway.join(", ") : "N/A"}</td>
                                <td>{iface.dns.length > 0 ? iface.dns.join(", ") : "N/A"}</td>
                                <td>{iface.ipv4_address || "N/A"}</td>
                                <td>{iface.ip_address || "N/A"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div>No interfaces available</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;