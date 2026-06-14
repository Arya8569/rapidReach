import { createRoot } from "react-dom/client";
import AppWorking from "./app/AppWorking";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/index.css";

console.log('=== DEBUG: Testing specific failing address ===')

createRoot(document.getElementById("root")!.render(
  <ErrorBoundary>
    <AppWorking />
  </ErrorBoundary>
);
