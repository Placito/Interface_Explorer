# Interface Explorer

Interface Explorer is a desktop application developed using the **Rust** programming language and the **Tauri** framework. It leverages **React** for the frontend and is powered by **Vite** for a fast development experience.

---

## About the Project

This application provides detailed insights into your system's network interfaces and allows for managing IP addresses seamlessly.

---

## Features

### 1. **List of Network Interfaces**
Displays all network interfaces (active/inactive) on a system, with the following details:
- **Name**  
- **Type** (Wi-Fi/Ethernet)  
- **Status** (active/inactive)  
- **MAC Address** (Media Access Control)

### 2. **Interface Selection**
Enables users to select a specific network interface for detailed management.

### 3. **IP Address Listing**
Lists all IP addresses (both IPv4 and IPv6) configured on the selected network interface.

### 4. **IPv4 Address Management**
The list of network interfaces is stored in a JSON file, allowing you to add, update, and delete entries.
For small or simple applications, this approach works perfectly fine and doesn't require the overhead of setting up a database:
- **Create IPv4 addresses**  
- **Delete IPv4 addresses**  
- **Modify existing IPv4 addresses**

---

## Getting Started

### Prerequisites
Make sure you have the following installed on your system:
- **Rust**  
- **Bun** ([Installation Guide](https://bun.sh/))  
- **Node.js** (optional, for additional development tooling)

---

### Installation & Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Interface_Explorer.git
   cd Interface_Explorer

2. check if Cargo is Installed, if not:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh source $HOME/.cargo/env
   ```

2. Install Dependencies using Bun:
   ```bash
   bun install
   ```
3. Build the project: (running cargo build without changing to the same directory of Cargo.toml file)

   3.1. Just compile Rust backend
   ```bash
   cargo build --manifest-path src-tauri/Cargo.toml
   ```

   3.2. When you are ready to release the full app
   ```bash
   cargo tauri build --manifest-path src-tauri/Cargo.toml
   ```

4. Start development server:
   ```bash
   bun run tauri dev
   ```

