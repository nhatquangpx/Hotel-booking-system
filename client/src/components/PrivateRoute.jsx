import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const PrivateRoute = ({ allowedRoles }) => {
  const auth = useSelector((state) => state.auth) || { user: null, token: null };
  const { user, token } = auth;
  const localToken = localStorage.getItem("token");
  const localUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Xác định token và role hiệu quả
  const effectiveToken = token || localToken;
  const effectiveRole = user?.role || localUser.role;

  console.log("PrivateRoute - effectiveToken:", effectiveToken);
  console.log("PrivateRoute - effectiveRole:", effectiveRole);

  // Kiểm tra token
  if (!effectiveToken) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra quyền truy cập (sử dụng parentheses để rõ ràng)
  if (allowedRoles && ( !effectiveRole || !allowedRoles.includes(effectiveRole) )) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
