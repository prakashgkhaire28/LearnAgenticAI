import React from "https://esm.sh/react@18.3.1";
import htm from "https://esm.sh/htm@3.1.1";
import { BrowserRouter, Routes, Route, Link } from "https://esm.sh/react-router-dom@6.30.1";
import LessonViewer from "./LessonViewer.jsx";

const html = htm.bind(React.createElement);

const COURSE = {
  title: "Mastering Agentic AI: From Foundations to Production",
  modules: [
    {
      id: "0",
      title: "Orientation",
      lessons: [
        {
          id: "0.1",
          title: "What Makes AI Agentic?",
          content: "Agentic systems operate in a perception → reasoning → action → observation loop. They use memory and tools, not only direct text response.",
          code: "while not done:\n    obs = perceive()\n    action = plan(obs)\n    result = act(action)",
          quiz: { q: "What differentiates an agent from a simple chatbot?" },
        },
      ],
    },
    {
      id: "1",
      title: "LLM Foundations",
      lessons: [
        {
          id: "1.2",
          title: "Prompt Engineering for Agentic Systems",
          content: "Use system prompts as constitutions. ReAct prompting helps chain reasoning and actions with tool feedback loops.",
          code: "SYSTEM = 'You are a reliable agent. Use tools only when needed.'\nmessages=[{'role':'user','content':'Find latest MCP spec notes'}]",
          quiz: { q: "Why is ReAct useful in agents?" },
        },
      ],
    },
    {
      id: "2",
      title: "Tools and Function Calling",
      lessons: [
        {
          id: "2.4",
          title: "Tool Safety and Sandboxing",
          content: "Apply least privilege and confirmation gates for irreversible actions.",
          code: "class SafeTool:\n    def __call__(self, **kwargs):\n        validate(kwargs)\n        return run(kwargs)",
          quiz: { q: "Which tool action should require confirmation?" },
        },
      ],
    },
  ],
};

function Home() {
  return html`
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-4xl font-bold">${COURSE.title}</h1>
      <p className="mt-2 text-slate-300">Deterministic-first AI tutor experience with in-lesson context awareness.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        ${COURSE.modules.map(
          (m) => html`
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4" key=${m.id}>
              <h2 className="text-lg font-semibold">Module ${m.id}: ${m.title}</h2>
              <ul className="mt-2 space-y-1">
                ${m.lessons.map(
                  (l) => html`<li key=${l.id}><${Link} className="text-indigo-300" to=${`/lesson/${l.id}`}>${l.id} ${l.title}<//></li>`
                )}
              </ul>
            </div>
          `
        )}
      </div>
    </div>
  `;
}

export default function App() {
  return html`
    <${BrowserRouter}>
      <header className="border-b border-slate-700 bg-[#111118]">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <${Link} className="font-semibold text-indigo-300" to="/">Mastering Agentic AI<//>
        </div>
      </header>
      <${Routes}>
        <${Route} path="/" element=${html`<${Home} />`} />
        <${Route} path="/lesson/:lessonId" element=${html`<${LessonViewer} course=${COURSE} />`} />
      <//>
    <//>
  `;
}
