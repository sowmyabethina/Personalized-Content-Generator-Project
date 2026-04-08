import { useEffect } from "react";

export const useServiceWorkerRegistration = () => {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return undefined;
    }

    const handleLoad = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((error) => {
          console.log("SW registration failed:", error);
        });
    };

    window.addEventListener("load", handleLoad);

    return () => {
      window.removeEventListener("load", handleLoad);
    };
  }, []);
};

export default useServiceWorkerRegistration;
