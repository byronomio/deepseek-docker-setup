
# 🚀 DeepSeek Docker Setup - Easily Deploy DeepSeek AI with Ollama & Apache

## 🏆 Overview

This repository provides a **one-click Docker setup** for running **DeepSeek AI** with **Ollama and Apache**. With this **Docker Compose** configuration, you can deploy a web interface to select, download, and interact with various DeepSeek models on your local machine or server. Version 1.3 introduces on-demand model downloading via the web interface, persistent model storage, and an enhanced UI with progress tracking, cancellation, and error handling.

---

## 📦 What's Inside?

- **Docker Compose File (`docker-compose.yml`)** → Automates deployment with model persistence.
- **Prebuilt Docker Image** → Uses `byron758/woohengine-deepseek:1.3`.
- **Apache Web Server** → Serves the DeepSeek AI frontend.
- **Ollama AI Models** → Supports 17 DeepSeek models, downloaded on-demand via the web interface.
- **🌍 Interactive Frontend Interface** → A feature-rich web-based UI for model management and AI interaction.

### Supported DeepSeek Models

- **deepseek-r1**: Reasoning models (1.5B, 7B, 14B, 32B, 70B)
- **deepseek-v3**: Mixture-of-Experts model (37B)
- **deepseek-coder-v2**: Code-focused models (Lite, 16B, 236B)
- **deepseek-coder**: Coding models (1B, 6.7B, 33B)
- **deepseek-llm**: General language models (7B, 67B)
- **deepseek-v2**: Economical MoE model (236B)
- **deepscaler**: Math-optimized model (1.5B)
- **deepseek-v2.5**: Enhanced general and coding model (236B)

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

  1. Install Docker Desktop from [docker.com](https://www.docker.com).
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
- **Note**: No model is downloaded during startup. You must select and download a model via the web interface.

To stop the container, run:

```sh
docker compose down
```

To view container logs (e.g., for debugging):

```sh
docker logs deepseek-container
```

#### 🌍 Web-Based Frontend Interface

The web interface allows you to select, download, and interact with DeepSeek models, with real-time feedback on download progress and AI responses.

**Access the UI**

Once the container is running, open:

```
http://<your-server-ip>:8088
```

**Features**

- ✅ **Model Selection**: Choose from 17 DeepSeek models via a dropdown, with estimated sizes displayed (e.g., `DeepSeek R1 (7B, ~14GB)`).
- ✅ **On-Demand Downloads**: Models are downloaded only when selected and initiated via the "Pull Model" button.
- ✅ **Progress Tracking**: A progress bar shows download percentage, total size, downloaded amount, and estimated time remaining (ETA).
- ✅ **Cancel Download**: A "Cancel Pull" button allows stopping downloads, with immediate UI reset.
- ✅ **Busy State**: A semi-transparent overlay prevents interactions during downloads, ensuring a smooth experience.
- ✅ **Persistent Downloads**: Download progress resumes on page reload, using `localStorage` to track active downloads.
- ✅ **Toast Notifications**: Success, error, and warning messages (e.g., "Model pulled successfully!", "Download stalled") enhance user feedback.
- ✅ **Error Handling**: Robust retry logic for network issues (e.g., `unexpected EOF`, `stalled`), with up to 3 retries and clear error messages.
- ✅ **Simple Chatbox UI**: Enter prompts and get AI responses in real-time, with responses prefixed by the model name (e.g., `DeepSeek (deepseek-r1:7b):`).
- ✅ **Live Streaming Responses**: Messages update dynamically without delays.
- ✅ **Mobile-Friendly Design**: Works on desktops, tablets, and phones.
- ✅ **Accessibility**: ARIA attributes on progress bar and inputs for screen reader support.

**Using the Web Interface**

1. Open the web UI at `http://<your-server-ip>:8088`.
2. Select a model from the dropdown (e.g., `deepseek-v3:37b`).
3. Click "Pull Model" to start downloading. Monitor progress with:
   - A progress bar (e.g., `50%`).
   - Details like `Total Size: 74.00 GB | Downloaded: 37.00 GB | Progress: 50.00% | ETA: 5 min 30 sec`.
   - A "Cancel Pull" button to stop the download.
4. If the page is reloaded during download, progress resumes automatically.
5. If a download fails (e.g., due to network issues), the UI retries up to 3 times and displays an error if unsuccessful.
6. Once downloaded, enter a prompt in the chatbox and click "Generate" to interact with the model.

---

🔍 **How It Works**

1. Pulls the `byron758/woohengine-deepseek:1.3` image, which includes Apache and Ollama.
2. Starts the container without downloading a model, exposing the web interface on `http://<your-server-ip>:8088` and the Ollama API on `http://<your-server-ip>:11434`.
3. Models are downloaded via the web interface using the Ollama `/api/pull` endpoint and stored in a persistent Docker volume (`/root/.ollama/models`).
4. The web UI provides model management (select, download, cancel) and AI interaction, with real-time feedback and error handling.

---

🌐 **Accessing the DeepSeek API**

Test the API using curl with a downloaded model:

```sh
curl -X POST http://<your-server-ip>:11434/api/generate -H "Content-Type: application/json" -d '{
    "model": "deepseek-r1:1.5b",
    "prompt": "What is DeepSeek AI?"
}'
```

---

🛠 **Customization**

- **Select Models via Web Interface**: Use the dropdown to choose and download any supported DeepSeek model. No manual configuration is needed.
- **Persistent Storage**: Models are stored in the `ollama_models` Docker volume, persisting across container restarts.
- **Debugging**: View console logs in the browser’s developer tools (F12, Console tab) for detailed information on download states, API responses, and UI updates. Example logs:
  ```plaintext
  [Load] Checking localStorage: downloadingModel=null
  [Load] No downloadingModel in localStorage, resetting UI
  [resetUI] Resetting UI state
  [pullModel] Selected model: deepseek-r1:7b
  [monitorPull] Starting download for deepseek-r1:7b, retry count: 0
  ```

---

💡 **Why Use This Setup?**

- ✅ **One Command Installation**: Runs with `docker compose up -d`.
- ✅ **On-Demand Downloads**: Models are downloaded only when selected, saving disk space and bandwidth.
- ✅ **Persistent Storage**: Models are saved across container restarts using a Docker volume.
- ✅ **Rich Web Interface**: Features model selection, progress tracking, cancellation, and error handling.
- ✅ **Flexible Model Selection**: Supports 17 DeepSeek models with a user-friendly dropdown.
- ✅ **Robust Error Handling**: Handles network issues with retries and clear feedback.
- ✅ **No Manual Configurations**: Everything is automated, from setup to model management.
- ✅ **Cross-Platform**: Works on Linux, macOS, and Windows.
- ✅ **Interactive Frontend**: Web UI for easy model management and AI interaction.
- ✅ **Lightweight**: Uses minimal dependencies for efficient deployment.

---

## 🐞 Troubleshooting

- **Busy Overlay Persists ("Downloading model, please wait...")**:
  - Check the browser console (F12, Console tab) for logs like `[Load]`, `[resetUI]`, or `[monitorPull]`.
  - Clear `localStorage`:
    ```javascript
    localStorage.removeItem("downloadingModel")
    ```
    Refresh the page.
  - Ensure the browser cache is cleared or use incognito mode to load the latest `index.html`.
  - Verify the `busy-overlay` has the `hidden` class in the Elements tab.

- **Download Failures (e.g., `unexpected EOF`, `stalled`)**:
  - Check container logs for errors:
    ```sh
    docker logs deepseek-container
    ```
  - Ensure a stable internet connection:
    ```sh
    ping registry.ollama.ai
    ```
  - Test pulling a model directly in the container:
    ```sh
    docker exec -it deepseek-container ollama pull deepseek-r1:1.5b
    ```
  - If issues persist, increase the timeout in `index.html` (`TIMEOUT_MS`) from 30000 to 60000.

- **Web Interface Not Loading**:
  - Verify the container is running:
    ```sh
    docker ps
    ```
  - Check if ports `8088` and `11434` are open:
    ```sh
    netstat -tuln | grep 8088
    ```
  - Access container logs for Apache or Ollama errors:
    ```sh
    docker logs deepseek-container
    ```

- **Model Not Found**:
  - Ensure the model was downloaded successfully via the web interface.
  - Check available models:
    ```sh
    curl http://<your-server-ip>:11434/api/tags
    ```

---

## 📜 Changelog

### Version 1.3 (April 2025)

- **On-Demand Model Downloading**: Removed automatic model pulling during container startup. Models are now downloaded only when selected via the web interface, reducing initial setup time and disk usage.
- **Persistent Model Storage**: Added a Docker volume (`ollama_models`) to persist downloaded models across container restarts.
- **Enhanced Web Interface**:
  - Added a dropdown to select from 17 DeepSeek models, with estimated sizes displayed.
  - Implemented a progress bar showing download percentage, total size, downloaded amount, and ETA.
  - Added a "Cancel Pull" button to stop downloads, with immediate UI reset.
  - Introduced a busy overlay to prevent interactions during downloads.
  - Enabled download persistence, resuming progress on page reload using `localStorage`.
  - Added toast notifications for success, error, and warning events.
  - Improved error handling with up to 3 retries for network issues (e.g., `unexpected EOF`, `stalled`).
  - Enhanced accessibility with ARIA attributes for progress bar and inputs.
- **Robust Debugging**:
  - Added console logs for `localStorage`, API responses, and UI state changes.
  - Implemented double checks to verify download status and model existence.
  - Added a 5-second fallback timeout to force-clear the busy overlay if stuck.
- **Network Stability**:
  - Handled transient network errors with retries and clear error messages.
  - Added timeout (30 seconds) to detect stalled downloads.
- **Updated Docker Image**: Bumped to `byron758/woohengine-deepseek:1.3`.

### Version 1.2 (Previous)

- Initial setup with automatic model pulling (`deepseek-r1:1.5b`) during container startup.
- Basic web interface with chatbox for AI interaction.
- Apache and Ollama integration for model serving and API access.

---

## 📜 License

This project is open-source under the MIT License.

## 💬 Support & Contributions

- **Found an issue?** Open an Issue on GitHub.
- **Want to contribute?** Fork the repo and submit a Pull Request.

🚀 Deploy DeepSeek AI in minutes with this Docker setup!  
⭐ **Star this repository if you find it useful!**