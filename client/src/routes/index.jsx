import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./protected";

// Features - organized by role (guest, admin, auth)
import { 
  GuestHomePage, 
  GuestHotelListPage, 
  GuestHotelDetailPage,
  GuestAboutPage,
  GuestContactPage,
  GuestBookingPage,
  GuestMyBookingsPage,
  GuestBookingDetailPage,
  GuestProfileAccountPage,
  GuestProfileEditPage,
  GuestProfileChangePasswordPage
} from "@/features/guest";
import { AuthLoginPage, AuthRegisterPage, AuthForgotPasswordPage } from "@/features/auth";
import { 
  AdminDashboardPage,
  AdminUserListPage,
  AdminUserCreatePage,
  AdminUserDetailPage,
  AdminUserEditPage,
  AdminHotelListPage,
  AdminHotelCreatePage,
  AdminHotelDetailPage,
  AdminHotelEditPage,
  AdminRoomCreatePage,
  AdminRoomDetailPage,
  AdminRoomEditPage,
  AdminBookingListPage,
  AdminBookingDetailPage
} from "@/features/admin";
import { OwnerDashboardPage, OwnerRoomMapPage } from "@/features/owner";

/**
 * App Routes
 * Main routing configuration for the application
 * Uses role-based feature imports
 */
export default function AppRoutes() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Public & Auth Routes */}
        <Route path="/" element={<GuestHomePage />} />
        <Route path="/about" element={<GuestAboutPage />} />
        <Route path="/contact" element={<GuestContactPage />} />
        <Route path="/register" element={<AuthRegisterPage />} />
        <Route path="/login" element={<AuthLoginPage />} />
        <Route path="/forgotpassword" element={<AuthForgotPasswordPage />} />

        {/* Guest - Profile */}
        <Route path="/profile/:id" element={<GuestProfileAccountPage />} />
        <Route path="/profile/:id/edit" element={<GuestProfileEditPage />} />
        <Route path="/profile/:id/changepassword" element={<GuestProfileChangePasswordPage />} />

        {/* Guest - Hotels */}
        <Route path="/hotels" element={<GuestHotelListPage />} />
        <Route path="/hotels/:id" element={<GuestHotelDetailPage />} />

        {/* Guest - Booking */}
        <Route path="/booking/new" element={<GuestBookingPage />} />
        <Route path="/my-bookings" element={<GuestMyBookingsPage />} />
        <Route path="/booking/:id" element={<GuestBookingDetailPage />} />

        {/* Admin (protected) */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />

          {/* Users */}
          <Route path="/admin/users" element={<AdminUserListPage />} />
          <Route path="/admin/users/create" element={<AdminUserCreatePage />} />
          <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
          <Route path="/admin/users/edit/:id" element={<AdminUserEditPage />} />

          {/* Hotels */}
          <Route path="/admin/hotels" element={<AdminHotelListPage />} />
          <Route path="/admin/hotels/create" element={<AdminHotelCreatePage />} />
          <Route path="/admin/hotels/:id" element={<AdminHotelDetailPage />} />
          <Route path="/admin/hotels/:id/edit" element={<AdminHotelEditPage />} />
          <Route path="/admin/hotels/:id/rooms/create" element={<AdminRoomCreatePage />} />

          {/* Rooms */}
          <Route path="/admin/rooms/:id" element={<AdminRoomDetailPage />} />
          <Route path="/admin/rooms/:id/edit" element={<AdminRoomEditPage />} />

          {/* Bookings */}
          <Route path="/admin/bookings" element={<AdminBookingListPage />} />
          <Route path="/admin/bookings/:id" element={<AdminBookingDetailPage />} />
        </Route>

        {/* Owner (protected) */}
        <Route element={<ProtectedRoute allowedRoles={["owner"]} />}>
          <Route path="/owner" element={<OwnerDashboardPage />} />
          <Route path="/owner/rooms" element={<OwnerRoomMapPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
