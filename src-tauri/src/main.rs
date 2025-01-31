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
    ip_address: Option<String>,
}

// Path to save JSON file
fn get_data_file_path(config: &Config) -> PathBuf {
    tauri::api::path::app_data_dir(config) // Pass config to the function
        .expect("Failed to get app data directory")
        .join("network_interfaces.json")
}

// List network interfaces
#[command]
fn list_network_interfaces() -> Result<Vec<NetworkInterface>, String> {
    let mut interfaces = Vec::new();

    for iface in datalink::interfaces() {
        let name = &iface.name; 
        let interface_type = match iface.is_up() {
            true => if iface.is_loopback() { "Wi-Fi" } else { "Ethernet" },
            // If the interface is not up, the type is labeled as Unknown.
            false => "Unknown",
        };
        let status = if iface.is_up() { "active" } else { "inactive" }; 
        println!("Interface {} status: {}", name, status); // Log the status for debugging
        let mac_address = iface.mac.map(|mac| mac.to_string());
        let ip_address = iface.ips.first().map(|ip| ip.to_string());
    
        interfaces.push(NetworkInterface {
            name: name.to_string(), 
            interface_type: interface_type.to_string(),
            status: status.to_string(),
            mac_address,
            ip_address,
        });
    }    

    Ok(interfaces)
}


// Save interfaces in a JSON file
#[command]
fn save_network_interfaces(interfaces: Vec<NetworkInterface>, config: tauri::State<'_, tauri::Config>) -> Result<(), String> {
    let file_path = get_data_file_path(&config);
    let json_data = serde_json::to_string_pretty(&interfaces)
        .map_err(|e| format!("Failed to serialize data: {}", e))?;

    fs::write(&file_path, json_data)
        .map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

// Load interfaces from a JSON file
#[command]
fn load_network_interfaces(config: tauri::State<'_, tauri::Config>) -> Result<Vec<NetworkInterface>, String> {
    let file_path = get_data_file_path(&config);

    if !file_path.exists() {
        return Ok(Vec::new()); // Retorna vazio se o arquivo não existir
    }

    let json_data = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    let interfaces: Vec<NetworkInterface> = serde_json::from_str(&json_data)
        .map_err(|e| format!("Failed to deserialize data: {}", e))?;

    Ok(interfaces)
}

fn main() {
    tauri::Builder::default()
        .manage(tauri::Config::default()) // Manages the `Config` state
        .invoke_handler(tauri::generate_handler![
            list_network_interfaces,
            save_network_interfaces,
            load_network_interfaces
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

