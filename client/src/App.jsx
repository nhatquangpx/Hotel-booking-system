import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/AuthPages/RegisterPage";
import LoginPage from "./pages/AuthPages/LoginPage";
import ForgotPasswordPage from "./pages/AuthPages/ForgotPasswordPage";
import AdminPage from "./pages/AdminPage";
import StaffDashboard from "./pages/StaffDashboard";
import PrivateRoute from "./components/PrivateRoute.jsx";
import "./App.scss";

function App() {
  const user = useSelector((state) => state.auth?.user || null);

  return (
    <BrowserRouter future={{ 
      v7_startTransition: true,
      v7_relativeSplatPath: true 
    }}>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgotpassword" element={<ForgotPasswordPage />} />

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
         <Route path="/admin/*" element={<AdminPage />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={["staff"]} />}>
          <Route path="/staff/*" element={<StaffDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
