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
- (optional) **Gateway** (is a device that acts as an access point between different networks) and **DNS** (Domain Name System)

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
3. Install Dependencies using Bun:
   ``bun install``
4. Start development server:
   ``bun run tauri dev``

---

### Setup & Build Instructions for GitHub Codespaces
1. Install Bun
Bun is a fast JavaScript runtime and package manager. Install it by running:

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # Reload shell configuration´
````

2. Install Rust & Cargo
Rust is required for building the Tauri application. Install Rust and Cargo (Rust’s package manager) using:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.bashrc  # Reload shell configuration
```

3. Install System Dependencies (Linux)
If you're using GitHub Codespaces or a Linux system, install GTK dependencies for Tauri:

```bash
sudo apt update && sudo apt install -y libgtk-3-dev pkg-config
```


### Building the Project


1. Install Dependencies using Bun:
   ```bash
   bun install
   ```
2. Build the project: (running cargo build without changing to the same directory of Cargo.toml file)

   2.1. Just compile Rust backend
   ```bash
   cargo build --manifest-path src-tauri/Cargo.toml
   ```

   2.2. When you are ready to release the full app
   ```bash
   cargo tauri build --manifest-path src-tauri/Cargo.toml
   ```

3. Start development server:
   ```bash
   bun run tauri dev
   ```

