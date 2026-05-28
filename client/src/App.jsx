import React from "react";
import { ToastContainer } from "react-toastify";
import AuthInitializer from "@/components/AuthInitializer";
import AppRoutes from "@/routes";
import "react-toastify/dist/ReactToastify.css";
import "./App.scss";

function App() {
  return (
    <>
      <AuthInitializer>
        <AppRoutes />
      </AuthInitializer>
      <ToastContainer position="top-right" autoClose={4000} closeOnClick pauseOnHover />
    </>
  );
}

export default App;
