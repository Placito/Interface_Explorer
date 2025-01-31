use std::env;
use std::fs;
use std::path::PathBuf;
use serde::{Serialize, Deserialize};
use tauri::command;
use pnet::datalink; // For listing network interfaces
use tauri::Config;

// Network data structure
#[derive(Serialize, Deserialize)]
struct NetworkInterface {
    name: String,
    interface_type: String,
    status: String,
    mac_address: Option<String>,
    ipv4_address: Option<String>,
}

// Path to save JSON file (to the root of your repository)
fn get_data_file_path() -> PathBuf {
    // Get the current working directory (the root of your repo)
    let current_dir = env::current_dir()
        .expect("Failed to get current directory");

    // Return the path to the JSON file in the root of the repo
    current_dir.join("network_interfaces.json")
}

// List network interfaces
#[command]
fn list_network_interfaces() -> Result<Vec<NetworkInterface>, String> {
    let mut interfaces = Vec::new();

    for iface in datalink::interfaces() {
        let name = &iface.name;
        let interface_type = if iface.is_up() {
            if iface.is_loopback() {
                "Wi-Fi"
            } else {
                "Ethernet"
            }
        } else {
            "Unknown"
        };
        let status = if iface.is_up() { "active" } else { "inactive" };
        let mac_address = iface.mac.map(|mac| mac.to_string());

        // Extract IPv4 and IPv6 addresses
        let ipv4_address = iface.ips.iter()
            .find_map(|ip| if ip.is_ipv4() { Some(ip.ip().to_string()) } else { None });

        interfaces.push(NetworkInterface {
            name: name.to_string(),
            interface_type: interface_type.to_string(),
            status: status.to_string(),
            mac_address,
            ipv4_address,
        });
    }

    Ok(interfaces)
}

// Save interfaces in a JSON file
#[command]
fn save_network_interfaces(interfaces: Vec<NetworkInterface>) -> Result<(), String> {
    // Get the correct file path where JSON should be saved
    let file_path = get_data_file_path(); // Get path in root repo
    println!("Saving to file: {:?}", file_path); // Log the path

    // Serialize the network interfaces to JSON
    let json_data = serde_json::to_string_pretty(&interfaces)
        .map_err(|e| format!("Failed to serialize data: {}", e))?;

    // Write the JSON data to the file
    fs::write(&file_path, json_data)
        .map_err(|e| format!("Failed to write to file: {}", e))?;

    Ok(())
}

// Load interfaces from a JSON file
#[command]
fn load_network_interfaces() -> Result<Vec<NetworkInterface>, String> {
    let file_path = get_data_file_path(); // Get path in root repo

    if !file_path.exists() {
        return Ok(Vec::new()); // Return empty if the file doesn't exist
    }

    let json_data = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    let interfaces: Vec<NetworkInterface> = serde_json::from_str(&json_data)
        .map_err(|e| format!("Failed to deserialize data: {}", e))?;

    Ok(interfaces)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_network_interfaces,
            save_network_interfaces,
            load_network_interfaces
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
