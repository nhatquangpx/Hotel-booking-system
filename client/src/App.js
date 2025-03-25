import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import PrivateRoute from "./components/PrivateRoute";
import "./App.css";

function App() {
  const user = useSelector((state) => state.auth?.user || null);

  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route 
          path="/dashboard" 
          element={
            user ? (
              user.role === "admin" ? <Navigate to="/admin" /> 
              : user.role === "staff" ? <Navigate to="/staff" /> 
              : <Navigate to="/" />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={["staff"]} />}>
          <Route path="/staff" element={<StaffDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
