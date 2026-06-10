const proxyUrlInput = document.getElementById("proxyUrl");
const saveProxyBtn = document.getElementById("saveProxy");
const addressBar = document.getElementById("addressBar");
const goBtn = document.getElementById("btnGo");
const backBtn = document.getElementById("btnBack");
const forwardBtn = document.getElementById("btnForward");
const reloadBtn = document.getElementById("btnReload");
const frame = document.getElementById("viewFrame");
const statusText = document.getElementById("statusText");

let historyStack = [];
let historyIndex = -1;
let proxyBase = localStorage.getItem("proxyBase") || proxyUrlInput.value;

proxyUrlInput.value = proxyBase;

function setStatus(text) {
  statusText.textContent = text;
}

saveProxyBtn.addEventListener("click", () => {
  proxyBase = proxyUrlInput.value.trim();
  localStorage.setItem("proxyBase", proxyBase);
  setStatus("Proxy set to " + proxyBase);
});

function navigate(url, pushHistory = true) {
  if (!proxyBase) {
    setStatus("Set a proxy server first.");
    return;
  }

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  const encoded = encodeURIComponent(url);
  const proxiedUrl = `${proxyBase.replace(/\/+$/, "")}/proxy?url=${encoded}`;

  setStatus("Loading " + url + " …");

  // Load via proxy into iframe
  frame.src = proxiedUrl;

  if (pushHistory) {
    // Trim forward history
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(url);
    historyIndex = historyStack.length - 1;
  }

  addressBar.value = url;
}

goBtn.addEventListener("click", () => {
  const url = addressBar.value.trim();
  if (url) navigate(url, true);
});

addressBar.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const url = addressBar.value.trim();
    if (url) navigate(url, true);
  }
});

backBtn.addEventListener("click", () => {
  if (historyIndex > 0) {
    historyIndex--;
    const url = historyStack[historyIndex];
    navigate(url, false);
  }
});

forwardBtn.addEventListener("click", () => {
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    const url = historyStack[historyIndex];
    navigate(url, false);
  }
});

reloadBtn.addEventListener("click", () => {
  if (historyIndex >= 0) {
    const url = historyStack[historyIndex];
    navigate(url, false);
  }
});

// Optional: update status when iframe finishes loading
frame.addEventListener("load", () => {
  setStatus("Loaded");
});
