import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Auth Pages
import RegisterPage from "./pages/Auth/Register/Register.jsx";
import LoginPage from "./pages/Auth/Login/Login.jsx";
import ForgotPasswordPage from "./pages/Auth/Login/ForgotPassword.jsx";

// Guest Pages
import HomePage from "./pages/Guest/Home/Home.jsx";
import AboutPage from "./pages/Guest/About/About.jsx";
import ContactPage from "./pages/Guest/Contact/Contact.jsx";

import HotelListPage from "./pages/Guest/Hotel/HotelList.jsx";
import HotelDetailPage from "./pages/Guest/Hotel/HotelDetail.jsx";

import BookingPage from "./pages/Guest/Booking/Booking.jsx";
import MyBookingsPage from "./pages/Guest/Booking/MyBookings.jsx";
import BookingDetail from "./pages/Guest/Booking/BookingDetail.jsx";

import Account from "./pages/Guest/Profile/Account.jsx";
import AccountEdit from "./pages/Guest/Profile/AccountEdit.jsx";
import ChangePassword from "./pages/Guest/Profile/ChangePassword.jsx";

// Admin Pages
import AdminHomePage from "./pages/Admin/Home/AdminHome.jsx";

import AdminUserList from "./pages/Admin/ManageUser/UserList.jsx";
import AdminUserCreate from "./pages/Admin/ManageUser/UserCreate.jsx";
import AdminUserDetail from "./pages/Admin/ManageUser/UserDetail.jsx";
import AdminUserEdit from "./pages/Admin/ManageUser/UserEdit.jsx";

import AdminHotelList from "./pages/Admin/ManageHotel/HotelList.jsx";
import AdminHotelCreate from "./pages/Admin/ManageHotel/HotelCreate.jsx";
import AdminHotelEdit from "./pages/Admin/ManageHotel/HotelEdit.jsx";
import AdminHotelDetail from "./pages/Admin/ManageHotel/HotelDetail.jsx";

import AdminRoomCreate from "./pages/Admin/ManageRoom/RoomCreate.jsx";
import AdminRoomEdit from "./pages/Admin/ManageRoom/RoomEdit.jsx";
import AdminRoomDetail from "./pages/Admin/ManageRoom/RoomDetail.jsx";

import AdminBookingList from "./pages/Admin/ManageBooking/BookingList.jsx";
import AdminBookingDetail from "./pages/Admin/ManageBooking/BookingDetail.jsx";



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

        {/* Guest Routes */}
        {/* Trang cá nhân */}
        <Route path="/profile/:id" element={<Account />} />
        <Route path="/profile/:id/edit" element={<AccountEdit />} />
        <Route path="/profile/:id/changepassword" element={<ChangePassword />} />

        {/* Danh sách khách sạn */}
        <Route path="/hotels" element={<HotelListPage />} />
        <Route path="/hotels/:id" element={<HotelDetailPage />} />

        {/* Đặt phòng */}
        <Route path="/booking/new" element={<BookingPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/booking/:id" element={<BookingDetail />} />

        {/* Admin Routes */}
        <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
         <Route path="/admin/*" element={<AdminHomePage />} />
         {/* Quản lý người dùng */}
         <Route path="/admin/users" element={<AdminUserList />} />
         <Route path="/admin/users/create" element={<AdminUserCreate />} />
         <Route path="/admin/users/:id" element={<AdminUserDetail />} />
         <Route path="/admin/users/edit/:id" element={<AdminUserEdit />} />
         {/* Quản lý khách sạn */}
         <Route path="/admin/hotels" element={<AdminHotelList />} />
         <Route path="/admin/hotels/create" element={<AdminHotelCreate />} />
         <Route path="/admin/hotels/:id" element={<AdminHotelDetail />} />
         <Route path="/admin/hotels/:id/edit" element={<AdminHotelEdit />} />
         <Route path="/admin/hotels/:id/rooms/create" element={<AdminRoomCreate />} />
         <Route path="/admin/rooms/:id" element={<AdminRoomDetail />} />
         <Route path="/admin/rooms/:id/edit" element={<AdminRoomEdit />} />
         {/* Quản lý đặt phòng */}
         <Route path="/admin/bookings" element={<AdminBookingList />} />
         <Route path="/admin/bookings/:id" element={<AdminBookingDetail />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
