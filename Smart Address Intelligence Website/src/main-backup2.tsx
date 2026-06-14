import { createRoot } from "react-dom/client";
import AppWorking from "./app/AppWorking";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/index.css";
import './main-groq-test.tsx'

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <AppWorking />
  </ErrorBoundary>
);
