import React from "react";
import { ToastContainer } from "react-toastify";
import AppRoutes from "@/routes";
import "react-toastify/dist/ReactToastify.css";
import "./App.scss";

function App() {
  return (
    <>
      <AppRoutes />
      <ToastContainer position="top-right" autoClose={4000} closeOnClick pauseOnHover />
    </>
  );
}

export default App;
