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
    gateway: Option<String>,  // New field for Gateway
    dns: Option<String>,      // New field for DNS
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
            gateway: None,  // Gateway and DNS can be None for now
            dns: None,
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

    fs::write(&file_path, json_data).map_err(|e| format!("Failed to write to file: {}", e))
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

// Update the Gateway and DNS of a network interface and save to the JSON file
#[command]
fn update_gateway_dns(index: usize, gateway: Option<String>, dns: Option<String>) -> Result<(), String> {
    let mut interfaces = load_network_interfaces()?; // Load existing interfaces

    if index >= interfaces.len() {
        return Err("Invalid interface index".to_string());
    }

    // Update Gateway and DNS
    interfaces[index].gateway = gateway;
    interfaces[index].dns = dns;

    save_network_interfaces(interfaces) // Save changes
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_network_interfaces,
            save_network_interfaces,
            load_network_interfaces,
            update_ipv4_address,
            delete_ipv4_address,
            update_gateway_dns  // Add the new command here
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
