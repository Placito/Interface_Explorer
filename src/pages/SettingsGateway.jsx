import React from 'react';
import { Link } from 'react-router-dom';

function SettingsGateway() {
  const [interfaceData, setInterfaceData] = useState({
    name: "bridge0",
    interface_type: "Ethernet",
    status: "Active",
    mac_address: "36:64:78:2f:62:c0",
    ipv4_address: null,
    gateway: [],
    dns: [],
  });

  const [newGateway, setNewGateway] = useState("");

  const handleAddGateway = () => {
    if (newGateway.trim() !== "") {
      setInterfaceData((prevData) => ({
        ...prevData,
        gateway: [...prevData.gateway, newGateway],
      }));
      setNewGateway(""); // Clear input field
    }
  };

  return (
    <div>
      <h2>Manage Interface</h2>
      <label>Gateways:</label>
      <ul>
        {interfaceData.gateway.map((gw, index) => (
          <li key={index}>{gw}</li>
        ))}
      </ul>
      <input
        type="text"
        placeholder="Enter new gateway"
        value={newGateway}
        onChange={(e) => setNewGateway(e.target.value)}
      />
      <button onClick={handleAddGateway}>Add Gateway</button>
    </div>
  );
}

export default SettingsGateway;
