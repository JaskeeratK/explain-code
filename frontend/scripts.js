mermaid.initialize({ startOnLoad: false, theme: "base" });

function showTab(name, e) {
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("tab-" + name).classList.add("active");
  if (e && e.target) e.target.classList.add("active");
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
      showError("Hmm, something went wrong. Try again!<br><pre style='font-size:0.75rem;margin-top:0.5rem;overflow:auto'>" + escHtml(data.raw || "") + "</pre>");
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
  lastAnalysis = r;
  currentCode = document.getElementById("code").value;
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

  // Complexity
  function parseComplexity(str) {
    const parts = (str || "").split(/[—–-]/);
    return { val: parts[0].trim(), desc: parts.slice(1).join(" ").trim() };
  }

  const tc = parseComplexity(r.time_complexity);
  const sc = parseComplexity(r.space_complexity);
  document.getElementById("time-val").textContent  = tc.val;
  document.getElementById("time-desc").textContent = tc.desc;
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
      primaryColor: "#fef9c3",
      primaryTextColor: "#92400e",
      primaryBorderColor: "#d97706",
      lineColor: "#92400e",
      secondaryColor: "#bfdbfe",
      tertiaryColor: "#bbf7d0",
      background: "#fffdf5",
      mainBkg: "#fef9c3",
      nodeBorder: "#d97706",
      clusterBkg: "#fffdf5",
      titleColor: "#1c1917",
      edgeLabelBackground: "#fffdf5",
      fontFamily: "'Nunito', sans-serif",
      fontSize: "15px",
    },
  });

  try {
    const id = "mermaid-svg-" + Date.now();
    const { svg } = await mermaid.render(id, chartText);
    container.innerHTML = svg;

    const svgEl = container.querySelector("svg");
    svgEl.style.maxWidth = "100%";
    svgEl.style.filter = "url(#crayon)";

    // Crayon colors cycling through nodes
    const crayonFills   = ["#fef9c3", "#bfdbfe", "#bbf7d0", "#fecaca", "#e9d5ff", "#fed7aa"];
    const crayonStrokes = ["#d97706", "#3b82f6", "#16a34a", "#dc2626", "#7c3aed", "#ea580c"];

    svgEl.querySelectorAll(".node rect, .node circle, .node polygon, .node ellipse").forEach((el, i) => {
      el.style.fill        = crayonFills[i % crayonFills.length];
      el.style.stroke      = crayonStrokes[i % crayonStrokes.length];
      el.style.strokeWidth = "2.5px";
      el.setAttribute("rx", "10");
      el.setAttribute("ry", "12");
    });

    // Rough hand-drawn edges
    svgEl.querySelectorAll("path.flowchart-link, .edgePath path, line, polyline").forEach(el => {
      el.style.strokeLinecap  = "round";
      el.style.strokeLinejoin = "round";
      el.style.strokeWidth    = "2.5px";
      el.style.stroke         = "#92400e";
    });

    // Crayon text
    svgEl.querySelectorAll(".nodeLabel, .label, text").forEach(el => {
      el.style.fontFamily = "'Nunito', sans-serif";
      el.style.fontWeight = "700";
      el.style.filter     = "url(#crayon-text)";
    });

  } catch (err) {
    container.innerHTML = `
      <p style="color:#9a3412;font-size:0.85rem;font-weight:700">Could not render diagram: ${escHtml(err.message)}</p>
      <pre style="font-size:0.75rem;color:#78716c;margin-top:0.5rem;overflow:auto;white-space:pre-wrap">${escHtml(chartText)}</pre>`;
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

// Ctrl+Enter to submit
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
  const userDiv = document.createElement("div");
  userDiv.className = "msg-user";
  userDiv.textContent = question;
  messages.appendChild(userDiv);

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
  const aiDiv = document.createElement("div");
  aiDiv.className = "msg-ai";
  aiDiv.textContent = data.answer;
  messages.appendChild(aiDiv);

  messages.scrollTop = messages.scrollHeight;
}

function exportCard() {
  const r = lastAnalysis;
  if (!r) return;
  const html = `
    <h2>Crayonify Analysis</h2>
    <h3>ELI5</h3><p>${r.eli5_explanation}</p>
    <h3>Complexity</h3><p>Time: ${r.time_complexity}</p><p>Space: ${r.space_complexity}</p>
    <h3>Edge Cases</h3><ul>${r.edge_cases.map(e=>`<li>${e}</li>`).join("")}</ul>
  `;
  const win = window.open("", "_blank");
  win.document.write(`<html><body style="font-family:'Nunito',sans-serif;padding:2rem;max-width:700px;background:#f5f0e8">${html}</body></html>`);
  win.print();
}