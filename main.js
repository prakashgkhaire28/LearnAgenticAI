import React, { createContext, useContext, useEffect, useMemo, useState } from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useParams,
} from "https://esm.sh/react-router-dom@6.30.1";
import ReactMarkdown from "https://esm.sh/react-markdown@9.0.1";
import remarkGfm from "https://esm.sh/remark-gfm@4.0.0";
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
import { BookOpen, CheckCircle2, Clock3, GraduationCap, BrainCircuit } from "https://esm.sh/lucide-react@0.460.0";

mermaid.initialize({ startOnLoad: false, theme: "dark" });

const COURSE = {
  title: "Mastering Agentic AI: From Foundations to Production",
  duration: "~40 hours",
  audience: "Software engineers, ML practitioners, and technical builders",
  modules: [
    {
      id: "0",
      title: "Orientation",
      estHours: 1,
      lessons: [
        {
          id: "0.1",
          title: "What Makes AI Agentic?",
          content: `### Agency in one loop
Agentic AI repeatedly performs **perception → reasoning → action → observation**.  
A chatbot only responds to one prompt. An agent decides *what to do next* based on goals and feedback.

#### Spectrum of autonomy
- **Chatbot:** answers directly, no tool use.
- **Assistant:** can call tools when asked.
- **Agent:** plans, executes, and revises toward a goal.
- **Multi-agent system:** specialized agents coordinate on complex tasks.

#### Real-world examples
- **Devin:** software task execution with iterative tool use.
- **AutoGPT:** autonomous goal-driven loops with memory + tools.
- **OpenAI Operator / Claude Code style systems:** computer-use agents that navigate interfaces and run workflows.

#### The Agentic Stack
1. **LLM core** for reasoning + language understanding.  
2. **Memory subsystem** for continuity.  
3. **Tool layer** for acting in external systems.  
4. **Orchestrator** for planning, safety, retries, and reflection.
`,
          code: `# Minimal agent loop pseudocode
while not goal_reached:
    perception = observe(environment)
    thought = llm.reason(goal, perception, memory)
    action = select_action(thought, tools)
    result = execute(action)
    memory.store(perception, action, result)
`,
          diagram: `graph LR
    A[Perceive state] --> B[Reason over goal and context]
    B --> C[Act via tool or message]
    C --> D[Observe result]
    D --> A
    B --> E[Update memory]
    E --> B`,
          quiz: {
            q: "Which characteristic best distinguishes an agent from a chatbot?",
            options: [
              "Agents only use larger models",
              "Agents iteratively plan and act toward goals using feedback",
              "Agents never call external tools",
              "Chatbots cannot be prompted with system messages",
            ],
            answer: 1,
          },
        },
        {
          id: "0.2",
          title: "Roadmap and Prerequisites",
          content: `### How to use this course
- **Fast Track (15h):** Build-first path. Complete all code labs and selected readings.
- **Full Track (40h):** Complete all lessons, quizzes, capstones, and architecture reviews.

### Prerequisites
- Python 3.11+
- Basic API usage (OpenAI/Anthropic)
- Familiarity with JSON, HTTP, and async programming

### Recommended setup
- VS Code + Dev Containers
- `.env` for API keys
- Test with:
  - `python --version`
  - `pip install anthropic pydantic rich`

### Learning outcome
By module 8, you will build and deploy a production-grade agent with tools, memory, and observability.
`,
          code: `# sanity_check.py
import os
required = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"]
for key in required:
    print(f"{key}:", "set" if os.getenv(key) else "missing")
`,
          quiz: {
            q: "What is the main difference between Fast Track and Full Track?",
            options: [
              "Fast Track skips Python setup",
              "Full Track includes deeper architecture and capstone practice",
              "Fast Track requires no coding",
              "There is no difference",
            ],
            answer: 1,
          },
        },
      ],
    },
    {
      id: "1",
      title: "LLM Foundations for Agents",
      estHours: 4,
      lessons: [
        {
          id: "1.1",
          title: "How LLMs Work (What Agents Run On)",
          content: `### Transformer intuition
Transformers process all tokens in parallel and learn relationships through attention. Agents depend on this to combine instructions, memory snippets, and tool outputs in one reasoning pass.

### Why tokens/context matter
- Every message, tool result, and instruction consumes budget.
- Long context improves continuity but increases cost and latency.

### Sampling controls
- **Temperature:** creativity vs determinism.
- **Top-p:** nucleus diversity.
- For agents: lower randomness for action selection, higher for brainstorming.

### Model tradeoffs
- Small models: fast and cheap for routing.
- Large models: better planning and error recovery.
- Production systems often use a model hierarchy.
`,
          code: `MODEL_ROUTER = {
    "classify": "gpt-4.1-mini",
    "plan": "claude-sonnet-4",
    "critical_execute": "claude-opus-4"
}

def choose_model(task_type: str) -> str:
    return MODEL_ROUTER.get(task_type, "claude-sonnet-4")
`,
          quiz: {
            q: "For reliable tool invocation, which setup is usually best?",
            options: [
              "High temperature and high top-p",
              "Low-to-moderate temperature with constrained output",
              "No system prompt",
              "Maximum context always",
            ],
            answer: 1,
          },
        },
        {
          id: "1.2",
          title: "Prompt Engineering for Agentic Systems",
          content: `### Agent constitution
System prompts define role boundaries, policies, and output format.

### ReAct pattern
ReAct alternates **Reason** and **Act** so an agent can inspect evidence and call tools step-by-step.

### Scratchpads and safety
Internal scratchpads improve planning, but final user output should be concise and policy-compliant.

### Few-shot reliability
Provide examples showing when to call tools vs answer directly.
`,
          code: `from anthropic import Anthropic
client = Anthropic()

SYSTEM = """You are a research agent. Use tools for factual queries.
Return final answer in markdown."""

messages = [{"role": "user", "content": "Find 3 latest papers on agent memory."}]

resp = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1000,
    system=SYSTEM,
    messages=messages,
)
print(resp.content)
`,
          quiz: {
            q: "Why is ReAct effective for agent systems?",
            options: [
              "It removes tool use",
              "It separates thinking and acting in iterative loops",
              "It guarantees perfect factuality",
              "It eliminates need for retries",
            ],
            answer: 1,
          },
        },
        {
          id: "1.3",
          title: "The Context Window as Working Memory",
          content: `### Budget management
Treat context like RAM. Keep hot facts in-window, archive old traces externally.

### Patterns
- Sliding windows for recent conversation
- Periodic summarization
- Retrieval on-demand (RAG)

### Cost control
Estimate tokens before calls; trigger summarization when threshold exceeded.
`,
          code: `class ContextManager:
    def __init__(self, max_tokens=8000, summarize_at=6000):
        self.max_tokens = max_tokens
        self.summarize_at = summarize_at
        self.messages = []

    def add(self, message, tokens):
        self.messages.append((message, tokens))
        if self.token_count() > self.summarize_at:
            self._summarize_old_messages()

    def token_count(self):
        return sum(t for _, t in self.messages)

    def _summarize_old_messages(self):
        head = self.messages[:-6]
        summary_tokens = 220
        self.messages = [({"role": "system", "content": f"Summary of {len(head)} messages"}, summary_tokens)] + self.messages[-6:]
`,
          quiz: {
            q: "What should happen first when context budget is exceeded?",
            options: [
              "Discard all history",
              "Summarize or retrieve selectively before truncating critical facts",
              "Increase temperature",
              "Disable tools",
            ],
            answer: 1,
          },
        },
        {
          id: "1.4",
          title: "Structured Outputs and Reliability",
          content: `### Deterministic machine-readable output
Use JSON schemas or Pydantic models to validate generated data before execution.

### Recovery strategy
If validation fails: retry with strict correction prompt; if still invalid, fallback to safe defaults or human review.
`,
          code: `from pydantic import BaseModel, ValidationError

class ActionPlan(BaseModel):
    goal: str
    steps: list[str]
    requires_confirmation: bool


def parse_plan(payload: dict) -> ActionPlan:
    try:
        return ActionPlan.model_validate(payload)
    except ValidationError as e:
        raise RuntimeError(f"Invalid agent output: {e}")
`,
          quiz: {
            q: "Why validate structured outputs before tool execution?",
            options: [
              "To increase randomness",
              "To prevent malformed actions and improve reliability",
              "To avoid system prompts",
              "To reduce model latency to zero",
            ],
            answer: 1,
          },
        },
      ],
    },
    {
      id: "2",
      title: "Tools and Function Calling",
      estHours: 5,
      lessons: [
        {
          id: "2.1",
          title: "Tool Use Fundamentals",
          content: `Tool calling is a **contract**: model proposes a tool call, runtime executes, model receives tool_result, then decides next step.

Good schemas are explicit:
- Verb-first names (`web_search`, `read_file`)
- Clear descriptions
- Strict parameter types
`,
          code: `tools = [{
  "name": "web_search",
  "description": "Search the web for current info",
  "input_schema": {
    "type": "object",
    "properties": {"query": {"type": "string"}},
    "required": ["query"]
  }
}]
`,
          quiz: {
            q: "Which is the correct tool cycle?",
            options: [
              "tool_result → request → tool_use",
              "user message → tool_use proposal → execution → tool_result → final response",
              "execution without schema",
              "final response only",
            ],
            answer: 1,
          },
        },
        {
          id: "2.2",
          title: "Building a Tool Library",
          content: `Build tools by category: read, write, execute, communicate. Use one interface with standard error contracts and typed inputs.

This lesson's reference implementation includes:
1. web_search(query)
2. read_file(path)
3. write_file(path, content)
4. run_python(code)
5. http_request(url, method, body)
6. memory_store/retrieve
7. send_email(to, subject, body)
8. query_database(sql)
`,
          code: `class ToolResult(dict):
    @staticmethod
    def ok(data):
        return {"ok": True, "data": data, "error": None}

    @staticmethod
    def fail(message):
        return {"ok": False, "data": None, "error": message}


def query_database(sql: str, conn):
    if any(w in sql.lower() for w in ["insert", "update", "delete", "drop"]):
        return ToolResult.fail("read-only policy violation")
    rows = conn.execute(sql).fetchall()
    return ToolResult.ok([dict(r) for r in rows])
`,
          quiz: {
            q: "Why enforce a read-only SQL policy in early agent deployments?",
            options: [
              "It increases model creativity",
              "It limits irreversible damage while learning agent behavior",
              "It makes queries faster by design",
              "It disables memory",
            ],
            answer: 1,
          },
        },
        {
          id: "2.3",
          title: "Tool Selection and Chaining",
          content: `Effective agents perform plan-then-execute: generate steps, choose tools for each step, and checkpoint between transitions.

Example chain:
1. Search evidence
2. Summarize findings
3. Generate report
4. Publish draft
`,
          code: `def execute_workflow(agent, topic):
    plan = [
        ("web_search", {"query": topic}),
        ("run_python", {"code": "summarize(results)"}),
        ("write_file", {"path": "report.md", "content": "..."}),
    ]
    for tool, args in plan:
        result = agent.call_tool(tool, args)
        if not result["ok"]:
            return {"status": "halted", "failed_tool": tool, "error": result["error"]}
    return {"status": "complete"}
`,
          quiz: {
            q: "What is the best behavior after a non-critical tool failure?",
            options: [
              "Crash silently",
              "Log error, retry safely, and continue or replan",
              "Ignore the result",
              "Delete memory",
            ],
            answer: 1,
          },
        },
        {
          id: "2.4",
          title: "Tool Safety and Sandboxing",
          content: `Apply least privilege: every tool should have explicit capabilities, validation, and audit logging.

Reversible actions (draft creation) can run automatically; irreversible actions (sending email, purchases) require confirmation.
`,
          code: `from datetime import datetime

class SafeTool:
    def __init__(self, func, permission="read"):
        self.func = func
        self.permission = permission
        self.audit = []

    def __call__(self, **kwargs):
        event = {"time": datetime.utcnow().isoformat(), "tool": self.func.__name__, "args": kwargs}
        self.audit.append(event)
        return self.func(**kwargs)
`,
          quiz: {
            q: "Which action should usually require explicit human confirmation?",
            options: [
              "Reading a local markdown file",
              "Sending an external email",
              "Counting tokens",
              "Generating a summary",
            ],
            answer: 1,
          },
        },
        {
          id: "2.5",
          title: "MCP (Model Context Protocol)",
          content: `MCP standardizes how models connect to external tools/resources.

### MCP concepts
- **Resources:** read-only context
- **Tools:** callable actions
- **Prompts:** reusable templates

Implementing MCP servers makes your ecosystem plug-and-play across model providers.
`,
          code: `# pip install mcp
from mcp.server.fastmcp import FastMCP
mcp = FastMCP("course-tools")

@mcp.tool()
def get_weather(city: str) -> str:
    return f"Weather stub for {city}"

@mcp.tool()
def list_tasks() -> list[str]:
    return ["design", "build", "test"]

if __name__ == "__main__":
    mcp.run()
`,
          quiz: {
            q: "Why is MCP strategically useful?",
            options: [
              "It removes the need for APIs",
              "It provides a standard interface for tools/resources across clients",
              "It only works with one model vendor",
              "It replaces memory",
            ],
            answer: 1,
          },
        },
      ],
    },
    {
      id: "3",
      title: "Memory and State Management",
      estHours: 4,
      lessons: [
        {
          id: "3.1",
          title: "The Four Types of Agent Memory",
          content: `Memory taxonomy:
- **In-context:** immediate working memory
- **External episodic/semantic:** persisted facts and events
- **Parametric:** model-internal priors
- **Procedural:** reusable successful patterns

Use in-context for recency, external memory for durability, and procedural snippets for consistent workflows.
`,
          code: `MEMORY_TYPES = {
    "working": "current context window",
    "episodic": "timeline of interactions",
    "semantic": "facts and docs",
    "procedural": "reusable tactics",
}
`,
          diagram: `flowchart TB
    A[User Goal] --> B[Working Memory]
    B --> C[External Episodic Store]
    B --> D[Semantic Vector Store]
    B --> E[Procedural Prompt Cache]
    C --> F[Retriever]
    D --> F
    E --> F
    F --> B`,
          quiz: {
            q: "Where should long-term durable user preferences usually live?",
            options: [
              "Only in current prompt",
              "External persistent memory store",
              "Inside temperature setting",
              "In tool description text",
            ],
            answer: 1,
          },
        },
        {
          id: "3.2",
          title: "Implementing Persistent Memory",
          content: `Persistent memory needs explicit CRUD operations and retrieval scoring.
Track entities (people, orgs, goals), and support forgetting for privacy and relevance.
`,
          code: `class MemoryManager:
    def __init__(self):
        self.store = {}

    def write(self, key, value):
        self.store[key] = value

    def read(self, key):
        return self.store.get(key)

    def search(self, term):
        return {k: v for k, v in self.store.items() if term.lower() in str(v).lower()}

    def forget(self, key):
        self.store.pop(key, None)
`,
          quiz: {
            q: "What capability is essential for compliance and user trust?",
            options: [
              "Infinite retention",
              "Explicit forget/delete operations",
              "No logging",
              "Unbounded context windows",
            ],
            answer: 1,
          },
        },
        {
          id: "3.3",
          title: "Vector Memory and Semantic Search",
          content: `Embeddings map text to vectors so semantically related passages cluster together.
Use chunking + hybrid retrieval (keyword + semantic) for robust recall.
`,
          code: `def hybrid_score(keyword_score: float, semantic_score: float, alpha=0.35):
    return alpha * keyword_score + (1 - alpha) * semantic_score

# integrate into ranker for RAG passage selection
`,
          quiz: {
            q: "Why use hybrid retrieval in RAG?",
            options: [
              "To avoid indexing",
              "To combine lexical precision with semantic recall",
              "To remove chunking",
              "To eliminate embeddings",
            ],
            answer: 1,
          },
        },
        {
          id: "3.4",
          title: "Memory Architectures in Practice",
          content: `Tiered memory pattern:
- **Hot:** active session context
- **Warm:** recent summaries and user profile
- **Cold:** archival documents/events

Promote/demote based on relevance score and recency decay.
`,
          code: `def tier_for(score, days_old):
    adjusted = score - 0.02 * days_old
    if adjusted > 0.8:
        return "hot"
    if adjusted > 0.45:
        return "warm"
    return "cold"
`,
          quiz: {
            q: "When should a memory item be promoted to hot tier?",
            options: [
              "Whenever it exists",
              "When relevance is high and currently needed for reasoning",
              "Only when very old",
              "Never",
            ],
            answer: 1,
          },
        },
      ],
    },
    {
      id: "4",
      title: "Planning and Multi-Agent Design",
      estHours: 6,
      lessons: [
        {
          id: "4.1",
          title: "Planning Algorithms for Agents",
          content: `Planning converts high-level goals into executable tasks with checkpoints.

Common patterns:
- Linear plans (simple workflows)
- Tree search plans (branch and evaluate)
- Reflective plans (critic agent revises plan)
`,
          code: `def make_plan(goal: str) -> list[str]:
    return [
        f"Clarify objective for: {goal}",
        "Gather evidence with tools",
        "Draft solution",
        "Run self-critique",
        "Deliver final output",
    ]
`,
          quiz: {
            q: "What is the practical advantage of explicit plans?",
            options: [
              "They remove need for tools",
              "They improve traceability and enable recovery at step boundaries",
              "They guarantee no hallucinations",
              "They replace prompts entirely",
            ],
            answer: 1,
          },
        },
        {
          id: "4.2",
          title: "Multi-Agent Collaboration Patterns",
          content: `Use specialized agents (researcher, coder, reviewer) coordinated by a supervisor.

Design rules:
- Single source of truth for shared state
- Clear ownership per task
- Arbitration policy for conflicts
`,
          code: `agents = {
  "researcher": "collect sources",
  "builder": "implement solution",
  "reviewer": "verify correctness",
}

def route(task_type: str):
    return {"research": "researcher", "implementation": "builder"}.get(task_type, "reviewer")
`,
          quiz: {
            q: "What is most important in multi-agent systems?",
            options: [
              "Every agent does everything",
              "Clear responsibilities and coordination protocol",
              "No shared state",
              "Maximum autonomy without oversight",
            ],
            answer: 1,
          },
        },
      ],
    },
    {
      id: "5",
      title: "Evaluation and Observability",
      estHours: 6,
      lessons: [
        {
          id: "5.1",
          title: "Agent Evaluation Frameworks",
          content: `Evaluate with task success, tool-call correctness, latency, and cost.

Use scenario-based eval sets with deterministic assertions where possible.
`,
          code: `def evaluate_run(success: bool, latency_ms: int, cost_usd: float):
    score = (1.0 if success else 0.0) - 0.0001 * latency_ms - 2.5 * cost_usd
    return round(score, 4)
`,
          quiz: {
            q: "Which metric mix is best for production agent quality?",
            options: [
              "Only BLEU score",
              "Success + reliability + latency + cost",
              "Only token count",
              "Only user sentiment",
            ],
            answer: 1,
          },
        },
        {
          id: "5.2",
          title: "Tracing and Logging",
          content: `Observability should capture:
- prompt version
- tool calls + arguments + outputs
- model + latency + token usage
- user-visible outcome
`,
          code: `def trace_event(event_type, payload, trace):
    trace.append({\"event\": event_type, \"payload\": payload})
    return trace
`,
          quiz: {
            q: "Why store prompt version IDs in traces?",
            options: [
              "For styling",
              "For reproducibility and regression debugging",
              "To increase temperature",
              "To avoid logs",
            ],
            answer: 1,
          },
        },
      ],
    },
    {
      id: "6",
      title: "Production Architecture and Deployment",
      estHours: 8,
      lessons: [
        {
          id: "6.1",
          title: "Service Architecture for Agents",
          content: `Production architecture usually separates API gateway, orchestration service, tool workers, and memory services.

Prefer async queues for long-running tasks and retries.
`,
          code: `ARCH = {
  "gateway": "auth + rate limiting",
  "orchestrator": "planning and control loop",
  "workers": "tool execution",
  "memory": "state and retrieval",
}
`,
          diagram: `flowchart LR
    U[User] --> G[API Gateway]
    G --> O[Agent Orchestrator]
    O --> W[Tool Workers]
    O --> M[Memory Service]
    W --> X[External APIs]
    O --> L[Logs/Traces]`,
          quiz: {
            q: "Why isolate tool workers from orchestration?",
            options: [
              "To reduce reliability",
              "To scale execution independently and contain failures",
              "To disable retries",
              "To avoid metrics",
            ],
            answer: 1,
          },
        },
        {
          id: "6.2",
          title: "Guardrails, SLAs, and Rollouts",
          content: `Define SLOs for latency and success rate, set budget caps, and use staged rollouts (shadow, canary, full).
`,
          code: `def allow_request(monthly_spend, projected_cost, cap=5000):
    return (monthly_spend + projected_cost) <= cap
`,
          quiz: {
            q: "What is the safest way to launch a new agent version?",
            options: [
              "Immediate 100% rollout",
              "Canary rollout with monitoring and fallback",
              "Disable logging first",
              "Skip evaluation",
            ],
            answer: 1,
          },
        },
      ],
    },
    {
      id: "7",
      title: "Capstone: End-to-End Agent System",
      estHours: 6,
      lessons: [
        {
          id: "7.1",
          title: "Build a Production Research Assistant",
          content: `Capstone goals:
1. Ingest documents
2. Retrieve evidence
3. Draft answer with citations
4. Validate with policy checks
5. Export report
`,
          code: `def capstone_pipeline(query, retriever, agent):
    docs = retriever.search(query)
    draft = agent.answer(query, docs)
    return {\"query\": query, \"docs\": len(docs), \"draft\": draft}
`,
          quiz: {
            q: "What makes this capstone 'production-grade'?",
            options: [
              "Long prompts only",
              "Integrated memory, tools, evaluation, and safety controls",
              "No retries",
              "No monitoring",
            ],
            answer: 1,
          },
        },
        {
          id: "7.2",
          title: "Final Review and Next Steps",
          content: `Graduation checklist:
- reproducible eval suite
- documented runbooks
- rollback and incident plan
- cost and latency dashboards

Next: domain fine-tuning, multi-agent simulations, and human-in-the-loop operations.
`,
          code: `CHECKLIST = [
  \"tests green\",
  \"eval pass threshold met\",
  \"on-call runbook published\",
  \"observability dashboard live\"
]
`,
          quiz: {
            q: "What is the best indicator you are ready for production?",
            options: [
              "A single successful demo",
              "Consistent eval performance with monitoring + rollback readiness",
              "Largest model selected",
              "No documentation needed",
            ],
            answer: 1,
          },
        },
      ],
    },
  ],
};

const ProgressContext = createContext(null);

function useProgress() {
  return useContext(ProgressContext);
}

function ProgressProvider({ children }) {
  const [completed, setCompleted] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("agentic-course-progress") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("agentic-course-progress", JSON.stringify(completed));
  }, [completed]);

  const value = useMemo(
    () => ({
      completed,
      markComplete: (lessonId) => setCompleted((old) => ({ ...old, [lessonId]: true })),
    }),
    [completed]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState("");

  useEffect(() => {
    if (!chart) return;
    const id = `m-${Math.random().toString(36).slice(2)}`;
    mermaid.render(id, chart).then((r) => setSvg(r.svg));
  }, [chart]);

  if (!chart) return null;
  return <div className="rounded-xl border border-slate-700 bg-slate-900 p-4" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Quiz({ lesson }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const { markComplete } = useProgress();

  const correct = selected === lesson.quiz.answer;

  return (
    <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h4 className="font-semibold text-cyan-300">Knowledge Check</h4>
      <p className="mt-2">{lesson.quiz.q}</p>
      <div className="mt-3 space-y-2">
        {lesson.quiz.options.map((opt, idx) => (
          <label key={opt} className="block cursor-pointer rounded border border-slate-700 p-2 hover:bg-slate-800">
            <input
              className="mr-2"
              type="radio"
              name={`quiz-${lesson.id}`}
              onChange={() => setSelected(idx)}
              checked={selected === idx}
            />
            {opt}
          </label>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        <button
          className="rounded bg-cyan-600 px-4 py-2 font-semibold hover:bg-cyan-500"
          onClick={() => setRevealed(true)}
        >
          Check Answer
        </button>
        {correct && revealed && (
          <button
            className="rounded bg-emerald-600 px-4 py-2 font-semibold hover:bg-emerald-500"
            onClick={() => markComplete(lesson.id)}
          >
            Mark Lesson Complete
          </button>
        )}
      </div>
      {revealed && (
        <p className={`mt-3 font-medium ${correct ? "text-emerald-300" : "text-rose-300"}`}>
          {correct ? "Correct. Great work." : `Not yet. Correct answer: ${lesson.quiz.options[lesson.quiz.answer]}`}
        </p>
      )}
    </div>
  );
}

function PythonSandbox() {
  const srcDoc = `
<html><body style="font-family: sans-serif; background:#0f172a; color:white; margin:0; padding:12px;">
<h4>Interactive Python (Pyodide)</h4>
<textarea id="code" style="width:100%;height:120px;background:#111827;color:#e5e7eb;">print('Hello Agentic AI')</textarea>
<button id="run">Run</button>
<pre id="out" style="background:#020617;padding:10px;"></pre>
<script type="module">
import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.mjs';
const pyodide = await loadPyodide();
document.getElementById('run').onclick = async () => {
  try {
    const code = document.getElementById('code').value;
    const result = await pyodide.runPythonAsync(code);
    document.getElementById('out').textContent = String(result ?? 'Done');
  } catch (e) {
    document.getElementById('out').textContent = e.toString();
  }
}
</script>
</body></html>`;
  return <iframe title="py-sandbox" srcDoc={srcDoc} className="mt-6 h-80 w-full rounded-xl border border-slate-700" />;
}

function LessonPage() {
  const { lessonId } = useParams();
  const lesson = COURSE.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);

  useEffect(() => {
    window.Prism?.highlightAll();
  }, [lessonId]);

  if (!lesson) return <div className="p-6">Lesson not found.</div>;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold">Lesson {lesson.id}: {lesson.title}</h1>
      <article className="prose prose-invert mt-6 max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content}</ReactMarkdown>
      </article>
      <MermaidDiagram chart={lesson.diagram} />
      <div className="mt-6">
        <h3 className="mb-2 text-xl font-semibold">Code Example</h3>
        <pre className="rounded-xl"><code className="language-python">{lesson.code}</code></pre>
      </div>
      <PythonSandbox />
      <Quiz lesson={lesson} />
    </div>
  );
}

function Home() {
  const { completed } = useProgress();
  const totalLessons = COURSE.modules.reduce((n, m) => n + m.lessons.length, 0);
  const done = Object.keys(completed).length;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <section className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <h1 className="text-4xl font-extrabold tracking-tight">{COURSE.title}</h1>
        <p className="mt-3 text-slate-300">{COURSE.duration} · Outcome-driven developer course from foundations to production workflows.</p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-200">
          <span className="inline-flex items-center gap-2 rounded bg-slate-700 px-3 py-1"><Clock3 size={16} /> {COURSE.duration}</span>
          <span className="inline-flex items-center gap-2 rounded bg-slate-700 px-3 py-1"><GraduationCap size={16} /> {COURSE.audience}</span>
          <span className="inline-flex items-center gap-2 rounded bg-slate-700 px-3 py-1"><CheckCircle2 size={16} /> {done}/{totalLessons} lessons completed</span>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {COURSE.modules.map((module) => (
          <div key={module.id} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="text-xl font-bold">Module {module.id}: {module.title}</h2>
            <p className="mt-1 text-sm text-slate-300">Estimated time: {module.estHours} hours</p>
            <ul className="mt-3 space-y-2 text-sm">
              {module.lessons.map((lesson) => (
                <li key={lesson.id}>
                  <Link className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200" to={`/lesson/${lesson.id}`}>
                    <BookOpen size={14} />
                    {lesson.id} {lesson.title}
                    {completed[lesson.id] ? <CheckCircle2 className="text-emerald-400" size={14} /> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}

function Shell() {
  return (
    <BrowserRouter>
      <ProgressProvider>
        <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
            <Link className="inline-flex items-center gap-2 text-lg font-semibold text-cyan-300" to="/">
              <BrainCircuit size={18} /> Agentic AI Course
            </Link>
            <div className="space-x-4 text-sm">
              <NavLink className="text-slate-200 hover:text-white" to="/">Home</NavLink>
              <a className="text-slate-200 hover:text-white" href="https://docs.anthropic.com" target="_blank" rel="noreferrer">Anthropic Docs</a>
            </div>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lesson/:lessonId" element={<LessonPage />} />
        </Routes>
      </ProgressProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(<Shell />);
