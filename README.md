# A2A Client UI

A modern A2A (Agent-to-Agent) client desktop application built with Tauri + React + TypeScript.

[中文版 README](README.zh-CN.md)

## 🚀 Project Overview

A2A Client UI is a cross-platform desktop application that provides a user-friendly interface for interacting with A2A servers. The app supports multi-tab chat, real-time streaming responses, message history management, and more, offering users a smooth AI conversation experience.

## ✨ Key Features

- **Multi-tab Chat**: Support for multiple concurrent conversation sessions
- **Real-time Streaming**: Real-time streaming display of AI messages
- **A2A Server Management**: Configure and manage multiple A2A servers
- **Cross-platform Support**: Support for Windows, macOS, and Linux

## 📦 Installation and Setup

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Rust** >= 1.85.0
- **Cargo** (Rust package manager)

### Install Dependencies

```bash
# Install frontend dependencies
pnpm install

# Install Rust dependencies (will execute automatically)
cargo build
```

### Development Mode

```bash
# Start development server
pnpm dev

# Or use Tauri development mode
pnpm tauri dev
```

### Build Application

```bash
# Build frontend
pnpm build

# Build desktop application
pnpm tauri build
```

## 🎯 Core Functionality

### Chat Features
- **MessageList**: Message list component with virtual scrolling support
- **ChatInput**: Chat input component with streaming response support
- **MessageItem**: Single message component with copy and rendering capabilities

### Settings Features
- **A2A Server Management**: Configure and manage A2A servers
- **Model Configuration**: Set AI model parameters
- **Agent Management**: Configure chat agents

### System Features
- **Multi-tab Support**: Multiple conversation sessions
- **Local Storage**: SQLite-based chat history storage
- **System Integration**: Deep integration with operating system

## 🔧 Configuration

### Development Environment

Configure proxy settings in `config/config.ts`:

```typescript
proxy: {
    "/admin": {
        target: "http://localhost:8080",
        changeOrigin: true,
    },
}
```

### Tauri Configuration

Configure application information in `src-tauri/tauri.conf.json`:

```json
{
  "productName": "A2A Client",
  "version": "0.1.4",
  "identifier": "site.cj2a7t.opena2a"
}
```

## 🚀 Deployment

### Build Production Version

```bash
# Build installation packages for all platforms
pnpm tauri build

# Build for specific platform
pnpm tauri build --target x86_64-apple-darwin  # macOS
pnpm tauri build --target x86_64-pc-windows-msvc  # Windows
pnpm tauri build --target x86_64-unknown-linux-gnu  # Linux
```

After building, installation packages will be located in the `src-tauri/target/release/bundle/` directory.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Note**: This is a project under development, and features may be continuously updated and improved.