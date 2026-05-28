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
  GuestProfileAccountPage,
  GuestProfileEditPage,
  GuestProfileChangePasswordPage,
  GuestNotificationsPage,
  GuestWishlistPage,
  VNPayCallbackPage
} from "@/features/guest";
import { AuthLoginPage, AuthRegisterPage, AuthForgotPasswordPage } from "@/features/auth";
import { 
  AdminDashboardPage,
  AdminUserListPage,
  AdminUserDetailPage,
  AdminHotelListPage,
  AdminHotelDetailPage,
  AdminRoomCreatePage,
  AdminRoomDetailPage,
  AdminRoomEditPage,
  AdminBookingListPage,
  AdminBookingDetailPage,
  AdminContactMessageListPage,
  AdminProfileAccountPage,
  AdminProfileEditPage,
  AdminProfileChangePasswordPage,
  AdminTwoFactorPage
} from "@/features/admin";
import { 
  OwnerDashboardPage,
  OwnerDynamicPricingPage,
  OwnerSalePage,
  OwnerRoomMapPage,
  OwnerBookingListPage,
  OwnerEquipmentPage,
  OwnerReviewsPage,
  OwnerNotificationsPage,
  OwnerProfileAccountPage,
  OwnerProfileEditPage,
  OwnerProfileChangePasswordPage,
  OwnerTwoFactorPage
} from "@/features/owner";
import { OwnerHotelOutlet } from "@/features/owner/context/OwnerHotelContext";
import {
  StaffDashboardPage,
  StaffRoomMapPage,
  StaffBookingsPage,
  StaffEquipmentPage,
  StaffReviewsPage,
  StaffNotificationsPage,
  StaffProfileAccountPage,
  StaffProfileEditPage,
  StaffProfileChangePasswordPage,
} from "@/features/staff";
import { StaffHotelOutlet } from "@/features/staff/context/StaffHotelContext";

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
        <Route path="/wishlist" element={<GuestWishlistPage />} />

        {/* Guest - Payment */}
        <Route path="/payment/vnpay-return" element={<VNPayCallbackPage />} />

        {/* Guest - Notifications */}
        <Route path="/notifications" element={<GuestNotificationsPage />} />

        {/* Admin (protected) */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />

          {/* Users */}
          <Route path="/admin/users" element={<AdminUserListPage />} />
          <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />

          {/* Hotels */}
          <Route path="/admin/hotels" element={<AdminHotelListPage />} />
          <Route path="/admin/hotels/:id" element={<AdminHotelDetailPage />} />
          <Route path="/admin/hotels/:id/rooms/create" element={<AdminRoomCreatePage />} />

          {/* Rooms */}
          <Route path="/admin/rooms/:id" element={<AdminRoomDetailPage />} />
          <Route path="/admin/rooms/:id/edit" element={<AdminRoomEditPage />} />

          {/* Bookings */}
          <Route path="/admin/bookings" element={<AdminBookingListPage />} />
          <Route path="/admin/bookings/:id" element={<AdminBookingDetailPage />} />
          <Route path="/admin/contact-messages" element={<AdminContactMessageListPage />} />

          {/* Profile */}
          <Route path="/admin/profile" element={<AdminProfileAccountPage />} />
          <Route path="/admin/profile/edit" element={<AdminProfileEditPage />} />
          <Route path="/admin/profile/changepassword" element={<AdminProfileChangePasswordPage />} />
          <Route path="/admin/profile/two-factor" element={<AdminTwoFactorPage />} />
        </Route>

        {/* Owner (protected) — chọn khách sạn dùng chung qua OwnerHotelOutlet */}
        <Route element={<ProtectedRoute allowedRoles={["owner"]} />}>
          <Route element={<OwnerHotelOutlet />}>
            <Route path="/owner" element={<OwnerDashboardPage />} />
            <Route path="/owner/rooms" element={<OwnerRoomMapPage />} />
            <Route path="/owner/pricing" element={<OwnerDynamicPricingPage />} />
            <Route path="/owner/sale" element={<OwnerSalePage />} />
            <Route path="/owner/bookings" element={<OwnerBookingListPage />} />
            <Route path="/owner/equipment" element={<OwnerEquipmentPage />} />
            <Route path="/owner/reviews" element={<OwnerReviewsPage />} />
            <Route path="/owner/notifications" element={<OwnerNotificationsPage />} />

            {/* Profile */}
            <Route path="/owner/profile" element={<OwnerProfileAccountPage />} />
            <Route path="/owner/profile/edit" element={<OwnerProfileEditPage />} />
            <Route path="/owner/profile/changepassword" element={<OwnerProfileChangePasswordPage />} />
            <Route path="/owner/profile/two-factor" element={<OwnerTwoFactorPage />} />
          </Route>
        </Route>

        {/* Staff (protected) */}
        <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
          <Route element={<StaffHotelOutlet />}>
            <Route path="/staff" element={<StaffDashboardPage />} />
            <Route path="/staff/rooms" element={<StaffRoomMapPage />} />
            <Route path="/staff/bookings" element={<StaffBookingsPage />} />
            <Route path="/staff/equipment" element={<StaffEquipmentPage />} />
            <Route path="/staff/reviews" element={<StaffReviewsPage />} />
            <Route path="/staff/notifications" element={<StaffNotificationsPage />} />
            <Route path="/staff/profile" element={<StaffProfileAccountPage />} />
            <Route path="/staff/profile/edit" element={<StaffProfileEditPage />} />
            <Route path="/staff/profile/changepassword" element={<StaffProfileChangePasswordPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
