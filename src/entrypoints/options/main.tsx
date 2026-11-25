import { createRoot } from "react-dom/client";
import { Video } from "./video";
import "./global.css";

const root = document.getElementById("root");
root && createRoot(root).render(<Video />);
