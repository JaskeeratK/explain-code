<div align="center">

<img src="https://img.shields.io/badge/🖍️-Crayonify-orange?style=for-the-badge&labelColor=fef9c3&color=d97706" alt="Crayonify"/>

# 🖍️ crayonify

### *explain code like you're 5*

**Paste any code. Get a plain-English explanation, hand-drawn flowchart, edge cases & complexity instantly.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-explain--code.onrender.com-d97706?style=for-the-badge&labelColor=fef9c3)](https://explain-code.onrender.com/)
![Python](https://img.shields.io/badge/Python-3.11-3b82f6?style=for-the-badge&labelColor=bfdbfe)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-16a34a?style=for-the-badge&labelColor=bbf7d0)
![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-7c3aed?style=for-the-badge&labelColor=e9d5ff)

---

</div>

## 🤔 what is this?

Most code tools are built for people who already understand code.

**Crayonify is built for everyone else.**

Paste any function, algorithm, or snippet and Crayonify breaks it down the way a patient teacher would: simple words, a hand-drawn flowchart, real-world edge cases, and complexity explained without jargon.
Powered by **Groq's LLaMA 3.3 70B** (the fastest LLM inference available) + a custom crayon-aesthetic UI that makes learning feel approachable instead of intimidating.

---

## ✨ features

| Feature | What it does |
|---|---|
| 🧒 **ELI5 Explanation** | Explains your code like you're 5 years old |
| 📋 **Step-by-step** | Walks through the logic line by line |
| 🖍️ **Hand-drawn Flowchart** | Renders a crayon-style flowchart using Rough.js — no corporate boxes |
| ⚠️ **Edge Cases** | Flags inputs that could break the code |
| ⏱️ **Complexity Analysis** | Time & space complexity with a plain-English reason |
| 💬 **Chat with your code** | Ask follow-up questions — "why is this slow?" "how do I fix this?" |
| 🔊 **Read aloud** | Speaks the ELI5 explanation out loud via Web Speech API |
| 🎓 **Experience levels** | Beginner / Intermediate / Advanced mode |

---

## 🖼️ demo

> **Try it live → [explain-code.onrender.com](https://explain-code.onrender.com/)**

Paste this to see it in action:

```python
def fibonacci(n):
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    return fibonacci(n - 1) + fibonacci(n - 2)
```

---

## 🏗️ architecture

```
┌─────────────────────┐        POST /analyze        ┌──────────────────────┐
│                     │ ─────────────────────────►  │                      │
│   Frontend          │                             │   FastAPI Backend    │
│   HTML + Rough.js   │ ◄─────────────────────────  │   main.py            │
│                     │     JSON (structured)        │                      │
└─────────────────────┘                             └──────────┬───────────┘
                                                               │
                                                               │ Groq API
                                                               ▼
                                                   ┌──────────────────────┐
                                                   │  LLaMA 3.3 70B       │
                                                   │  (via Groq)          │
                                                   └──────────────────────┘
```

- **Frontend** — vanilla HTML/CSS/JS, zero frameworks. Rough.js for hand-drawn diagrams.
- **Backend** — FastAPI serves both the API and static frontend from a single server.
- **LLM** — Groq's LLaMA 3.3 70B. Chosen for speed, responses in ~1s vs 5-8s on other providers.
- **Flowchart** — custom canvas renderer, not Mermaid. Every line is drawn with controlled roughness to look hand-drawn.

---

## 🚀 run it locally

### prerequisites
- Python 3.10+
- A free [Groq API key](https://console.groq.com)

### setup

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/crayonify.git
cd crayonify

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set your API key
export GROQ_API_KEY=gsk_...

# 4. Run
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open **http://localhost:8000** — that's it. No separate frontend server needed.

### using a `.env` file

```bash
# create .env in project root
echo "GROQ_API_KEY=gsk_your_key_here" > .env
```

---

## 📁 project structure

```
crayonify/
├── main.py              # FastAPI backend — /analyze and /chat endpoints
├── requirements.txt     # Python dependencies
├── .env                 # API keys (never commit this)
├── .gitignore
└── frontend/
    ├── index.html       # UI — paper texture, crayon theme
    ├── scripts.js       # Rough.js flowchart renderer + all frontend logic
    └── paper.png        # Background texture
```

---

## 🔌 api reference

### `POST /analyze`

Analyzes a code snippet and returns structured explanation data.

**Request**
```json
{
  "code": "def sum(n): ...",
  "level": "beginner"
}
```

**Response**
```json
{
  "ok": true,
  "result": {
    "eli5_explanation": "This is like counting cookies...",
    "step_by_step": ["Start with zero", "Add each number", "..."],
    "flowchart": [
      { "id": "1", "label": "Start", "type": "start" },
      { "id": "2", "label": "Set sum to 0", "type": "step" },
      { "id": "3", "label": "More numbers?", "type": "decision", "yes": "4", "no": "5" },
      { "id": "4", "label": "Add next number", "type": "step" },
      { "id": "5", "label": "Return sum", "type": "end" }
    ],
    "edge_cases": ["n is 0", "n is negative", "very large n"],
    "time_complexity": "O(n) — loops once per number",
    "space_complexity": "O(1) — only stores one sum variable"
  }
}
```

### `POST /chat`

Ask a follow-up question about the analyzed code.

**Request**
```json
{
  "code": "...",
  "question": "How do I make this faster?",
  "context": "{...previous analysis...}"
}
```

---

## 🗺️ future enhancements

### 🔜 high priority
- [ ] **GitHub URL input** — paste a GitHub file URL and analyze it directly, no copy-paste needed
- [ ] **Before / After optimizer** — show original code side-by-side with an AI-suggested optimized version
- [ ] **Language auto-detection badge** — automatically detect and display the programming language
- [ ] **Complexity visualizer** — animated chart showing how runtime grows with input size

### 🧪 experimental ideas
- [ ] **Difficulty rating** — score the code 1–10 for a given experience level, gamify learning
- [ ] **Quiz mode** — after explanation, ask the user 3 questions to test understanding
- [ ] **Multi-file support** — upload a whole file or paste multiple functions
- [ ] **Shareable link** — generate a URL to share your Crayonified code with someone else
- [ ] **VS Code extension** — right-click any function → "Crayonify this"
- [ ] **Mobile app** — camera scan handwritten code, get instant explanation

### 🌍 reach
- [ ] **Multi-language UI** — explain code in Hindi, Spanish, French etc.
- [ ] **Teacher mode** — generate a full lesson plan around a code snippet
- [ ] **Embeddable widget** — let coding bootcamps embed Crayonify in their course platforms

---

## 🛠️ tech stack

| Layer | Technology | Why |
|---|---|---|
| Backend | FastAPI | Fast, async, minimal boilerplate |
| LLM | Groq + LLaMA 3.3 70B | Fastest inference, free tier available |
| Frontend | Vanilla HTML/CSS/JS | Zero build step, works everywhere |
| Diagrams | Rough.js | Hand-drawn aesthetic, no Mermaid corporate look |
| Font | Nunito (Google Fonts) | Friendly, rounded, matches the vibe |
| Deploy | Render | Free tier, one-click deploy |

---

## 🤝 contributing

PRs welcome. If you have an idea for a feature, open an issue first so we can discuss it.

```bash
# fork → clone → create branch
git checkout -b feature/your-feature-name

# make changes, then
git commit -m "add: your feature description"
git push origin feature/your-feature-name
# open a PR
```
---

<div align="center">

**[explain-code.onrender.com](https://explain-code.onrender.com/)**

*if this helped you, leave a ⭐*

</div>
