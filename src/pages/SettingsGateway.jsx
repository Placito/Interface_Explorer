import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { invoke } from "@tauri-apps/api/tauri"; // Import Tauri's invoke function

function SettingsGateway() {
  // useLocation hook to access the state passed from the HomePage
  const location = useLocation();
  const { selectedInterface } = location.state || {};

  // State for form inputs
  const [gatewayName, setGatewayName] = useState("");
  const [gatewayIP, setGatewayIP] = useState("");
  const [subnetMask, setSubnetMask] = useState(
    selectedInterface?.subnet_mask || ""
  );
  const [gateways, setGateways] = useState({});

  // Load gateways from local storage on component mount
  useEffect(() => {
    const savedGateways = localStorage.getItem("gateways");
    if (savedGateways) {
      setGateways(JSON.parse(savedGateways));
    }
  }, []);

  // Save selected interface details to local storage
  useEffect(() => {
    if (selectedInterface) {
      localStorage.setItem(
        "selectedInterface",
        JSON.stringify(selectedInterface)
      );
    }
  }, [selectedInterface]);

  // Custom alert function
  const showAlert = (message) => {
    alert(message);
  };

  // Function to check if two IP addresses are on the same network
  const isSameNetwork = (ip1, ip2, subnetMask) => {
    if (!ip1 || !ip2 || !subnetMask) {
      return false;
    }
    const ipToBinary = (ip) =>
      ip
        .split(".")
        .map(Number)
        .map((num) => num.toString(2).padStart(8, "0"))
        .join("");
    const subnetToBinary = (mask) =>
      mask
        .split(".")
        .map(Number)
        .map((num) => num.toString(2).padStart(8, "0"))
        .join("");

    const ip1Binary = ipToBinary(ip1);
    const ip2Binary = ipToBinary(ip2);
    const subnetBinary = subnetToBinary(subnetMask);

    for (let i = 0; i < subnetBinary.length; i++) {
      if (subnetBinary[i] === "1" && ip1Binary[i] !== ip2Binary[i]) {
        return false;
      }
    }
    return true;
  };

  // Function to save gateways to a JSON file
  const saveGatewaysToFile = async (gateways) => {
    try {
      const selectedIndex = selectedInterface?.index ?? 0; // Ensure index is defined
      await invoke("save_gateways", {
        index: selectedIndex,
        gateways: gateways[selectedInterface.name],
      }); // Use Tauri's invoke function
      console.log("Gateways saved to file successfully!");
    } catch (error) {
      console.error("Error saving gateways to file:", error);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!gatewayName || !gatewayIP || !subnetMask) {
      showAlert("All fields are required!");
      return;
    }

    // Check if the gateway IP is on the same network as the interface IP
    if (
      selectedInterface &&
      isSameNetwork(selectedInterface.ip_address, gatewayIP, subnetMask)
    ) {
      showAlert(
        "The gateway IP address is in the same network as the interface IP address."
      );
      return;
    }

    // Add the new gateway to the list of gateways
    const newGateway = {
      name: gatewayName,
      ip: gatewayIP,
      subnet_mask: subnetMask,
    };
    const updatedGateways = {
      ...gateways,
      [selectedInterface.name]: [
        ...(gateways[selectedInterface.name] || []),
        newGateway,
      ],
    };
    setGateways(updatedGateways);

    console.log("New Gateway Added:", newGateway);

    // Save the gateways to local storage
    localStorage.setItem("gateways", JSON.stringify(updatedGateways));

    // Save the gateways to a JSON file
    saveGatewaysToFile(updatedGateways);

    // Reset form
    setGatewayName("");
    setGatewayIP("");
    setSubnetMask(selectedInterface?.subnet_mask || "");
  };

  /**
   * Handles the click event for deleting the Gateway of an interface.

  * @param {number} index - The index of the gateway to delete.
   */
  const handleDeleteGateway = async (index) => {
    console.log("Function handleDeleteGateway called with index:", index);

    if (
      typeof index === "number" &&
      index >= 0 &&
      index < (gateways[selectedInterface.name] || []).length
    ) {
      try {
        const selectedIndex = selectedInterface?.index ?? 0; // Ensure index is defined

        // Save the updated gateways to a JSON file
        await invoke("delete_gateways", {
          index: selectedIndex,
          gatewayIndices: [index],
        }); // Use Tauri's invoke function

        // Remove the gateway from the list
        const updatedGateways = {
          ...gateways,
          [selectedInterface.name]: gateways[selectedInterface.name].filter(
            (_, i) => i !== index
          ),
        };
        setGateways(updatedGateways);

        // Save the updated gateways to local storage
        localStorage.setItem("gateways", JSON.stringify(updatedGateways));

        console.log("Gateway deleted successfully!");
      } catch (error) {
        console.error("Error deleting Gateway:", error);
      }
    } else {
      console.error("Invalid index");
    }
  };

  return (
    <div>
      <div className="Gateway-table">
        <h2>Interface Settings</h2>
        <br />
        <table>
          <thead>
            <tr>
              <th>Interface Name</th>
              <th>IP Address</th>
              <th>IPv4 Address</th>
              <th>Subnet Mask</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{selectedInterface?.name || "N/A"}</td>
              <td>{selectedInterface?.ip_address || "N/A"}</td>
              <td>{selectedInterface?.ipv4_address || "N/A"}</td>
              <td>{selectedInterface?.subnet_mask || "N/A"}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <br />
      <div className="Gateway-header">
        <h3>Add New Gateway:</h3>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Gateway Name:</label>
            <input
              type="text"
              value={gatewayName}
              onChange={(e) => setGatewayName(e.target.value)}
              required
            />
          </div>
          <br />
          <div>
            <label>Gateway IP:</label>
            <input
              type="text"
              value={gatewayIP}
              onChange={(e) => setGatewayIP(e.target.value)}
              required
            />
          </div>
          <br />
          <div>
            <label>Subnet Mask:</label>
            <input
              type="text"
              value={subnetMask}
              onChange={(e) => setSubnetMask(e.target.value)}
              required
            />
          </div>
          <br />
          <button className="button" type="submit">
            Add Gateway
          </button>
        </form>
      </div>
      <div className="Gateway-list">
        <h3>The List of the existing Gateways:</h3>
        <ul>
          {(gateways[selectedInterface?.name] || []).map((gateway, index) => (
            <li key={index}>
              {gateway.name} - {gateway.ip} - {gateway.subnet_mask}
              <button
                onClick={() => handleDeleteGateway(index)}
                className="button_Delete"
              >
                <i title="Delete" className="fa-solid fa-trash-can"></i>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <Link className="Link-home" to="/">
        Go back to Home
      </Link>
    </div>
  );
}

export default SettingsGateway;
