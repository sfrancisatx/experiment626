import React from "react";
import ReactDOM from "react-dom/client";
import { Client } from "colyseus.js";
import { LandingPageReact } from "./LandingPageReact";

const client = new Client("ws://localhost:5111");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LandingPageReact client={client} />
  </React.StrictMode>
);
