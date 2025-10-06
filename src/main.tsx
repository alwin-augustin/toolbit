import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@/styles/prism-themes.css"

createRoot(document.getElementById("root")!).render(<App />);
