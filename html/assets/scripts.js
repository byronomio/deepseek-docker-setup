document.getElementById("user-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        fetchDeepSeekResponse();
    }
});

// Model size estimates (in bytes) for pre-pull display
const modelSizes = {
    "deepseek-r1:1.5b": 3e9,
    "deepseek-r1:7b": 14e9,
    "deepseek-r1:14b": 28e9,
    "deepseek-r1:32b": 64e9,
    "deepseek-r1:70b": 140e9,
    "deepseek-v3:37b": 74e9,
    "deepseek-coder-v2:lite": 2e9,
    "deepseek-coder-v2:16b": 32e9,
    "deepseek-coder-v2:236b": 472e9,
    "deepseek-coder:1b": 2e9,
    "deepseek-coder:6.7b": 13e9,
    "deepseek-coder:33b": 66e9,
    "deepseek-llm:7b": 14e9,
    "deepseek-llm:67b": 134e9,
    "deepseek-v2:236b": 472e9,
    "deepscaler:1.5b": 3e9,
    "deepseek-v2.5:236b": 472e9
};

// Utility to format bytes to GB/MB
function formatBytes(bytes) {
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + " GB";
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(2) + " MB";
    return bytes + " B";
}

// Show toast notification
function showToast(message, type = "success") {
    console.log(`[Toast] Showing ${type} message: ${message}`);
    const toast = document.createElement("div");
    toast.className = `toast ${type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-yellow-600"}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        console.log(`[Toast] Removing toast: ${message}`);
        toast.remove();
    }, 3000);
}

// Global state
let isPulling = false;
let abortController = null;
let downloadStartTime = null;
let recentSpeeds = [];
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000; // 30 seconds timeout for download check
const INITIAL_LOAD_TIMEOUT = 5000; // 5 seconds to force-clear overlay
const STATUS_LOG_INTERVAL = 15000; // 15 seconds for periodic status log

// Check if a download is in progress on page load
window.addEventListener("load", async () => {
    console.log("[Load] Page load started");
    try {
        const downloadingModel = localStorage.getItem("downloadingModel");
        console.log(`[Load] Checking localStorage: downloadingModel=${downloadingModel}`);

        // Restore last used model
        const lastModel = localStorage.getItem("lastUsedModel");
        console.log(`[Load] Last used model from localStorage: ${lastModel}`);
        const modelSelect = document.getElementById("model-select");
        if (lastModel && Array.from(modelSelect.options).some(option => option.value === lastModel)) {
            modelSelect.value = lastModel;
            console.log(`[Load] Set model-select to last used model: ${lastModel}`);
        } else {
            console.log(`[Load] No valid last used model, using default`);
        }

        // Ensure overlay is initially hidden
        const busyOverlay = document.getElementById("busy-overlay");
        console.log(`[Load] Initial busy-overlay class: ${busyOverlay.className}`);
        busyOverlay.classList.add("hidden");

        if (downloadingModel) {
            console.log(`[Load] Found downloadingModel=${downloadingModel}, verifying status`);
            const modelExists = await checkModelExists(downloadingModel);
            console.log(`[Load] Model ${downloadingModel} exists: ${modelExists}`);
            if (!modelExists) {
                // Double-check if download is still active
                const isDownloadActive = await checkDownloadActive(downloadingModel);
                console.log(`[Load] Download active for ${downloadingModel}: ${isDownloadActive}`);
                if (isDownloadActive) {
                    console.log(`[Load] Resuming download for ${downloadingModel}`);
                    monitorPull(downloadingModel, 0);
                } else {
                    console.log(`[Load] Download not active, clearing localStorage for ${downloadingModel}`);
                    localStorage.removeItem("downloadingModel");
                    resetUI();
                }
            } else {
                console.log(`[Load] Model ${downloadingModel} already downloaded, clearing localStorage`);
                localStorage.removeItem("downloadingModel");
                resetUI();
            }
        } else {
            console.log(`[Load] No downloadingModel in localStorage, resetting UI`);
            resetUI();
        }

        // Fallback: Force-clear overlay after timeout
        setTimeout(() => {
            console.log("[Load] Checking overlay state after timeout");
            if (!isPulling && !busyOverlay.classList.contains("hidden")) {
                console.warn("[Load] Busy overlay still visible, forcing reset");
                busyOverlay.classList.add("hidden");
                showToast("No download in progress, UI reset.", "warning");
            }
        }, INITIAL_LOAD_TIMEOUT);
    } catch (error) {
        console.error(`[Load] Error during load: ${error.message}`);
        resetUI();
        showToast(`Error initializing UI: ${error.message}`, "error");
    }
});

// Check if a download is active by attempting a short-lived /api/pull
async function checkDownloadActive(model) {
    console.log(`[checkDownloadActive] Checking if download is active for ${model}`);
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log("[checkDownloadActive] Timeout triggered, aborting check");
            controller.abort();
        }, 5000);
        const response = await fetch(`http://${window.location.hostname}:11434/api/pull`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: model }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        console.log(`[checkDownloadActive] /api/pull response status: ${response.status}`);
        return response.ok;
    } catch (error) {
        console.log(`[checkDownloadActive] Error checking download: ${error.message}`);
        return false;
    }
}

// Reset UI state
function resetUI() {
    console.log("[resetUI] Resetting UI state");
    isPulling = false;
    const pullButton = document.getElementById("pull-button");
    const modelSelect = document.getElementById("model-select");
    const pullButtonText = document.getElementById("pullButtonText");
    const pullSpinner = document.getElementById("pullSpinner");
    const cancelButton = document.getElementById("cancel-button");
    const pullProgress = document.getElementById("pull-progress");
    const busyOverlay = document.getElementById("busy-overlay");
    const pullStatus = document.getElementById("pull-status");
    const downloadDetails = document.getElementById("download-details");

    pullButton.disabled = false;
    modelSelect.disabled = false;
    pullButtonText.classList.remove("hidden");
    pullSpinner.classList.add("hidden");
    cancelButton.classList.add("hidden");
    pullProgress.classList.add("hidden");
    busyOverlay.classList.add("hidden");
    pullStatus.innerHTML = "";
    downloadDetails.innerHTML = "";

    console.log(`[resetUI] busy-overlay class after reset: ${busyOverlay.className}`);
}

async function checkModelExists(model) {
    console.log(`[checkModelExists] Checking if model ${model} exists`);
    try {
        const response = await fetch(`http://${window.location.hostname}:11434/api/tags`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        console.log(`[checkModelExists] /api/tags response status: ${response.status}`);
        if (!response.ok) throw new Error(`Failed to fetch model list: ${response.status}`);
        const data = await response.json();
        console.log(`[checkModelExists] Available models: ${JSON.stringify(data.models.map(m => m.name))}`);
        const exists = data.models.some(m => m.name === model);
        console.log(`[checkModelExists] Model ${model} exists: ${exists}`);
        return exists;
    } catch (error) {
        console.error(`[checkModelExists] Error: ${error.message}`);
        return false;
    }
}

// Basic syntax highlighting for PHP code
function highlightCode(code, language) {
    if (language === "php") {
        // PHP keywords
        const keywords = /\b(function|return|if|else|add_action|die)\b/g;
        // Variables
        const variables = /(\$[a-zA-Z_][a-zA-Z0-9_]*)/g;
        // Strings
        const strings = /('[^']*'|"[^"]*")/g;
        // Comments
        const comments = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g;

        code = code
            .replace(comments, '<span class="code-comment">$1</span>')
            .replace(keywords, '<span class="code-keyword">$1</span>')
            .replace(variables, '<span class="code-variable">$1</span>')
            .replace(strings, '<span class="code-string">$1</span>');
    }
    return code;
}

async function monitorPull(model, retryCount = 0) {
    console.log(`[monitorPull] Starting download for ${model}, retry count: ${retryCount}`);
    const pullStatus = document.getElementById("pull-status");
    const pullButton = document.getElementById("pull-button");
    const cancelButton = document.getElementById("cancel-button");
    const pullSpinner = document.getElementById("pullSpinner");
    const pullButtonText = document.getElementById("pullButtonText");
    const pullProgress = document.getElementById("pull-progress");
    const progressFill = document.getElementById("progress-fill");
    const downloadDetails = document.getElementById("download-details");
    const modelSelect = document.getElementById("model-select");
    const busyOverlay = document.getElementById("busy-overlay");

    // Set busy state
    isPulling = true;
    pullButton.disabled = true;
    modelSelect.disabled = true;
    pullButtonText.classList.add("hidden");
    pullSpinner.classList.remove("hidden");
    cancelButton.classList.remove("hidden");
    pullProgress.classList.remove("hidden");
    busyOverlay.classList.remove("hidden");
    localStorage.setItem("downloadingModel", model);
    localStorage.setItem("lastUsedModel", model); // Store last used model
    downloadStartTime = Date.now();
    recentSpeeds = [];

    // Periodic status logging
    const statusLogInterval = setInterval(() => {
        console.log(`[monitorPull] Still pulling ${model}...`);
    }, STATUS_LOG_INTERVAL);

    pullStatus.innerHTML = `<p class="text-green-400">Pulling ${model}...</p>`;
    progressFill.style.width = "0%";
    progressFill.setAttribute("aria-valuenow", 0);
    downloadDetails.innerHTML = `Total Size: ${formatBytes(modelSizes[model] || 0)} | Downloaded: 0 MB | Progress: 0%`;

    try {
        abortController = new AbortController();
        const response = await fetch(`http://${window.location.hostname}:11434/api/pull`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: model }),
            signal: abortController.signal
        });

        console.log(`[monitorPull] /api/pull response status: ${response.status}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `API request failed with status ${response.status}`;
            throw new Error(errorMessage);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let lastCompleted = 0;
        let lastUpdate = Date.now();

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log(`[monitorPull] Download stream completed for ${model}`);
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            let lines = buffer.split("\n");
            buffer = lines.pop();

            for (let line of lines) {
                try {
                    const json = JSON.parse(line.trim());
                    if (json.status) {
                        pullStatus.innerHTML = `<p class="text-green-400">Status: ${json.status}</p>`;
                    }
                    if (json.completed && json.total) {
                        const progress = (json.completed / json.total) * 100;
                        progressFill.style.width = `${progress}%`;
                        progressFill.setAttribute("aria-valuenow", Math.round(progress));

                        const now = Date.now();
                        const speed = (json.completed - lastCompleted) / ((now - downloadStartTime) / 1000);
                        recentSpeeds.push(speed);
                        if (recentSpeeds.length > 10) recentSpeeds.shift();
                        const avgSpeed = recentSpeeds.reduce((a, b) => a + b, 0) / recentSpeeds.length;
                        const remainingBytes = json.total - json.completed;
                        const etaSeconds = avgSpeed > 0 ? remainingBytes / avgSpeed : 0;

                        downloadDetails.innerHTML = `Total Size: ${formatBytes(json.total)} | Downloaded: ${formatBytes(json.completed)} | Progress: ${progress.toFixed(2)}% | ETA: ${Math.round(etaSeconds / 60)} min ${Math.round(etaSeconds % 60)} sec`;
                        lastCompleted = json.completed;
                        downloadStartTime = now;
                        lastUpdate = now;
                    }

                    // Timeout check
                    if (Date.now() - lastUpdate > TIMEOUT_MS) {
                        console.warn(`[monitorPull] No updates for ${TIMEOUT_MS}ms, assuming download stalled`);
                        throw new Error("Download stalled");
                    }
                } catch (error) {
                    console.warn(`[monitorPull] Skipping invalid JSON: ${line}, error: ${error.message}`);
                }
            }
        }

        // Verify model exists after download
        const modelExists = await checkModelExists(model);
        console.log(`[monitorPull] Post-download check: ${model} exists: ${modelExists}`);
        if (!modelExists) {
            throw new Error("Model download completed but not found in /api/tags");
        }

        pullStatus.innerHTML = `<p class="text-green-400">Model ${model} pulled successfully!</p>`;
        progressFill.style.width = "100%";
        progressFill.setAttribute("aria-valuenow", 100);
        showToast(`Model ${model} pulled successfully!`, "success");
    } catch (error) {
        console.error(`[monitorPull] Error: ${error.message}, retry count: ${retryCount}`);
        if (error.name === "AbortError") {
            pullStatus.innerHTML = `<p class="text-yellow-400">Download of ${model} cancelled.</p>`;
            showToast(`Download of ${model} cancelled.`, "warning");
        } else if (retryCount < MAX_RETRIES && (error.message.includes("unexpected EOF") || error.message.includes("stalled"))) {
            console.log(`[monitorPull] Retrying download for ${model}, attempt ${retryCount + 1}`);
            setTimeout(() => monitorPull(model, retryCount + 1), 2000);
            return;
        } else {
            pullStatus.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
            showToast(`Error pulling ${model}: ${error.message}`, "error");
        }
        pullProgress.classList.add("hidden");
    } finally {
        console.log(`[monitorPull] Cleaning up for ${model}`);
        clearInterval(statusLogInterval); // Clear periodic logging
        isPulling = false;
        pullButton.disabled = false;
        modelSelect.disabled = false;
        pullButtonText.classList.remove("hidden");
        pullSpinner.classList.add("hidden");
        cancelButton.classList.add("hidden");
        busyOverlay.classList.add("hidden");
        localStorage.removeItem("downloadingModel");
        abortController = null;
        setTimeout(() => pullProgress.classList.add("hidden"), 2000);
        console.log(`[monitorPull] busy-overlay class after cleanup: ${busyOverlay.className}`);
    }
}

async function pullModel() {
    console.log("[pullModel] Initiating pull request");
    if (isPulling) {
        console.log("[pullModel] Another model is downloading, showing toast");
        showToast("Another model is currently downloading. Please wait or cancel it.", "warning");
        return;
    }

    const model = document.getElementById("model-select").value;
    console.log(`[pullModel] Selected model: ${model}`);
    localStorage.setItem("lastUsedModel", model); // Store last used model
    const modelExists = await checkModelExists(model);
    console.log(`[pullModel] Model ${model} exists: ${modelExists}`);
    if (modelExists) {
        document.getElementById("pull-status").innerHTML = `<p class="text-green-400">Model ${model} is already available.</p>`;
        document.getElementById("pull-progress").classList.add("hidden");
        showToast(`Model ${model} is already available.`, "success");
        return;
    }

    monitorPull(model, 0);
}

function cancelPull() {
    console.log("[cancelPull] Cancelling download");
    if (abortController) {
        console.log("[cancelPull] Aborting fetch request");
        abortController.abort();
        abortController = null;
    } else {
        console.log("[cancelPull] No active download to cancel");
    }
    resetUI();
}

async function fetchDeepSeekResponse() {
    console.log("[fetchDeepSeekResponse] Initiating response generation");
    const userInput = document.getElementById("user-input").value;
    const model = document.getElementById("model-select").value;
    const responseDiv = document.getElementById("response");
    const buttonText = document.getElementById("buttonText");
    const spinner = document.getElementById("spinner");

    if (!userInput) {
        console.log("[fetchDeepSeekResponse] No user input provided");
        responseDiv.innerHTML = "<p style='color:red;'>Please enter a message.</p>";
        return;
    }

    if (isPulling) {
        console.log("[fetchDeepSeekResponse] Download in progress, showing toast");
        responseDiv.innerHTML = "<p style='color:red;'>A model is currently downloading. Please wait or cancel it.</p>";
        showToast("A model is downloading. Please wait or cancel it.", "warning");
        return;
    }

    localStorage.setItem("lastUsedModel", model); // Store last used model
    const modelExists = await checkModelExists(model);
    console.log(`[fetchDeepSeekResponse] Model ${model} exists: ${modelExists}`);
    if (!modelExists) {
        console.log("[fetchDeepSeekResponse] Model not found, showing toast");
        responseDiv.innerHTML = `<p style='color:red;'>Model ${model} not found. Please pull the model first.</p>`;
        showToast(`Model ${model} not found. Please pull it first.`, "error");
        return;
    }

    responseDiv.innerHTML = "<p>Loading response...</p>";
    buttonText.classList.add("hidden");
    spinner.classList.remove("hidden");

    try {
        const response = await fetch(`http://${window.location.hostname}:11434/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: model,
                prompt: userInput
            })
        });

        console.log(`[fetchDeepSeekResponse] /api/generate response status: ${response.status}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `API request failed with status ${response.status}`;
            throw new Error(errorMessage);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let resultText = "";
        let buffer = "";

        responseDiv.innerHTML = ``;

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log("[fetchDeepSeekResponse] Response stream completed");
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            let lines = buffer.split("\n");
            buffer = lines.pop();

            for (let line of lines) {
                try {
                    const json = JSON.parse(line.trim());
                    // console.log(`[fetchDeepSeekResponse] Received JSON: ${JSON.stringify(json)}`);
                    if (json.response) {
                        resultText += json.response;
                        const markdown = resultText;
                    
                        // Convert Markdown to HTML using `marked` if it's loaded
                        let html = markdown;
                        if (window.marked) {
                            html = marked.parse(markdown);
                        }
                    
                        // Set result with code highlighting support
                        responseDiv.innerHTML = `<div class=""><div class="code-block">${html}</div></div>`;
                    }
                    
                } catch (error) {
                    console.warn(`[fetchDeepSeekResponse] Skipping invalid JSON: ${line}, error: ${error.message}`);
                }
            }
        }
    } catch (error) {
        console.error(`[fetchDeepSeekResponse] Error: ${error.message}`);
        responseDiv.innerHTML = `<p style='color:red;'>Error: ${error.message}</p>`;
        // showToast(`Error generating response: ${error.message}`, "error");
    } finally {
        console.log("[fetchDeepSeekResponse] Cleaning up response UI");
        buttonText.classList.remove("hidden");
        spinner.classList.add("hidden");
    }
}