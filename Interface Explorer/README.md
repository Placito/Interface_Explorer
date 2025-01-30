# Interface_Explorer

I developed this application using the Rust programming language in combination with the Tauri framework.  

---

## Features

1. **List of Network Interfaces**  
   Displays all interfaces (active/inactive) with the following details:  
   - Name  
   - Type (Wi-Fi/Ethernet)  
   - Status (active/inactive)  
   - MAC address  

2. **Interface Selection**  
   Allows the user to select a specific network interface.

3. **IP Address Listing**  
   Lists all IP addresses configured on the selected interface.

4. **IPv4 Address Management**  
   Enables the following operations on the selected interface:  
   - Create IPv4 addresses  
   - Delete IPv4 addresses  
   - Modify existing IPv4 addresses

----

## To get started:
  cd "Interface Explorer"
  bun install
  bun run tauri dev
  # Tauri + React

This template should help get you started developing with Tauri and React in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

