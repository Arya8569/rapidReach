import { createRoot } from "react-dom/client";
import AppWorking from "./app/AppWorking.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/index.css";
import './main-debug.tsx'

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <AppWorking />
  </ErrorBoundary>
);