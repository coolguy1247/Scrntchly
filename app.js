const addressBar = document.getElementById("addressBar");
const goBtn = document.getElementById("btnGo");
const backBtn = document.getElementById("btnBack");
const forwardBtn = document.getElementById("btnForward");
const reloadBtn = document.getElementById("btnReload");
const frame = document.getElementById("viewFrame");
const statusText = document.getElementById("statusText");
const backendUrlEl = document.getElementById("backendUrl");

const backendBase = ""; // same origin as the HTML (served by Node)
backendUrlEl.textContent = window.location.origin;

let historyStack = [];
let historyIndex = -1;

function setStatus(text) {
  statusText.textContent = text;
}

function normalizeUrl(url) {
  url = url.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  return url;
}

function navigate(url, pushHistory = true) {
  if (!url) return;

  const normalized = normalizeUrl(url);
  const encoded = encodeURIComponent(normalized);
  const proxiedUrl = `${backendBase}/proxy?url=${encoded}`;

  setStatus("Loading " + normalized + " …");
  frame.src = proxiedUrl;

  if (pushHistory) {
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(normalized);
    historyIndex = historyStack.length - 1;
  }

  addressBar.value = normalized;
}

goBtn.addEventListener("click", () => {
  const url = addressBar.value;
  if (url) navigate(url, true);
});

addressBar.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const url = addressBar.value;
    if (url) navigate(url, true);
  }
});

backBtn.addEventListener("click", () => {
  if (historyIndex > 0) {
    historyIndex--;
    navigate(historyStack[historyIndex], false);
  }
});

forwardBtn.addEventListener("click", () => {
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    navigate(historyStack[historyIndex], false);
  }
});

reloadBtn.addEventListener("click", () => {
  if (historyIndex >= 0) {
    navigate(historyStack[historyIndex], false);
  }
});

frame.addEventListener("load", () => {
  setStatus("Loaded");
});
