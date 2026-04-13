/**
 * Coerce API/LLM values to a safe display string (avoids [object Object] in React/PDF).
 * Handles nested { code: { ... } } shapes from some models.
 */
export function coerceDisplayString(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map(coerceDisplayString).filter(Boolean).join("\n");
  }
  if (typeof value === "object") {
    if (typeof value.snippet === "string") return value.snippet;
    if (typeof value.text === "string") return value.text;
    if (typeof value.body === "string") return value.body;
    if (typeof value.content === "string") return value.content;
    if (typeof value.source === "string") return value.source;
    if (typeof value.value === "string") return value.value;

    if (value.code !== undefined && value.code !== value) {
      const inner = value.code;
      if (typeof inner === "string") return inner;
      if (inner && typeof inner === "object") {
        const nested = coerceDisplayString(inner);
        if (nested) return nested;
      }
    }

    if (typeof value.code === "string") return value.code;

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "";
    }
  }
  return String(value);
}

/**
 * Normalize one example record to plain strings for UI/PDF/clipboard.
 */
export function coerceExampleRecord(ex) {
  if (ex == null) {
    return { title: "", code: "", output: "", description: "" };
  }
  if (typeof ex === "string") {
    return { title: "", code: "", output: "", description: coerceDisplayString(ex) };
  }
  if (typeof ex !== "object") {
    return { title: "", code: "", output: "", description: coerceDisplayString(ex) };
  }
  return {
    title: coerceDisplayString(ex.title ?? ex.name ?? ""),
    code: coerceDisplayString(ex.code ?? ex.codeExample ?? ex.snippet ?? ""),
    output: coerceDisplayString(
      ex.output ?? ex.expectedOutput ?? ex.stdout ?? ex.result ?? ""
    ),
    description: coerceDisplayString(
      ex.description ?? ex.explanation ?? ex.details ?? ""
    ),
  };
}
