import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import { getClerkJsUrl, getClerkPublishableKey } from "./config/environment";
import "./index.css";
import "./App.css";
import "./styles/design-system.css";

const PUBLISHABLE_KEY = getClerkPublishableKey();
const CLERK_JS_URL = getClerkJsUrl();

if (!process.env.REACT_APP_CLERK_PUBLISHABLE_KEY) {
  // Helps catch misconfigured local envs early.
  console.warn("REACT_APP_CLERK_PUBLISHABLE_KEY is missing. Clerk auth will not work correctly.");
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} clerkJSUrl={CLERK_JS_URL}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
