import { createRoot } from "react-dom/client";
import AppWorking from "./app/AppWorking";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/index.css";

console.log('=== DEBUG: Robust AI analysis test starting ===')

createRoot(document.getElementById("root")!.render(
  <ErrorBoundary>
    <AppWorking />
  </ErrorBoundary>
);
