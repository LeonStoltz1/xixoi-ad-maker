import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initAnimatedFavicon } from "./lib/animatedFavicon";

// Initialize animated favicon
initAnimatedFavicon();

createRoot(document.getElementById("root")!).render(<App />);
