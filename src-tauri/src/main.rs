use pnet::datalink;
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::command;

// Gateway data structure
#[derive(Serialize, Deserialize, Debug, Clone)]
struct Gateway {
    name: String,
    ip: String,
    subnet_mask: String,
}

// Network data structure
#[derive(Serialize, Deserialize, Debug)]
struct NetworkInterface {
    name: String,
    interface_type: String,
    status: String,
    mac_address: Option<String>,
    ipv4_address: Option<String>,
    gateway: Vec<Gateway>, // A vector to store multiple gateways
    dns: Vec<String>,      // A vector to store multiple DNS entries
}

// Path to save JSON file (to the root of your repository)
fn get_data_file_path() -> PathBuf {
    env::current_dir()
        .expect("Failed to get current directory")
        .join("network_interfaces.json")
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

        // Fetch gateway and DNS information
        let gateway = get_gateway(&iface.name);
        let dns = get_dns();

        interfaces.push(NetworkInterface {
            name: iface.name.clone(),
            interface_type: interface_type.to_string(),
            status: status.to_string(),
            mac_address,
            ipv4_address,
            gateway,
            dns,
        });
    }

    Ok(interfaces)
}

// Function to get gateway information
fn get_gateway(interface_name: &str) -> Vec<Gateway> {
    let output = Command::new("sh")
        .arg("-c")
        .arg(format!("ip route show dev {}", interface_name))
        .output()
        .expect("Failed to execute command");

    let output_str = String::from_utf8_lossy(&output.stdout);
    let mut gateways = Vec::new();

    for line in output_str.lines() {
        if line.contains("default via") {
            if let Some(gateway_ip) = line.split_whitespace().nth(2) {
                gateways.push(Gateway {
                    name: "Default".to_string(),
                    ip: gateway_ip.to_string(),
                    subnet_mask: "255.255.255.0".to_string(), // Example subnet mask
                });
            }
        }
    }

    if gateways.is_empty() {
        gateways.push(Gateway {
            name: "N/A".to_string(),
            ip: "N/A".to_string(),
            subnet_mask: "N/A".to_string(),
        });
    }

    gateways
}

// Function to get DNS information
fn get_dns() -> Vec<String> {
    let output = Command::new("sh")
        .arg("-c")
        .arg("cat /etc/resolv.conf")
        .output()
        .expect("Failed to execute command");

    let output_str = String::from_utf8_lossy(&output.stdout);
    let mut dns_servers = Vec::new();

    for line in output_str.lines() {
        if line.starts_with("nameserver") {
            if let Some(dns) = line.split_whitespace().nth(1) {
                dns_servers.push(dns.to_string());
            }
        }
    }

    if dns_servers.is_empty() {
        dns_servers.push("N/A".to_string());
    }

    dns_servers
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
fn add_if_na(
    index: usize,
    gateway: Option<Vec<Gateway>>,
    dns: Option<Vec<String>>,
    ipv4_address: Option<String>,
) -> Result<(), String> {
    let mut interfaces = load_network_interfaces()?; // Load existing interfaces

    if index >= interfaces.len() {
        return Err("Invalid interface index".to_string());
    }

    let interface = &mut interfaces[index];

    // Only update if the value is "N/A"
    if let Some(gateway_values) = gateway {
        if interface.gateway.iter().any(|g| g.name == "N/A") {
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

// Save gateways in a JSON file
#[command]
fn save_gateways(index: usize, gateways: Vec<Gateway>) -> Result<(), String> {
    println!("Received gateways: {:?}", gateways); // Debug log

    let mut interfaces = load_network_interfaces()?; // Load existing interfaces

    if index >= interfaces.len() {
        return Err("Invalid interface index".to_string());
    }

    println!("interface index: {:?}", index); // Debug log
    interfaces[index].gateway = gateways; // Update gateways

    save_network_interfaces(interfaces)?; // Save changes to JSON file

    Ok(())
}

// Function to add gateways to a specific network interface
#[command]
fn add_gateways(index: usize, new_gateways: Vec<Gateway>) -> Result<(), String> {
    let mut interfaces = load_network_interfaces()?; // Load existing interfaces

    if index >= interfaces.len() {
        return Err("Invalid interface index".to_string());
    }

    let interface = &mut interfaces[index];

    // Replace "N/A" values with new ones or append new gateways
    for new_gateway in new_gateways {
        if let Some(na_gateway) = interface.gateway.iter_mut().find(|g| g.name == "N/A") {
            *na_gateway = new_gateway;
        } else {
            interface.gateway.push(new_gateway.clone());
        }
    }

    save_network_interfaces(interfaces)?; // Save changes to JSON file

    Ok(())
}

// Function to delete gateways from a specific network interface
#[command]
fn delete_gateways(index: usize, gateway_indices: Vec<usize>) -> Result<(), String> {
    let mut interfaces = load_network_interfaces()?; // Load existing interfaces

    if index >= interfaces.len() {
        return Err("Invalid interface index".to_string());
    }

    let interface = &mut interfaces[index];

    // Remove gateways by indices
    for &gateway_index in gateway_indices.iter().rev() {
        if gateway_index < interface.gateway.len() {
            interface.gateway.remove(gateway_index);
        } else {
            return Err("Invalid gateway index".to_string());
        }
    }

    save_network_interfaces(interfaces)?; // Save changes to JSON file

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_network_interfaces,
            save_network_interfaces,
            load_network_interfaces,
            update_ipv4_address,
            delete_ipv4_address,
            add_if_na,
            save_gateways,
            add_gateways,
            delete_gateways
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
