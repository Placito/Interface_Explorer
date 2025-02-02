use pnet::datalink;
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::PathBuf;
use tauri::command;

// Network data structure
#[derive(Serialize, Deserialize)]
struct NetworkInterface {
    name: String,
    interface_type: String,
    status: String,
    mac_address: Option<String>,
    ipv4_address: Option<String>,
    gateway: Vec<String>, // A vector to store multiple gateways
    dns: Vec<String>,  // A vector to store multiple DNS entries  
}

// Path to save JSON file (to the root of your repository)
fn get_data_file_path() -> PathBuf {
    env::current_dir().expect("Failed to get current directory").join("network_interfaces.json")
}

// List network interfaces
#[command]
fn list_network_interfaces() -> Result<Vec<NetworkInterface>, String> {
    let mut interfaces = Vec::new();

    for iface in datalink::interfaces() {
        let interface_type = if iface.is_up() {
            if iface.is_loopback() {
                "Wi-Fi"
            } else {
                "Ethernet"
            }
        } else {
            "Unknown"
        };
        let status = if iface.is_up() { "Active" } else { "Inactive" };
        let mac_address = iface.mac.map(|mac| mac.to_string());

        let ipv4_address = iface.ips.iter().find_map(|ip| {
            if ip.is_ipv4() {
                Some(ip.ip().to_string())
            } else {
                None
            }
        });

        interfaces.push(NetworkInterface {
            name: iface.name.clone(),
            interface_type: interface_type.to_string(),
            status: status.to_string(),
            mac_address,
            ipv4_address,
            gateway: vec![],  // Initializing empty Vec for gateways
            dns: vec![], // Initializing empty Vec for DNS entries
        });
    }

    Ok(interfaces)
}

// Save interfaces in a JSON file
#[command]
fn save_network_interfaces(interfaces: Vec<NetworkInterface>) -> Result<(), String> {
    let file_path = get_data_file_path();
    let json_data = serde_json::to_string_pretty(&interfaces)
        .map_err(|e| format!("Failed to serialize data: {}", e))?;
    fs::write(&file_path, json_data).map_err(|e| format!("Failed to write to file: {}", e))?;
    Ok(())
}

// Load interfaces from a JSON file
#[command]
fn load_network_interfaces() -> Result<Vec<NetworkInterface>, String> {
    let file_path = get_data_file_path();

    if !file_path.exists() {
        return Ok(Vec::new()); // Return empty if file doesn’t exist
    }

    let json_data =
        fs::read_to_string(&file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    // Load the network_interfaces.json file and deserialize it into a Vec<NetworkInterface>
    serde_json::from_str(&json_data).map_err(|e| format!("Failed to deserialize data: {}", e))
}

// Update the IPv4 address of a network interface and save to the JSON file
#[command]
fn update_ipv4_address(index: usize, ipv4_address: Option<String>) -> Result<(), String> {
    let mut interfaces = load_network_interfaces()?; // Load existing interfaces

    if index >= interfaces.len() {
        return Err("Invalid interface index".to_string());
    }

    interfaces[index].ipv4_address = ipv4_address; // Update IPv4

    save_network_interfaces(interfaces) // Save changes
}

// Remove only the IPv4 address (sets it to "N/A") and save the changes
#[command]
fn delete_ipv4_address(index: usize) -> Result<(), String> {
    let mut interfaces = load_network_interfaces()?; // Load existing interfaces

    if index >= interfaces.len() {
        return Err("Invalid interface index".to_string());
    }

    interfaces[index].ipv4_address = Some("N/A".to_string()); // Set IPv4 to "N/A"

    save_network_interfaces(interfaces) // Save changes
}

// function that only adds or updates the gateway, dns, and ipv4_address fields if their current value is "N/A"
#[command]
fn add_if_na(index: usize, gateway: Option<Vec<String>>, dns: Option<Vec<String>>, ipv4_address: Option<String>) -> Result<(), String> {
    let mut interfaces = load_network_interfaces()?; // Load existing interfaces

    if index >= interfaces.len() {
        return Err("Invalid interface index".to_string());
    }

    let interface = &mut interfaces[index];

    // Only update if the value is "N/A"
    if let Some(gateway_values) = gateway {
        if interface.gateway.contains(&"N/A".to_string()) {
            interface.gateway = gateway_values;
        }
    }

    if let Some(dns_values) = dns {
        if interface.dns.contains(&"N/A".to_string()) {
            interface.dns = dns_values;
        }
    }

    if let Some(ipv4_value) = ipv4_address {
        if interface.ipv4_address == Some("N/A".to_string()) {
            interface.ipv4_address = Some(ipv4_value);
        }
    }

    // Save the modified interfaces
    save_network_interfaces(interfaces)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_network_interfaces,
            save_network_interfaces,
            load_network_interfaces,
            update_ipv4_address,
            delete_ipv4_address,
            add_if_na
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}