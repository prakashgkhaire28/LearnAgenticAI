import React, { useState } from "https://esm.sh/react@18.3.1";
import htm from "https://esm.sh/htm@3.1.1";
import { useTutor } from "../hooks/useTutor.js";

const html = htm.bind(React.createElement);

export function AITutor({ open, onClose, lessonContext, onReferences }) {
  const [input, setInput] = useState("");
  const tutor = useTutor(lessonContext);

  async function submit(text) {
    const query = (text ?? input).trim();
    if (!query) return;
    setInput("");
    const routed = await tutor.ask(query);
    onReferences?.(routed.references || []);
  }

  async function quickExplain() {
    await submit(`Explain this section: ${lessonContext.lessonTitle}`);
  }

  async function debugCode() {
    await submit(`Debug this code snippet with deterministic checks.`);
  }

  async function hint() {
    await submit("Give me a hint for the current quiz without revealing the answer.");
  }

  function onInputKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
  }

  return html`
    <aside className=${`fixed top-0 right-0 h-full w-full max-w-xl transform border-l border-slate-700 bg-[#111118] shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-slate-700 p-4">
          <h3 className="text-lg font-bold text-indigo-300">AI Tutor Agent</h3>
          <button className="rounded bg-slate-800 px-3 py-1 text-sm hover:bg-slate-700" onClick=${onClose}>Close</button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-700 p-3">
          <button className="rounded bg-[#6366f1] px-3 py-1 text-sm font-semibold hover:opacity-90" onClick=${quickExplain}>Explain this section</button>
          <button className="rounded bg-[#6366f1] px-3 py-1 text-sm font-semibold hover:opacity-90" onClick=${debugCode}>Debug my code</button>
          <button className="rounded bg-[#6366f1] px-3 py-1 text-sm font-semibold hover:opacity-90" onClick=${hint}>Give me a hint</button>
          <label className="ml-auto inline-flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked=${tutor.siddhantaMode} onChange=${(e) => tutor.setSiddhantaMode(e.target.checked)} />
            Siddhanta Mode
          </label>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          ${tutor.memory.messages.map(
            (m) => html`
              <div className=${`rounded-xl p-3 ${m.role === "user" ? "ml-8 bg-slate-800" : "mr-8 bg-slate-900 border border-slate-700"}`}>
                <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">${m.role}</div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">${m.text}</div>
                ${m.role === "assistant" && html`
                  <div className="mt-2 flex gap-2">
                    <button className="rounded bg-slate-700 px-2 py-1 text-xs" onClick=${() => copyText(m.text)}>Copy</button>
                    ${m.intent ? html`<span className="rounded bg-slate-800 px-2 py-1 text-xs text-indigo-300">${m.intent}</span>` : null}
                  </div>
                `}
              </div>
            `
          )}
          ${tutor.isStreaming && html`
            <div className="mr-8 rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">assistant</div>
              <div className="whitespace-pre-wrap text-sm">${tutor.draft || "..."}</div>
            </div>
          `}
        </div>

        <div className="border-t border-slate-700 p-3">
          <textarea
            className="h-24 w-full rounded border border-slate-600 bg-slate-900 p-2 text-sm outline-none focus:border-[#6366f1]"
            placeholder="Ask a context-aware question..."
            value=${input}
            onKeyDown=${onInputKey}
            onInput=${(e) => setInput(e.target.value)}
          />
          <div className="mt-2 flex justify-between gap-2">
            <button className="rounded bg-slate-700 px-3 py-2 text-sm" onClick=${() => tutor.clear()}>Clear</button>
            <div className="flex gap-2">
              <button className="rounded bg-slate-700 px-3 py-2 text-sm" onClick=${() => tutor.regenerate()}>Regenerate</button>
              <button className="rounded bg-[#6366f1] px-3 py-2 text-sm font-semibold" onClick=${() => submit()}>Send</button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  `;
}
