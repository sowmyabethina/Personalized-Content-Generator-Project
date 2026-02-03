import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";

const clerkKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!clerkKey) {
  throw new Error("Missing Clerk Publishable Key");
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={clerkKey}>
        <App />
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>
);
