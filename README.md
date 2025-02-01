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
Offers the following operations for IPv4 addresses on the selected interface:
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
2. Install Dependencies using Bun:
   ``bun install``
3. Start development server:
   ``bun run tauri dev``

---

### For Development

1. Install Dependencies using Bun:
   ``bun install``
2. Build the project:
   ``cargo build``
3. Start development server:
   ``bun run tauri dev``

