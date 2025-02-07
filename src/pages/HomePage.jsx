import { invoke } from "@tauri-apps/api";
import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

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
  const inputRef = useRef(null);
  const [selectedInterfaceIndex, setSelectedInterfaceIndex] = useState(null);

  const fetchInterfaces = async () => {
    try {
      const result = await invoke("list_network_interfaces");
      console.log(result);

      // Load gateways from local storage
      const savedGateways = localStorage.getItem("gateways");
      const parsedGateways = savedGateways ? JSON.parse(savedGateways) : {};

      // Merge gateways from JSON file and local storage
      const mergedInterfaces = result.map((iface) => {
        const localGateways = parsedGateways[iface.name] || [];
        return {
          ...iface,
          gateway: [...iface.gateway, ...localGateways],
        };
      });

      setInterfaces(mergedInterfaces);
      setFilteredInterfaces(mergedInterfaces);
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

      return matchesFilter(iface, value);
    });

    setFilteredInterfaces(filtered);
    setIsDropdownVisible(value.length > 0 && filtered.length > 0);
    if (filtered.length === 0) {
      setSelectedInterface(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && filteredInterfaces.length > 0) {
      const selected = filteredInterfaces[0];
      setSelectedInterface(selected);
      setQuery(selected.name);
      setIsDropdownVisible(false);
      setIsPanelVisible(false);
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
      await invoke("save_network_interfaces", { interfaces });
      console.log("Interfaces saved successfully!");
    } catch (error) {
      console.error("Error saving interfaces:", error);
    }
  };

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;

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

  const handleDeleteIPv4 = async (index) => {
    console.log("Function handleDeleteIPv4 called with index:", index);

    if (typeof index === "number" && index >= 0 && index < interfaces.length) {
      try {
        await invoke("delete_ipv4_address", { index });
        console.log("IPv4 address deleted successfully!");

        const updatedInterfaces = interfaces.map((iface, i) =>
          i === index ? { ...iface, ipv4_address: "N/A" } : iface
        );
        setInterfaces(updatedInterfaces);
        setFilteredInterfaces(updatedInterfaces);
        if (
          selectedInterface &&
          selectedInterface.name === interfaces[index].name
        ) {
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

  const handleAddClickIpv4 = (index) => {
    console.log("Function handleAddClickIpv4 called with index:", index);

    if (typeof index === "number" && index >= 0 && index < interfaces.length) {
      const interfaceData = interfaces[index];
      console.log("Interface Data:", interfaceData);

      if (
        interfaceData.ipv4_address === "N/A" ||
        interfaceData.ipv4_address === null ||
        interfaceData.ipv4_address === ""
      ) {
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

  const handleUpdateClickIpv4 = async (index) => {
    console.log("Function handleUpdateClickIpv4 called with index:", index);

    if (typeof index === "number" && index >= 0 && index < interfaces.length) {
      const interfaceData = interfaces[index];
      console.log("Interface Data:", interfaceData);

      if (interfaceData.ipv4_address !== "N/A") {
        handleEditClick(index, ["ipv4_address"], [interfaceData.ipv4_address]);
        console.log("Update button clicked for ipv4_address");

        try {
          await invoke("update_ipv4_address", {
            index,
            ipv4_address: tempValues.ipv4_address,
          });
          console.log("IPv4 address updated successfully!");

          const updatedInterfaces = interfaces.map((iface, i) =>
            i === index
              ? { ...iface, ipv4_address: tempValues.ipv4_address }
              : iface
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
                <ul
                  className="autocomplete-dropdown"
                  style={{ width: inputRef.current?.offsetWidth }}
                >
                  {filteredInterfaces.map((iface, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setSelectedInterface(iface);
                        setQuery(iface.name);
                        setIsDropdownVisible(false);
                        setIsPanelVisible(false);
                        setSelectedInterfaceIndex(
                          interfaces.findIndex((i) => i.name === iface.name)
                        );
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
                      <table className="table-details">
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
                            <td>
                              {selectedInterface.gateway &&
                              selectedInterface.gateway.length > 0 &&
                              selectedInterface.gateway.some(
                                (gateway) =>
                                  gateway.name !== "N/A" &&
                                  gateway.ip !== "N/A" &&
                                  gateway.subnet_mask !== "N/A"
                              )
                                ? selectedInterface.gateway.length-1
                                : "N/A"}
                              <Link
                                to={{
                                  pathname: "/settingsGateway",
                                  state: {
                                    selectedInterface: {
                                      ...selectedInterface,
                                      index: selectedInterfaceIndex,
                                    },
                                  },
                                }}
                              >
                                <i
                                  title="Add new entry"
                                  className="fa-solid fa-circle-plus"
                                ></i>
                              </Link>
                            </td>
                            <td>
                              {selectedInterface.dns &&
                              selectedInterface.dns.length > 0
                                ? selectedInterface.dns.join(", ")
                                : "N/A"}
                              <Link
                                to={{
                                  pathname: "/settingsDNS",
                                  state: { selectedInterface },
                                }}
                              >
                                <i
                                  title="Add new entry"
                                  className="fa-solid fa-circle-plus"
                                ></i>
                              </Link>
                            </td>
                            <td>
                              {editableFields.ipv4_address ? (
                                <input
                                  type="text"
                                  name="ipv4_address"
                                  value={tempValues.ipv4_address}
                                  onChange={handleInputChange}
                                  placeholder="IPv4 address"
                                  onKeyDown={(e) =>
                                    handleKeyDownField(
                                      e,
                                      selectedInterfaceIndex,
                                      "ipv4_address"
                                    )
                                  }
                                  onBlur={() =>
                                    setEditableFields((prev) => ({
                                      ...prev,
                                      ipv4_address: false,
                                    }))
                                  }
                                  autoFocus
                                  style={{ width: "150px" }}
                                />
                              ) : (
                                <span>
                                  {selectedInterface.ipv4_address === "N/A" ||
                                  selectedInterface.ipv4_address === null ||
                                  selectedInterface.ipv4_address === ""
                                    ? "N/A"
                                    : selectedInterface.ipv4_address}
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="button_Actions">
                                {selectedInterface.ipv4_address === "N/A" ||
                                selectedInterface.ipv4_address === null ||
                                selectedInterface.ipv4_address === "" ? (
                                  <button
                                    onClick={() =>
                                      handleAddClickIpv4(selectedInterfaceIndex)
                                    }
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
                                    onClick={() =>
                                      handleUpdateClickIpv4(
                                        selectedInterfaceIndex
                                      )
                                    }
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
                                  onClick={() =>
                                    handleDeleteIPv4(selectedInterfaceIndex)
                                  }
                                  className="button_Icon"
                                >
                                  <i
                                    title="Delete"
                                    className="fa-solid fa-trash-can"
                                  ></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    !isDropdownVisible &&
                    query &&
                    !isPanelVisible && (
                      <div>No interfaces available to select</div>
                    )
                  )}
                  {isPanelVisible && !selectedInterface && (
                    <div>
                      {filteredInterfaces.length > 0 ? (
                        <table table-details>
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
                              <tr
                                className="clickable"
                                key={index}
                                onClick={() => {
                                  setSelectedInterface(iface);
                                  setIsPanelVisible(false);
                                  setSelectedInterfaceIndex(
                                    interfaces.findIndex(
                                      (i) => i.name === iface.name
                                    )
                                  );
                                }}
                              >
                                <td>{highlightMatch(iface.name, query)}</td>
                                <td>{iface.interface_type}</td>
                                <td>{iface.status}</td>
                                <td>{iface.mac_address || "N/A"}</td>
                                <td>
                                  {iface.gateway &&
                                  iface.gateway.length > 0 &&
                                  iface.gateway.some(
                                    (gateway) =>
                                      gateway.name !== "N/A" &&
                                      gateway.ip !== "N/A" &&
                                      gateway.subnet_mask !== "N/A"
                                  )
                                    ? iface.gateway.length-1
                                    : "N/A"}
                                </td>
                                <td>
                                  {iface.dns.length > 0
                                    ? iface.dns.join(", ")
                                    : "N/A"}
                                </td>
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
