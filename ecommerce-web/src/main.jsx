import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { Provider } from "react-redux";
import { store } from "./store/index";
import App from "./App.jsx";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js"; 

import "./index.css";
import "./styles/admin.css";
import "./styles/orders.css";
import "./styles/header.css";


ReactDOM.createRoot(document.getElementById("root")).render(//concurrent rendering,
  <React.StrictMode>
    <BrowserRouter>
    {/* //to keep UI in sync with the URL */}
      <Provider store={store}>
      <App />
    </Provider>
    </BrowserRouter>
  </React.StrictMode>
);