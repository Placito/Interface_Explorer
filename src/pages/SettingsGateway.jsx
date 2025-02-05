import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

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
  const [gateways, setGateways] = useState([]);

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

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!gatewayName || !gatewayIP || !subnetMask) {
      showAlert("All fields are required!");
      return;
    }

    /*  // Check if the selected interface has a valid IP address
    if (!selectedInterface?.ip_address) {
      showAlert("Selected interface does not have a valid IP address.");
      return;
    } */

    // Check if the gateway IP is on the same network as the interface IP
    if (isSameNetwork(selectedInterface.ip_address, gatewayIP, subnetMask)) {
      showAlert(
        "The gateway IP address is in the same network as the interface IP address."
      );
      return;
    }

    // Add the new gateway to the list of gateways
    const newGateway = {
      name: gatewayName,
      ip: gatewayIP,
      subnetMask,
    };
    setGateways([...gateways, newGateway]);

    console.log("New Gateway Added:", newGateway);

    // Reset form
    setGatewayName("");
    setGatewayIP("");
    setSubnetMask(selectedInterface?.subnet_mask || "");
  };

  return (
    <div>
        <h2>Interface Settings</h2>
      <br />
      <table className="Gateway-table">
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
          <div className="Gateway-header">
            <h3>Add New Gateway:</h3>
            <form onSubmit={handleSubmit}>
              <label>
                Gateway Name:
                <input
                  type="text"
                  value={gatewayName}
                  onChange={(e) => setGatewayName(e.target.value)}
                  required
                />
              </label>
              <br />
              <label>
                Gateway IP:
                <input
                  type="text"
                  value={gatewayIP}
                  onChange={(e) => setGatewayIP(e.target.value)}
                  required
                />
              </label>
              <br />
              <label>
                Subnet Mask:
                <input
                  type="text"
                  value={subnetMask}
                  onChange={(e) => setSubnetMask(e.target.value)}
                  required
                />
              </label>
              <br />
              <button className="button" type="submit">
                Add Gateway
              </button>
            </form>
          </div>
          <div className="Gateway-list">
            <h3>Gateways:</h3>
            <ul>
              {gateways.map((gateway, index) => (
                <li key={index}>
                  {gateway.name} - {gateway.ip} - {gateway.subnetMask}
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
