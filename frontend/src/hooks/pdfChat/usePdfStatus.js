import { useCallback, useEffect, useState } from "react";
import { checkPdfStatus } from "../../services/pdfChat/pdfChatService";

export const usePdfStatus = () => {
  const [pdfStatus, setPdfStatus] = useState(null);
  const [statusError, setStatusError] = useState("");

  const refreshStatus = useCallback(async () => {
    try {
      const status = await checkPdfStatus();
      setPdfStatus(status);
      setStatusError("");
    } catch (error) {
      setStatusError(error.message);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    pdfStatus,
    setPdfStatus,
    statusError,
    refreshStatus,
  };
};

export default usePdfStatus;
