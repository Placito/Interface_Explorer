use serde::{Deserialize, Serialize};
use sqlx::sqlite::SqlitePool;
use std::fs;
use std::io::Result;
use tauri::command;

// Define the struct for network interfaces
#[derive(Serialize, Deserialize, Debug)]
pub struct NetworkInterface {
    pub name: String,
    pub interface_type: String,
    pub status: String,
    pub mac_address: Option<String>,
    pub ip_address: Option<String>,
    pub ipv4_address: Option<String>,
}

// Constants for file and database paths
const DB_URL: &str = "sqlite:network_interfaces.db";
const FILE_PATH: &str = "network_interfaces.json";

// Save network interfaces to a JSON file
fn save_interfaces_to_file(interfaces: &[NetworkInterface]) -> Result<()> {
    let json = serde_json::to_string_pretty(interfaces)?;
    fs::write(FILE_PATH, json)?;
    Ok(())
}

// Read network interfaces from a JSON file
fn read_interfaces_from_file() -> Result<Vec<NetworkInterface>> {
    let data = fs::read_to_string(FILE_PATH)?;
    let interfaces: Vec<NetworkInterface> = serde_json::from_str(&data)?;
    Ok(interfaces)
}

// Insert a network interface into the database
async fn insert_interface(pool: &SqlitePool, iface: &NetworkInterface) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        INSERT INTO network_interfaces (name, interface_type, status, mac_address, ip_address, ipv4_address)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        "#,
        iface.name,
        iface.interface_type,
        iface.status,
        iface.mac_address,
        iface.ip_address,
        iface.ipv4_address
    )
    .execute(pool)
    .await?;
    Ok(())
}

// Fetch all network interfaces from the database
async fn fetch_interfaces(pool: &SqlitePool) -> Result<Vec<NetworkInterface>, sqlx::Error> {
    let rows = sqlx::query!(
        r#"
        SELECT name, interface_type, status, mac_address, ip_address, ipv4_address
        FROM network_interfaces
        "#
    )
    .fetch_all(pool)
    .await?;

    let interfaces = rows
        .into_iter()
        .map(|row| NetworkInterface {
            name: row.name,
            interface_type: row.interface_type,
            status: row.status,
            mac_address: row.mac_address,
            ip_address: row.ip_address,
            ipv4_address: row.ipv4_address,
        })
        .collect();

    Ok(interfaces)
}

// Update a network interface in the database
async fn update_interface(
    pool: &SqlitePool,
    old_name: &str,
    new_iface: &NetworkInterface,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        UPDATE network_interfaces
        SET name = ?1, interface_type = ?2, status = ?3, mac_address = ?4, ip_address = ?5, ipv4_address = ?6
        WHERE name = ?7
        "#,
        new_iface.name,
        new_iface.interface_type,
        new_iface.status,
        new_iface.mac_address,
        new_iface.ip_address,
        new_iface.ipv4_address,
        old_name
    )
    .execute(pool)
    .await?;
    Ok(())
}

// Delete a network interface from the database
async fn delete_interface(pool: &SqlitePool, name: &str) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        DELETE FROM network_interfaces
        WHERE name = ?1
        "#,
        name
    )
    .execute(pool)
    .await?;
    Ok(())
}

// Sync JSON file data to the database
async fn sync_file_to_db(pool: &SqlitePool) -> Result<(), Box<dyn std::error::Error>> {
    let interfaces = read_interfaces_from_file()?;
    for iface in interfaces {
        insert_interface(pool, &iface).await?;
    }
    Ok(())
}

// Sync database data to the JSON file
async fn sync_db_to_file(pool: &SqlitePool) -> Result<(), Box<dyn std::error::Error>> {
    let interfaces = fetch_interfaces(pool).await?;
    save_interfaces_to_file(&interfaces)?;
    Ok(())
}

// Tauri command to fetch network interfaces
#[command]
async fn get_interfaces() -> Result<Vec<NetworkInterface>, String> {
    let pool = SqlitePool::connect(DB_URL).await.map_err(|e| e.to_string())?;
    fetch_interfaces(&pool).await.map_err(|e| e.to_string())
}

// Tauri command to add a new network interface
#[command]
async fn add_interface(iface: NetworkInterface) -> Result<(), String> {
    let pool = SqlitePool::connect(DB_URL).await.map_err(|e| e.to_string())?;
    insert_interface(&pool, &iface).await.map_err(|e| e.to_string())
}

// Tauri command to update a network interface
#[command]
async fn update_interface_command(old_name: String, new_iface: NetworkInterface) -> Result<(), String> {
    let pool = SqlitePool::connect(DB_URL).await.map_err(|e| e.to_string())?;
    update_interface(&pool, &old_name, &new_iface).await.map_err(|e| e.to_string())
}

// Tauri command to delete a network interface
#[command]
async fn delete_interface_command(name: String) -> Result<(), String> {
    let pool = SqlitePool::connect(DB_URL).await.map_err(|e| e.to_string())?;
    delete_interface(&pool, &name).await.map_err(|e| e.to_string())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Set up SQLite database
    let pool = SqlitePool::connect(DB_URL).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;

    // Sync data from file to database initially
    sync_file_to_db(&pool).await?;

    // Run the Tauri app
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_interfaces,
            add_interface,
            update_interface_command,
            delete_interface_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");

    Ok(())
}
