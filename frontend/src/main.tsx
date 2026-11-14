import React from "react";
import ReactDOM from "react-dom/client";
import "leaflet/dist/leaflet.css";
import "./styles.css";
import App from "./App";
import { ShelterProvider } from "./store/ShelterStore";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ShelterProvider>
      <App />
    </ShelterProvider>
  </React.StrictMode>,
);
