import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Auth Pages
import RegisterPage from "./pages/Auth/Register/RegisterPage";
import LoginPage from "./pages/Auth/Login/LoginPage";
import ForgotPasswordPage from "./pages/Auth/Login/ForgotPasswordPage";

// Guest Pages
import HomePage from "./pages/Guest/Home/HomePage";
import AboutPage from "./pages/Guest/About/AboutPage";
import ContactPage from "./pages/Guest/Contact/ContactPage";
import HotelListPage from "./pages/Guest/HotelList/HotelListPage";
import HotelDetailPage from "./pages/Guest/HotelDetail/HotelDetailPage";
import BookingPage from "./pages/Guest/Booking/BookingPage";
import MyBookingsPage from "./pages/Guest/Booking/MyBookingsPage";

// Admin Pages
import AdminHomePage from "./pages/Admin/Home/AdminHomePage.jsx";
import UserList from "./pages/Admin/ManageUser/UserList.jsx";
import UserCreate from "./pages/Admin/ManageUser/UserCreate.jsx";
import UserDetail from "./pages/Admin/ManageUser/UserDetail.jsx";
import UserEdit from "./pages/Admin/ManageUser/UserEdit.jsx";
import HotelList from "./pages/Admin/ManageHotel/HotelList.jsx";
import HotelCreate from "./pages/Admin/ManageHotel/HotelCreate.jsx";
import HotelDetail from "./pages/Admin/ManageHotel/HotelDetail.jsx";
import RoomList from "./pages/Admin/ManageRoom/RoomList.jsx";
import RoomCreate from "./pages/Admin/ManageRoom/RoomCreate.jsx";
import BookingList from "./pages/Admin/ManageBooking/BookingList.jsx";
import BookingDetail from "./pages/Admin/ManageBooking/BookingDetail.jsx";

// Owner Pages
import OwnerHomePage from "./pages/Owner/Home/OwnerHomePage.jsx";

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

        {/* Hotel Routes */}
        <Route path="/hotels" element={<HotelListPage />} />
        <Route path="/hotels/:id" element={<HotelDetailPage />} />

        {/* Booking Routes */}
        <Route path="/booking/new" element={<BookingPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />

        <Route
          path="/dashboard"
          element={
            user ? (
              user.role === "admin" ? <Navigate to="/admin" />
                : user.role === "owner" ? <Navigate to="/owner" />
                  : <Navigate to="/" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
         <Route path="/admin/*" element={<AdminHomePage />} />
         {/* Quản lý người dùng */}
         <Route path="/admin/users" element={<UserList />} />
         <Route path="/admin/users/create" element={<UserCreate />} />
         <Route path="/admin/users/:id" element={<UserDetail />} />
         <Route path="/admin/users/edit/:id" element={<UserEdit />} />
         {/* Quản lý khách sạn */}
         <Route path="/admin/hotels" element={<HotelList />} />
         <Route path="/admin/hotels/create" element={<HotelCreate />} />
         <Route path="/admin/hotels/:id" element={<HotelDetail />} />
         {/* Quản lý phòng (được truy cập từ trang chi tiết khách sạn) */}
         <Route path="/admin/rooms" element={<RoomList />} />
         <Route path="/admin/rooms/create" element={<RoomCreate />} />
         {/* Quản lý đặt phòng */}
         <Route path="/admin/bookings" element={<BookingList />} />
         <Route path="/admin/bookings/:id" element={<BookingDetail />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={["owner"]} />}>
          <Route path="/owner/*" element={<OwnerHomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
