# 🚀 DeepSeek Docker Setup - Easily Deploy DeepSeek AI with Ollama & Apache

## 🏆 Overview
This repository provides a **one-click Docker setup** for running **DeepSeek AI** with **Ollama and Apache**. With this **Docker Compose** configuration, you can quickly install and run **DeepSeek** on your local machine or server.

---

## 📦 What's Inside?
- **Docker Compose File (`docker-compose.yml`)** → Automates deployment.
- **Prebuilt Docker Image** → Uses `byron758/woohengine-deepseek:1.2`.
- **Apache Web Server** → Serves the DeepSeek AI frontend.
- **Ollama AI Model** → Runs DeepSeek's **1.5B parameter model**.
- **🌍 Interactive Frontend Interface** → A simple web-based UI for chatting with DeepSeek.

---

## ⚡ Installation & Quick Start

### 1️⃣ Install Docker & Docker Compose
Ensure you have Docker and Docker Compose installed:

- **Ubuntu/Linux**:
  ```sh
  sudo apt update && sudo apt install docker.io docker-compose -y
  ```

- **Mac (via Homebrew)**:
  ```sh
  brew install docker docker-compose
  ```

- **Windows (via WSL)**:
  1. Install Docker Desktop from docker.com
  2. Enable WSL 2 Backend in Docker settings.

### 2️⃣ Clone This Repository
```sh
git clone https://github.com/byronomio/deepseek-docker-setup.git
cd deepseek-docker-setup
```

### 3️⃣ Run DeepSeek AI
To start the container, run:
```sh
docker compose up -d
```
- `-d` runs the container in detached mode.

To stop the container, run:
```sh
docker compose down
```

#### 🌍 Web-Based Frontend Interface
This setup includes a simple web-based chat interface for interacting with DeepSeek AI.

**Access the UI**
Once the container is running, open:
```
http://<your-server-ip>:8088
```

**Features**
- ✅ Simple Chatbox UI → Enter prompts and get AI responses in real-time.
- ✅ Live Streaming Responses → Messages update dynamically without delays.
- ✅ Mobile-Friendly Design → Works on desktops, tablets, and phones.

---

🔍 **How It Works**
1. Pulls the `byron758/woohengine-deepseek:1.2` image (which includes Apache & Ollama).
2. Starts DeepSeek AI on `http://<your-server-ip>:8088`.
3. Exposes the DeepSeek API at `http://<your-server-ip>:11434/api/generate`.
4. Hosts a Web UI → Chat directly with DeepSeek from your browser.

---

🌐 **Accessing the DeepSeek API**
Once running, you can test the API using curl:
```sh
curl -X POST http://<your-server-ip>:11434/api/generate -H "Content-Type: application/json" -d '{
    "model": "deepseek-r1:1.5b",
    "prompt": "What is DeepSeek AI?"
}'
```

🛠 **Customization**

**Use a Different Model**  
To use a different DeepSeek AI model, modify the `docker-compose.yml` file:
```yaml
environment:
  - OLLAMA_MODEL=deepseek-r1:7b
```
Then restart:
```sh
docker compose down && docker compose up -d
```

---

💡 **Why Use This Setup?**
- ✅ One Command Installation → Runs with `docker compose up -d`
- ✅ No Manual Configurations → Everything is automated
- ✅ Cross-Platform → Works on Linux, macOS, and Windows
- ✅ Interactive Frontend → Web UI included for easy chat interactions
- ✅ Lightweight → Uses minimal dependencies

---

📜 **License**
This project is open-source under the MIT License.

💬 **Support & Contributions**
- Found an issue? Open an Issue.
- Want to contribute? Fork the repo and submit a Pull Request.

🚀 Deploy DeepSeek AI in minutes with this Docker setup!
⭐ Star this repository if you find it useful!
