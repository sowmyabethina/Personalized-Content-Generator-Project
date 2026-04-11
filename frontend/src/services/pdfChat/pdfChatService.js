import ENDPOINTS from "../../config/api";
import { requestJson } from "../../utils/http";

export const checkPdfStatus = async () =>
  requestJson(ENDPOINTS.PDF_CHAT.HEALTH, undefined, "Failed to check PDF status.");

export const uploadPdf = async (file) => {
  const formData = new FormData();
  formData.append("pdf", file);

  return requestJson(
    ENDPOINTS.PDF_CHAT.UPLOAD,
    {
      method: "POST",
      body: formData,
    },
    "Failed to upload PDF."
  );
};

export const sendPdfChatMessage = async ({ message, sessionId, signal }) =>
  requestJson(
    ENDPOINTS.AGENT.CHAT,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sessionId }),
      signal,
    },
    "Failed to get response."
  );

export const generateMindMap = async () =>
  requestJson(
    ENDPOINTS.PDF_CHAT.MINDMAP,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({}),
    },
    "Failed to generate mind map."
  );

export const resetPdfChat = async (sessionId) =>
  requestJson(
    ENDPOINTS.PDF_CHAT.RESET,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    },
    "Failed to reset chat."
  );
