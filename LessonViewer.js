import React, { useMemo, useState } from "https://esm.sh/react@18.3.1";
import { useParams, Link } from "https://esm.sh/react-router-dom@6.30.1";
import htm from "https://esm.sh/htm@3.1.1";
import ReactMarkdown from "https://esm.sh/react-markdown@9.0.1";
import remarkGfm from "https://esm.sh/remark-gfm@4.0.0";
import { AITutor } from "./components/AITutor.js";

const html = htm.bind(React.createElement);

export default function LessonViewer({ course }) {
  const { lessonId } = useParams();
  const [tutorOpen, setTutorOpen] = useState(false);
  const [refs, setRefs] = useState([]);

  const lesson = useMemo(
    () => course.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId),
    [course, lessonId]
  );

  if (!lesson) {
    return html`<div className="p-8">Lesson not found. <${Link} to="/">Back home<//></div>`;
  }

  const lessonContext = {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    moduleTitle: lesson.moduleTitle,
    content: lesson.content,
    codeSnippet: lesson.code,
    quizQuestion: lesson.quiz?.q,
    lesson,
  };

  return html`
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">${lesson.id} ${lesson.title}</h1>
        <button className="rounded bg-[#6366f1] px-4 py-2 font-semibold" onClick=${() => setTutorOpen(true)}>Ask Tutor</button>
      </div>

      <section className=${`rounded-xl border p-4 ${refs.includes("content") ? "border-indigo-400 bg-slate-900" : "border-slate-700 bg-slate-950"}`}>
        <h2 className="mb-2 text-lg font-semibold text-indigo-300">Concept</h2>
        <div className="prose prose-invert max-w-none">
          <${ReactMarkdown} remarkPlugins=${[remarkGfm]}>${lesson.content}<//>
        </div>
      </section>

      <section className=${`mt-5 rounded-xl border p-4 ${refs.includes("code") ? "border-indigo-400 bg-slate-900" : "border-slate-700 bg-slate-950"}`}>
        <h2 className="mb-2 text-lg font-semibold text-indigo-300">Code</h2>
        <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm"><code>${lesson.code}</code></pre>
      </section>

      <section className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4">
        <h2 className="mb-2 text-lg font-semibold text-indigo-300">Knowledge Check</h2>
        <p>${lesson.quiz?.q}</p>
      </section>

      <${AITutor}
        open=${tutorOpen}
        onClose=${() => setTutorOpen(false)}
        lessonContext=${lessonContext}
        onReferences=${setRefs}
      />
    </div>
  `;
}
