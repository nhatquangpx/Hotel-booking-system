# Future Features Implementation Guide

## 🎯 Overview

This guide provides step-by-step instructions for implementing the planned features while maintaining the clean, role-based architecture.

## 📋 Feature Implementation Roadmap

### 1. Owner Role Features

**Priority:** High  
**Estimated Time:** 2-3 weeks

#### Structure to Create:
```
features/owner/
├── dashboard/
│   ├── components/
│   │   ├── OwnerStats.jsx
│   │   ├── RevenueChart.jsx
│   │   └── RecentBookings.jsx
│   └── index.jsx
├── hotels/
│   ├── list/
│   ├── edit/
│   ├── detail/
│   └── settings/
├── bookings/
│   ├── list/
│   ├── detail/
│   └── calendar/
├── reviews/
│   └── responses/
└── revenue/
    ├── components/
    │   ├── RevenueSummary.jsx
    │   └── RevenueChart.jsx
    └── index.jsx
```

#### Implementation Steps:

1. **Create Owner Routes**
   ```jsx
   // In routes/index.jsx
   <Route element={<ProtectedRoute allowedRoles={["owner"]} />}>
     <Route path="/owner" element={<OwnerDashboardPage />} />
     <Route path="/owner/hotels" element={<OwnerHotelListPage />} />
     // ... more routes
   </Route>
   ```

2. **Filter Data by Owner**
   ```javascript
   // In owner features, always filter by ownerId
   const { user } = useAuth();
   const ownerHotels = await api.ownerHotel.getMyHotels(user.id);
   ```

3. **Share Components with Admin**
   - Reuse hotel/room form components
   - Create shared components in `components/shared/`
   - Use composition pattern

#### Key Differences from Admin:
- Owners can only manage their own hotels
- Limited access to system-wide data
- Focus on revenue and bookings for own hotels

---

### 2. Payment Integration (VNPay)

**Priority:** High  
**Estimated Time:** 1-2 weeks

#### Structure to Create:
```
features/payment/
├── vnpay/
│   ├── components/
│   │   ├── VNPayButton.jsx
│   │   ├── VNPayCallback.jsx
│   │   └── VNPayForm.jsx
│   ├── hooks/
│   │   └── useVNPay.js
│   ├── services/
│   │   └── vnpayService.js
│   └── index.jsx
├── qr-code/
│   └── components/
│       └── QRCodePayment.jsx (existing)
├── invoices/
│   ├── components/
│   │   ├── InvoiceViewer.jsx
│   │   ├── InvoiceList.jsx
│   │   └── InvoicePDF.jsx
│   └── services/
│       └── invoiceService.js
└── history/
    └── index.jsx
```

#### Implementation Steps:

1. **Create Payment Service Abstraction**
   ```javascript
   // lib/payment/paymentService.js
   export const paymentService = {
     createPayment: async (bookingId, method) => {
       if (method === 'vnpay') {
         return await vnpayService.createPayment(bookingId);
       } else if (method === 'qr_code') {
         return await qrCodeService.createPayment(bookingId);
       }
     }
   };
   ```

2. **Update Booking Flow**
   ```jsx
   // In features/guest/booking/create/index.jsx
   const [paymentMethod, setPaymentMethod] = useState('qr_code');
   
   // Add payment method selection
   <select value={paymentMethod} onChange={...}>
     <option value="qr_code">QR Code</option>
     <option value="vnpay">VNPay</option>
   </select>
   ```

3. **Handle Payment Callback**
   ```jsx
   // features/payment/vnpay/components/VNPayCallback.jsx
   // Verify payment and update booking status
   ```

4. **Generate Invoices**
   ```javascript
   // lib/email/services/invoiceService.js
   export const generateInvoice = async (booking) => {
     // Generate PDF invoice
     // Send via email
   };
   ```

---

### 3. Reviews & Ratings

**Priority:** Medium  
**Estimated Time:** 1-2 weeks

#### Structure to Create:
```
features/reviews/
├── create/
│   ├── components/
│   │   ├── ReviewForm.jsx
│   │   ├── RatingStars.jsx
│   │   └── ReviewSubmission.jsx
│   └── hooks/
│       └── useCreateReview.js
├── list/
│   ├── components/
│   │   ├── ReviewCard.jsx
│   │   ├── ReviewList.jsx
│   │   └── ReviewFilters.jsx
│   └── index.jsx
├── owner-response/
│   ├── components/
│   │   └── ResponseForm.jsx
│   └── index.jsx
└── moderation/
    └── index.jsx (admin only)
```

#### Implementation Steps:

1. **Add Review Section to Hotel Detail**
   ```jsx
   // In features/guest/hotels/detail/index.jsx
   import { ReviewList } from '../../../reviews/list';
   
   // Add reviews section
   <ReviewList hotelId={hotel._id} />
   ```

2. **Create Review Form**
   ```jsx
   // Only show for past bookings
   {canReview && <ReviewForm hotelId={hotel._id} bookingId={booking._id} />}
   ```

3. **Owner Response Feature**
   ```jsx
   // In features/owner/reviews/responses/
   // Allow owners to respond to reviews
   ```

4. **Rating Component**
   ```jsx
   // features/reviews/create/components/RatingStars.jsx
   // Interactive 1-5 star rating
   ```

---

### 4. Real-time Notifications

**Priority:** Medium  
**Estimated Time:** 2-3 weeks

#### Structure to Create:
```
features/notifications/
├── components/
│   ├── NotificationBell.jsx
│   ├── NotificationList.jsx
│   ├── NotificationItem.jsx
│   └── NotificationDropdown.jsx
├── hooks/
│   ├── useNotifications.js
│   └── useWebSocket.js
└── services/
    ├── notificationService.js
    └── websocketService.js
```

#### Implementation Steps:

1. **WebSocket Setup**
   ```javascript
   // lib/websocket/notificationSocket.js
   export const connectNotificationSocket = (userId) => {
     const ws = new WebSocket(`${WS_URL}/notifications/${userId}`);
     return ws;
   };
   ```

2. **Notification Component**
   ```jsx
   // features/notifications/components/NotificationBell.jsx
   // Show unread count, dropdown with notifications
   ```

3. **Notification Types**
   ```javascript
   // constants/notifications.js
   export const NOTIFICATION_TYPES = {
     BOOKING_CONFIRMED: 'booking_confirmed',
     NEW_BOOKING: 'new_booking', // for owners
     PAYMENT_RECEIVED: 'payment_received',
     REVIEW_RECEIVED: 'review_received', // for owners
   };
   ```

4. **Add to Layouts**
   ```jsx
   // In GuestLayout and AdminLayout
   <NotificationBell />
   ```

---

### 5. Advanced Search & Filters

**Priority:** Medium  
**Estimated Time:** 1 week

#### Structure to Create:
```
features/search/
├── components/
│   ├── AdvancedFilters.jsx
│   ├── PriceRangeFilter.jsx
│   ├── AmenitiesFilter.jsx
│   ├── LocationFilter.jsx
│   └── DateAvailabilityFilter.jsx
├── hooks/
│   └── useAdvancedSearch.js
└── utils/
    └── searchHelpers.js
```

#### Implementation Steps:

1. **Extend Existing Hook**
   ```javascript
   // features/search/hooks/useAdvancedSearch.js
   // Extend useHotelFilters with:
   // - Price range (min/max)
   // - Amenities (array)
   // - Location (coordinates, radius)
   // - Date availability
   ```

2. **Create Filter Components**
   ```jsx
   // features/search/components/PriceRangeFilter.jsx
   // Slider or input for price range
   ```

3. **Update Hotel List Page**
   ```jsx
   // In features/guest/hotels/index.jsx
   import { AdvancedFilters } from '../../search/components';
   ```

---

### 6. Two-Factor Authentication (2FA)

**Priority:** High (Security)  
**Estimated Time:** 1-2 weeks

#### Structure to Create:
```
features/security/
├── 2fa/
│   ├── components/
│   │   ├── TwoFactorSetup.jsx
│   │   ├── OTPInput.jsx
│   │   ├── QRCodeDisplay.jsx
│   │   └── BackupCodes.jsx
│   ├── hooks/
│   │   └── use2FA.js
│   └── services/
│       └── otpService.js
└── settings/
    └── index.jsx
```

#### Implementation Steps:

1. **OTP Service**
   ```javascript
   // lib/security/otpService.js
   export const otpService = {
     generateSecret: () => { /* ... */ },
     sendOTP: (email, secret) => { /* ... */ },
     verifyOTP: (code, secret) => { /* ... */ },
   };
   ```

2. **2FA Setup Flow**
   ```jsx
   // features/security/2fa/components/TwoFactorSetup.jsx
   // 1. Generate secret
   // 2. Show QR code
   // 3. Verify with OTP
   // 4. Save to user profile
   ```

3. **Update Login Flow**
   ```jsx
   // In features/auth/login/
   // After password check, if 2FA enabled:
   if (user.twoFactorEnabled) {
     navigate('/verify-2fa');
   }
   ```

4. **Update ProtectedRoute**
   ```jsx
   // Already prepared with require2FA prop
   <ProtectedRoute allowedRoles={["admin", "owner"]} require2FA={true} />
   ```

---

### 7. Email Notifications & Reminders

**Priority:** Medium  
**Estimated Time:** 1-2 weeks

#### Structure to Create:
```
lib/email/
├── services/
│   ├── emailService.js
│   ├── templateService.js
│   └── schedulerService.js
├── templates/
│   ├── bookingConfirmation.js
│   ├── checkInReminder.js
│   ├── checkOutReminder.js
│   ├── invoice.js
│   └── reviewRequest.js
└── hooks/
    └── useEmail.js
```

#### Implementation Steps:

1. **Email Service**
   ```javascript
   // lib/email/services/emailService.js
   export const emailService = {
     send: async (to, template, data) => { /* ... */ },
     sendBookingConfirmation: async (booking) => { /* ... */ },
     sendReminder: async (booking, type) => { /* ... */ },
   };
   ```

2. **Email Templates**
   ```javascript
   // lib/email/templates/bookingConfirmation.js
   export const bookingConfirmationTemplate = (booking) => {
     return {
       subject: 'Xác nhận đặt phòng',
       html: `...`,
     };
   };
   ```

3. **Scheduled Emails**
   ```javascript
   // Backend: Use cron jobs or scheduled tasks
   // Send check-in reminder 1 day before
   // Send check-out reminder on check-out day
   ```

4. **Integrate with Booking Flow**
   ```javascript
   // After successful booking
   await emailService.sendBookingConfirmation(booking);
   ```

---

## 🔧 Best Practices for Implementation

### 1. Component Reusability
- Create shared components in `components/shared/`
- Use composition over duplication
- Share form components between admin and owner

### 2. API Layer
- Extend existing API structure
- Create feature-specific API files
- Use consistent error handling

### 3. State Management
- Use React Query for server state
- Keep Redux for global state
- Use Context for feature-specific state

### 4. Testing
- Write unit tests for utilities
- Test hooks in isolation
- Integration tests for features

### 5. Performance
- Lazy load routes
- Code split by feature
- Optimize images

## 📝 Notes

- All new features should follow the role-based structure
- Use existing patterns (layouts, hooks, utils)
- Maintain consistency with current codebase
- Document new features
- Add tests as you go

