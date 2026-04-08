export const parseJsonSafely = async (response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const getErrorMessage = (payload, fallbackMessage) => {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    return payload.error || payload.message || fallbackMessage;
  }

  return fallbackMessage;
};

export const requestJson = async (url, options = {}, fallbackMessage = "Request failed") => {
  const response = await fetch(url, options);
  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, fallbackMessage));
  }

  return payload;
};
