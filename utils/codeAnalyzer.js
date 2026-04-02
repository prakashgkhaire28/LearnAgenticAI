let pyodidePromise = null;

async function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const { loadPyodide } = await import("https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.mjs");
      return loadPyodide();
    })();
  }
  return pyodidePromise;
}

function deterministicHeuristics(code) {
  const hints = [];
  if (!code.trim()) hints.push("No code provided. Paste Python code to debug.");
  if (code.includes("== None")) hints.push("Prefer `is None` instead of `== None`.");
  if (/print\([^\)]*$/.test(code)) hints.push("A `print(` call may be missing a closing `)`.");
  if (/\bexcept\s*:\s*$/m.test(code)) hints.push("Avoid bare `except:`; catch specific exception classes.");
  return hints;
}

export async function analyzePythonCode(code) {
  const base = {
    syntaxOk: false,
    syntaxError: null,
    suggestions: deterministicHeuristics(code),
  };

  if (!code || !code.trim()) {
    return {
      ...base,
      syntaxError: "Insufficient evidence: no Python code was supplied.",
    };
  }

  try {
    const pyodide = await getPyodide();
    pyodide.globals.set("__agent_code__", code);
    const result = pyodide.runPython(`
import ast
code = __agent_code__
try:
    tree = ast.parse(code)
    nodes = [type(n).__name__ for n in ast.walk(tree)]
    {"ok": True, "node_count": len(nodes), "has_import": any(n == "Import" or n == "ImportFrom" for n in nodes)}
except SyntaxError as e:
    {"ok": False, "message": f"{e.msg} (line {e.lineno}, col {e.offset})"}
`);

    if (result.ok) {
      if (!result.has_import) {
        base.suggestions.push("No imports detected. If using external modules, add explicit imports.");
      }
      return {
        ...base,
        syntaxOk: true,
      };
    }

    return {
      ...base,
      syntaxError: result.message,
      suggestions: [
        `Fix syntax first: ${result.message}`,
        ...base.suggestions,
      ],
    };
  } catch (error) {
    return {
      ...base,
      syntaxError: "Insufficient evidence: parser unavailable in this browser session.",
      suggestions: [
        "Retry once Pyodide finishes loading.",
        ...base.suggestions,
      ],
      systemError: String(error),
    };
  }
}
