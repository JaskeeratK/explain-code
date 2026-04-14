mermaid.initialize({ startOnLoad: false, theme: "default" });

function showTab(name) {
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("tab-" + name).classList.add("active");
  event.target.classList.add("active");
}

async function analyze() {
  const code = document.getElementById("code").value.trim();
  const level = document.getElementById("level").value;
  const btn = document.getElementById("analyze-btn");
  const spinner = document.getElementById("spinner");
  const errorArea = document.getElementById("error-area");

  if (!code) {
    showError("Please paste some code first.");
    return;
  }

  btn.disabled = true;
  spinner.style.display = "inline-block";
  errorArea.innerHTML = "";
  document.getElementById("results").style.display = "none";

  try {
    const res = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, level }),
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();

    if (!data.ok) {
      showError("Claude returned unexpected output. Try again.<br><pre style='font-size:0.75rem;margin-top:0.5rem;overflow:auto'>" + escHtml(data.raw || "") + "</pre>");
      return;
    }

    renderResults(data.result);

  } catch (err) {
    showError("Request failed: " + err.message);
  } finally {
    btn.disabled = false;
    spinner.style.display = "none";
  }
}

function renderResults(r) {
  lastAnalysis = r;                                      // add this
  currentCode = document.getElementById("code").value;  // add this
  document.getElementById("chat-section").style.display = "block";
  // ELI5
  document.getElementById("eli5-text").textContent = r.eli5_explanation || "—";

  // Steps
  const stepsList = document.getElementById("steps-list");
  stepsList.innerHTML = "";
  (r.step_by_step || []).forEach(s => {
    const li = document.createElement("li");
    li.textContent = s;
    stepsList.appendChild(li);
  });

  // Edge cases
  const edgeList = document.getElementById("edge-list");
  edgeList.innerHTML = "";
  (r.edge_cases || []).forEach(e => {
    const li = document.createElement("li");
    li.textContent = e;
    edgeList.appendChild(li);
  });

  // Complexity — split "O(n) — reason" into value + desc
  function parseComplexity(str) {
    const parts = (str || "").split(/[—–-]/);
    return { val: parts[0].trim(), desc: parts.slice(1).join(" ").trim() };
  }

  const tc = parseComplexity(r.time_complexity);
  const sc = parseComplexity(r.space_complexity);
  document.getElementById("time-val").textContent  = tc.val;
  document.getElementById("time-desc").textContent  = tc.desc;
  document.getElementById("space-val").textContent  = sc.val;
  document.getElementById("space-desc").textContent = sc.desc;

  // Mermaid flowchart
  renderMermaid(r.flowchart || "graph TD\n  A[No flowchart returned]");

  document.getElementById("results").style.display = "block";
}

async function renderMermaid(chartText) {
  const container = document.getElementById("mermaid-container");
  container.innerHTML = "";

  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: {
      primaryColor: "#6366f1",
      primaryTextColor: "#ffffff",
      primaryBorderColor: "#4f46e5",
      lineColor: "#a5b4fc",
      secondaryColor: "#1e1b4b",
      tertiaryColor: "#312e81",
      background: "#0f0f10",
      mainBkg: "#1e1b4b",
      nodeBorder: "#6366f1",
      clusterBkg: "#1e1b4b",
      titleColor: "#e2e2e5",
      edgeLabelBackground: "#1a1a1e",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: "15px",
    },
  });

  try {
    const id = "mermaid-svg-" + Date.now();
    const { svg } = await mermaid.render(id, chartText);
    container.innerHTML = svg;
    container.querySelector("svg").style.maxWidth = "100%";
  } catch (err) {
    container.innerHTML = `
      <p style="color:#f87171;font-size:0.85rem">Could not render diagram: ${escHtml(err.message)}</p>
      <pre style="font-size:0.75rem;color:#9ca3af;margin-top:0.5rem;overflow:auto;white-space:pre-wrap">${escHtml(chartText)}</pre>`;
  }
}
function showError(msg) {
  document.getElementById("error-area").innerHTML =
    `<div class="error-box">${msg}</div>`;
}

function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function speakELI5() {
  const text = document.getElementById("eli5-text").textContent;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.9;
  utter.pitch = 1.1;
  window.speechSynthesis.speak(utter);
}
// Allow Ctrl+Enter to submit
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("code").addEventListener("keydown", e => {
    if (e.ctrlKey && e.key === "Enter") analyze();
  });
});
let lastAnalysis = null;
let currentCode = "";

async function askQuestion() {
  const question = document.getElementById("chat-input").value.trim();
  if (!question) return;

  const messages = document.getElementById("chat-messages");

  // User bubble
  messages.innerHTML += `<div style="align-self:flex-end;background:#1e1b4b;border-radius:8px;padding:0.5rem 0.75rem;font-size:0.85rem;max-width:80%">${escHtml(question)}</div>`;
  document.getElementById("chat-input").value = "";
  messages.scrollTop = messages.scrollHeight;

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: currentCode,
      question,
      context: JSON.stringify(lastAnalysis)
    })
  });

  const data = await res.json();

  // AI bubble
  messages.innerHTML += `<div style="align-self:flex-start;background:#1a1a2e;border:1px solid #2a2a40;border-radius:8px;padding:0.5rem 0.75rem;font-size:0.85rem;max-width:85%;color:#d1d5db">${escHtml(data.answer)}</div>`;
  messages.scrollTop = messages.scrollHeight;
}

function exportCard() {
  const r = lastAnalysis;
  const html = `
    <h2>CodeLens Analysis</h2>
    <h3>ELI5</h3><p>${r.eli5_explanation}</p>
    <h3>Complexity</h3><p>Time: ${r.time_complexity}</p><p>Space: ${r.space_complexity}</p>
    <h3>Edge Cases</h3><ul>${r.edge_cases.map(e=>`<li>${e}</li>`).join("")}</ul>
  `;
  const win = window.open("", "_blank");
  win.document.write(`<html><body style="font-family:sans-serif;padding:2rem;max-width:700px">${html}</body></html>`);
  win.print();
}