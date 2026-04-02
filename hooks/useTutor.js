import { useMemo, useState } from "https://esm.sh/react@18.3.1";
import { routeTutorAgent } from "../utils/agentRouter.js";

const STORAGE_KEY = "ai-tutor-memory-v1";

function loadMemory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      messages: [],
      lastTopic: null,
      difficultyLevel: "adaptive",
    };
  } catch {
    return { messages: [], lastTopic: null, difficultyLevel: "adaptive" };
  }
}

function persist(memory) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
}

async function streamText(text, onChunk) {
  const words = text.split(" ");
  let built = "";
  for (const w of words) {
    built += `${w} `;
    onChunk(built.trimEnd());
    await new Promise((r) => setTimeout(r, 12));
  }
}

export function useTutor(lessonContext) {
  const [memory, setMemory] = useState(loadMemory);
  const [isStreaming, setIsStreaming] = useState(false);
  const [draft, setDraft] = useState("");
  const [siddhantaMode, setSiddhantaMode] = useState(false);

  const api = useMemo(() => {
    async function ask(userQuery, overrides = {}) {
      const userMessage = { role: "user", text: userQuery, ts: Date.now() };
      const next = {
        ...memory,
        messages: [...memory.messages, userMessage],
        lastTopic: lessonContext.lessonTitle,
      };
      setMemory(next);
      persist(next);

      setIsStreaming(true);
      const placeholder = {
        role: "assistant",
        text: "",
        intent: "general_question",
        references: [],
        ts: Date.now() + 1,
      };

      const withPlaceholder = { ...next, messages: [...next.messages, placeholder] };
      setMemory(withPlaceholder);
      persist(withPlaceholder);

      const routed = await routeTutorAgent(
        {
          ...lessonContext,
          userQuery,
        },
        { siddhantaMode, ...overrides }
      );

      await streamText(routed.text, (chunk) => {
        setDraft(chunk);
      });

      const completed = {
        ...withPlaceholder,
        messages: [
          ...withPlaceholder.messages.slice(0, -1),
          {
            ...placeholder,
            text: routed.text,
            intent: routed.intent,
            references: routed.references || [],
          },
        ],
      };
      setDraft("");
      setIsStreaming(false);
      setMemory(completed);
      persist(completed);
      return routed;
    }

    async function regenerate() {
      const lastUser = [...memory.messages].reverse().find((m) => m.role === "user");
      if (!lastUser) return null;
      return ask(lastUser.text, { forceRegenerate: true });
    }

    function clear() {
      const reset = { messages: [], lastTopic: lessonContext.lessonTitle, difficultyLevel: memory.difficultyLevel };
      setMemory(reset);
      persist(reset);
    }

    return { ask, regenerate, clear };
  }, [memory, lessonContext, siddhantaMode]);

  return {
    memory,
    isStreaming,
    draft,
    siddhantaMode,
    setSiddhantaMode,
    ...api,
  };
}
