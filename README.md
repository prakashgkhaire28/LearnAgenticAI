# Mastering Agentic AI: From Foundations to Production

A no-build, CDN-powered React course platform with full lessons, interactive quizzes, Mermaid diagrams, Prism syntax highlighting, and embedded Pyodide practice sandboxes.

## Run locally

Because this project uses ES module imports from CDNs, serve files over HTTP:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## Features

- React + hooks, React Router v6
- Tailwind CSS (CDN)
- `react-markdown` + `remark-gfm`
- Mermaid diagrams per lesson
- Prism syntax highlighting
- Local progress persistence with `localStorage`
- Interactive knowledge checks and completion tracking
- In-browser Python execution sandbox via Pyodide in iframe

## Course coverage in this build

- Module 0: Orientation
- Module 1: LLM Foundations for Agents
- Module 2: Tools and Function Calling
- Module 3: Memory and State Management
- Module 4: Planning and Multi-Agent Design
- Module 5: Evaluation and Observability
- Module 6: Production Architecture and Deployment
- Module 7: Capstone: End-to-End Agent System

Each lesson includes:

- Written concept explanation
- Real Python code sample
- Diagram where applicable
- Knowledge check
