import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class CodeInput(BaseModel):
    code: str
    level: str = "beginner"

PROMPT_TEMPLATE = """You are a code tutor helping a {level} programmer understand code.

Given this code:
{code}

Return ONLY a valid JSON object with NO markdown, NO backticks, NO explanation outside the JSON.

The JSON must have exactly these keys:
{{
  "eli5_explanation": "simple 2-3 sentence explanation like the user is 5 years old",
  "step_by_step": ["step 1 description", "step 2 description", "..."],
  "flowchart": "graph TD\\n  A[Start] --> B[Step]\\n  B --> C[End]",
  "edge_cases": ["edge case 1", "edge case 2", "..."],
  "time_complexity": "O(n) — brief reason",
  "space_complexity": "O(1) — brief reason"
}}

STRICT Mermaid rules for the flowchart value:
- Start with 'graph TD'
- Use \\n for newlines
- NEVER use parentheses () inside node labels — they break the parser
- NEVER use special chars: (), +, -, *, /, % inside [ ] or {{ }}
- For math like fibonacci(n-1), write it as: fib of n minus 1
- Use --> for arrows, -->|label| for labeled arrows
- Max 6-8 nodes, keep labels short and simple
- Decisions use curly braces: B{{Is n zero?}}
"""

@app.post("/analyze")
def analyze_code(input: CodeInput):
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a code tutor. Always respond with valid JSON only. No markdown, no backticks, no explanation outside the JSON object."
            },
            {
                "role": "user",
                "content": PROMPT_TEMPLATE.format(code=input.code, level=input.level)
            }
        ],
        temperature=0.3,
        max_tokens=1500,
    )

    raw = response.choices[0].message.content.strip()

    # Strip markdown fences if model wraps anyway
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        parsed = json.loads(raw)
        return {"ok": True, "result": parsed}
    except json.JSONDecodeError:
        return {"ok": False, "raw": raw, "error": "Failed to parse JSON"}
class ChatInput(BaseModel):
    code: str
    question: str
    context: str  # pass the previous analysis as context

@app.post("/chat")
def chat_about_code(input: ChatInput):
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a code tutor. Answer questions about the provided code concisely and clearly. No markdown."
            },
            {
                "role": "user",
                "content": f"Code:\n{input.code}\n\nPrevious analysis:\n{input.context}\n\nQuestion: {input.question}"
            }
        ],
        temperature=0.4,
        max_tokens=500,
    )
    return {"answer": response.choices[0].message.content.strip()}

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")