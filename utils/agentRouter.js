import { analyzePythonCode } from "./codeAnalyzer.js";

function classifyIntent(userQuery, lesson) {
  const q = (userQuery || "").toLowerCase();
  if (/debug|error|traceback|syntax|fix|bug/.test(q)) return "debug_code";
  if (/quiz|answer|option|mcq|hint/.test(q)) return "quiz_help";
  if (/explain|what is|how does|why/.test(q)) return "explain_concept";
  if (lesson?.quiz?.q && /question/.test(q)) return "quiz_help";
  return "general_question";
}

function explainConcept(context, siddhantaMode) {
  const safeSummary = context.content?.slice(0, 900) || "Insufficient evidence";
  if (!context.content) {
    return {
      text: "Insufficient evidence: lesson content was not available.",
      references: [],
    };
  }

  if (siddhantaMode) {
    return {
      text: [
        "**Siddhanta Mode (deterministic explanation)**",
        "1. **Definition:** This lesson focuses on the main concept in the current section.",
        "2. **Mechanism:** It links theory to implementation through the provided code snippet.",
        "3. **Practical check:** Verify assumptions against the lesson code and quiz prompt.",
        "4. **No-hallucination policy:** If details are missing, the tutor must say *Insufficient evidence*.",
        "",
        `Grounded summary from lesson:\n${safeSummary}`,
      ].join("\n"),
      references: ["content", "code"],
    };
  }

  return {
    text: `Grounded explanation:\n${safeSummary}\n\nIf you want deeper detail, ask for Siddhanta Mode for a step-by-step breakdown.`,
    references: ["content"],
  };
}

function quizHint(context) {
  const quizText = context.quizQuestion || "";
  if (!quizText) {
    return {
      text: "Insufficient evidence: this lesson does not expose a quiz prompt right now.",
      references: [],
    };
  }
  return {
    text: `Hint only (no answer reveal):\n- Re-read the lesson section tied to this quiz.\n- Eliminate options that violate deterministic/safety principles.\n- Ask me to explain one option at a time if needed.\n\nQuiz prompt: ${quizText}`,
    references: ["content"],
  };
}

function generalAnswer(context) {
  if (!context.userQuery?.trim()) {
    return { text: "Insufficient evidence: empty question.", references: [] };
  }
  return {
    text: `I can help with this lesson using grounded context only.\n\nQuestion: ${context.userQuery}\n\nKnown context: ${context.lessonTitle} (${context.lessonId}). If you need debugging, press **Debug my code** for deterministic AST checks.`,
    references: ["content"],
  };
}

function debugResponse(analysis) {
  if (analysis.syntaxOk) {
    return {
      text: `Deterministic debug result:\n- ✅ Syntax parse: success\n- Suggested improvements:\n${analysis.suggestions.map((s) => `  - ${s}`).join("\n") || "  - No issues found by deterministic checks."}\n\nI did not execute your code and will not invent runtime output.`,
      references: ["code"],
    };
  }

  return {
    text: `Deterministic debug result:\n- ❌ Syntax parse failed: ${analysis.syntaxError}\n- Suggested fixes:\n${analysis.suggestions.map((s) => `  - ${s}`).join("\n")}\n\nI did not execute your code and will not fabricate runtime results.`,
    references: ["code"],
  };
}

export async function routeTutorAgent(context, { siddhantaMode = false } = {}) {
  const intent = classifyIntent(context.userQuery, context.lesson);

  if (intent === "debug_code") {
    const analysis = await analyzePythonCode(context.codeSnippet || "");
    return { intent, ...debugResponse(analysis) };
  }

  if (intent === "quiz_help") {
    return { intent, ...quizHint(context) };
  }

  if (intent === "explain_concept") {
    return { intent, ...explainConcept(context, siddhantaMode) };
  }

  return { intent, ...generalAnswer(context) };
}
