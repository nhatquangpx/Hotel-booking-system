import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
//User Pages
import HomePage from "./pages/UserPages/HomePage.jsx";
import AboutPage from "./pages/UserPages/AboutPage.jsx";
import ContactPage from "./pages/UserPages/ContactPage.jsx";
import RegisterPage from "./pages/AuthPages/RegisterPage/RegisterPage";
import LoginPage from "./pages/AuthPages/LoginPage/LoginPage.jsx";
import ForgotPasswordPage from "./pages/AuthPages/LoginPage/ForgotPasswordPage.jsx";
//Admin Pages
import AdminHomePage from "./pages/AdminPages/AdminHomePage.jsx";
import UserList from "./pages/AdminPages/UserList.jsx";
//Staff Pages
import StaffHomePage from "./pages/StaffPages/StaffHomePage.jsx";
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
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
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
         <Route path="/admin/*" element={<AdminHomePage />} />
         <Route path="/admin/users" element={<UserList />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={["staff"]} />}>
          <Route path="/staff/*" element={<StaffHomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
