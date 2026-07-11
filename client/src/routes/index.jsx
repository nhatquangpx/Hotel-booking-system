import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./protected";
import { ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/roles";

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
  VNPayCallbackPage,
} from "@/features/guest";
import { AuthLoginPage, AuthRegisterPage, AuthForgotPasswordPage } from "@/features/auth";
import {
  AdminDashboardPage,
  AdminUserListPage,
  AdminHotelListPage,
  AdminBookingListPage,
  AdminContactMessageListPage,
  AdminNotificationsPage,
  AdminProfileAccountPage,
  AdminProfileEditPage,
  AdminProfileChangePasswordPage,
  AdminTwoFactorPage,
} from "@/features/admin";
import {
  OwnerDashboardPage,
  OwnerDynamicPricingPage,
  OwnerSalePage,
  OwnerAddonServicesPage,
  OwnerRoomMapPage,
  OwnerBookingListPage,
  OwnerEquipmentPage,
  OwnerReviewsPage,
  OwnerNotificationsPage,
  OwnerProfileAccountPage,
  OwnerProfileEditPage,
  OwnerProfileChangePasswordPage,
  OwnerTwoFactorPage,
} from "@/features/owner";
import { OwnerHotelOutlet } from "@/features/owner/context/OwnerHotelContext";
import {
  StaffDashboardPage,
  StaffRoomMapPage,
  StaffBookingsPage,
  StaffAddonServicesPage,
  StaffEquipmentPage,
  StaffReviewsPage,
  StaffNotificationsPage,
  StaffProfileAccountPage,
  StaffProfileEditPage,
  StaffProfileChangePasswordPage,
} from "@/features/staff";
import { StaffHotelOutlet } from "@/features/staff/context/StaffHotelContext";

export default function AppRoutes() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path={ROUTES.HOME} element={<GuestHomePage />} />
        <Route path={ROUTES.ABOUT} element={<GuestAboutPage />} />
        <Route path={ROUTES.CONTACT} element={<GuestContactPage />} />
        <Route path={ROUTES.REGISTER} element={<AuthRegisterPage />} />
        <Route path={ROUTES.LOGIN} element={<AuthLoginPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<AuthForgotPasswordPage />} />

        <Route path={ROUTES.PROFILE} element={<GuestProfileAccountPage />} />
        <Route path={ROUTES.PROFILE_EDIT} element={<GuestProfileEditPage />} />
        <Route path={ROUTES.PROFILE_CHANGE_PASSWORD} element={<GuestProfileChangePasswordPage />} />

        <Route path={ROUTES.HOTELS} element={<GuestHotelListPage />} />
        <Route path={ROUTES.HOTEL_DETAIL} element={<GuestHotelDetailPage />} />

        <Route path={ROUTES.BOOKING_NEW} element={<GuestBookingPage />} />
        <Route path={ROUTES.MY_BOOKINGS} element={<GuestMyBookingsPage />} />
        <Route path={ROUTES.WISHLIST} element={<GuestWishlistPage />} />

        <Route path={ROUTES.PAYMENT_VNPAY_RETURN} element={<VNPayCallbackPage />} />
        <Route path={ROUTES.NOTIFICATIONS} element={<GuestNotificationsPage />} />

        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path={ROUTES.ADMIN_HOME} element={<AdminDashboardPage />} />
          <Route path={ROUTES.ADMIN_USERS} element={<AdminUserListPage />} />
          <Route path={ROUTES.ADMIN_HOTELS} element={<AdminHotelListPage />} />
          <Route path={ROUTES.ADMIN_BOOKINGS} element={<AdminBookingListPage />} />
          <Route path={ROUTES.ADMIN_CONTACT_MESSAGES} element={<AdminContactMessageListPage />} />
          <Route path={ROUTES.ADMIN_NOTIFICATIONS} element={<AdminNotificationsPage />} />
          <Route path={ROUTES.ADMIN_PROFILE} element={<AdminProfileAccountPage />} />
          <Route path={ROUTES.ADMIN_PROFILE_EDIT} element={<AdminProfileEditPage />} />
          <Route path={ROUTES.ADMIN_PROFILE_CHANGE_PASSWORD} element={<AdminProfileChangePasswordPage />} />
          <Route path={ROUTES.ADMIN_PROFILE_TWO_FACTOR} element={<AdminTwoFactorPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.OWNER]} />}>
          <Route element={<OwnerHotelOutlet />}>
            <Route path={ROUTES.OWNER_HOME} element={<OwnerDashboardPage />} />
            <Route path={ROUTES.OWNER_ROOMS} element={<OwnerRoomMapPage />} />
            <Route path={ROUTES.OWNER_PRICING} element={<OwnerDynamicPricingPage />} />
            <Route path={ROUTES.OWNER_SALE} element={<OwnerSalePage />} />
            <Route path={ROUTES.OWNER_ADDON_SERVICES} element={<OwnerAddonServicesPage />} />
            <Route path={ROUTES.OWNER_BOOKINGS} element={<OwnerBookingListPage />} />
            <Route path={ROUTES.OWNER_EQUIPMENT} element={<OwnerEquipmentPage />} />
            <Route path={ROUTES.OWNER_REVIEWS} element={<OwnerReviewsPage />} />
            <Route path={ROUTES.OWNER_NOTIFICATIONS} element={<OwnerNotificationsPage />} />
            <Route path={ROUTES.OWNER_PROFILE} element={<OwnerProfileAccountPage />} />
            <Route path={ROUTES.OWNER_PROFILE_EDIT} element={<OwnerProfileEditPage />} />
            <Route path={ROUTES.OWNER_PROFILE_CHANGE_PASSWORD} element={<OwnerProfileChangePasswordPage />} />
            <Route path={ROUTES.OWNER_PROFILE_TWO_FACTOR} element={<OwnerTwoFactorPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.STAFF]} />}>
          <Route element={<StaffHotelOutlet />}>
            <Route path={ROUTES.STAFF_HOME} element={<StaffDashboardPage />} />
            <Route path={ROUTES.STAFF_ROOMS} element={<StaffRoomMapPage />} />
            <Route path={ROUTES.STAFF_BOOKINGS} element={<StaffBookingsPage />} />
            <Route path={ROUTES.STAFF_ADDON_SERVICES} element={<StaffAddonServicesPage />} />
            <Route path={ROUTES.STAFF_EQUIPMENT} element={<StaffEquipmentPage />} />
            <Route path={ROUTES.STAFF_REVIEWS} element={<StaffReviewsPage />} />
            <Route path={ROUTES.STAFF_NOTIFICATIONS} element={<StaffNotificationsPage />} />
            <Route path={ROUTES.STAFF_PROFILE} element={<StaffProfileAccountPage />} />
            <Route path={ROUTES.STAFF_PROFILE_EDIT} element={<StaffProfileEditPage />} />
            <Route path={ROUTES.STAFF_PROFILE_CHANGE_PASSWORD} element={<StaffProfileChangePasswordPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
