# Health Professional (Counselor) Dashboard Update

## Overview
Updated the Healthcare Professional Dashboard to match the Doctor Dashboard implementation with full feature parity and counselor-specific functionality.

## Key Changes

### 1. **Full API Integration**
- Connected to backend API endpoints for real-time data
- Fetches counselor data using `/api/counselor/user/{user_id}` endpoint
- Retrieves dashboard data from `/api/counselor/{counselor_id}/dashboard`
- Supports authentication with Bearer token

### 2. **Data-Driven Dashboard**
Displays real counseling appointment data:
- **Today's Appointments**: All counseling sessions scheduled for today
- **Upcoming Appointments**: Future counseling sessions
- **Next Patient**: Next scheduled patient with full details
- **Patient Statistics**: Total number of unique patients

### 3. **Appointment Management Features**
- View today's schedule with time-based sorting
- See upcoming sessions with patient details
- Display next patient information with medical history
- Support for both online and in-person session types

### 4. **Online Meeting Integration**
- Integrated Jitsi Meet for online counseling sessions
- One-click join functionality for online sessions
- Automatic meeting link generation
- Session status validation (only confirmed sessions can be joined)
- Counselor identification in meeting interface

### 5. **Session Type Handling**
The dashboard properly differentiates between:
- **Online Sessions** (session_type = 'online'): Can join via video meeting
- **In-Person Sessions** (session_type = 'in-person'): Shows view details only

### 6. **User Experience Enhancements**

#### Onboarding Tour
- Welcome modal for first-time users
- Interactive dashboard tour with 7 key steps
- Tour state persistence using localStorage
- Help button to restart tour anytime

#### Visual Feedback
- Loading spinner during data fetch
- Error handling with retry functionality
- Empty states for no appointments
- Disabled buttons for unavailable actions

### 7. **Responsive Design**
- Uses the same professional styling as doctor dashboard
- Gradient backgrounds and modern card designs
- Responsive grid layouts
- Mobile-friendly interface

### 8. **Patient Information Display**
Shows comprehensive patient details:
- Patient name, age, and address
- Medical conditions
- Contact information
- Patient avatar with gender-based fallback images
- Appointment date and time

### 9. **Quick Actions Section**
Four main action cards:
- Create Treatment Plan
- View Reports (with navigation to reports page)
- Manage Patients
- Resources (mental health resources)

### 10. **Task Management**
- Today's tasks list
- Task completion tracking
- Time-based task organization

## Database Schema Mapping

The dashboard correctly maps to the appointment table fields:
```
appointment_id → Unique identifier
elder_id → Patient reference
counselor_id → Counselor reference
date_time → Appointment timing
status → confirmed/pending/cancelled
session_type → online/in-person
session_duration → Default 60 minutes
meeting_link → Jitsi Meet URL
patient_name → Elder name
contact_number → Elder contact
```

## API Endpoints Required

### Backend Implementation Needed:
```javascript
// Get counselor by user_id
GET /api/counselor/user/:userId
Response: { counselor: { counselor_id, user_id, specialization, ... } }

// Get counselor dashboard data
GET /api/counselor/:counselorId/dashboard
Response: {
  data: {
    todaysAppointments: [...],
    upcomingAppointments: [...],
    nextAppointment: {...},
    counts: {
      todaysAppointments: number,
      upcomingAppointments: number
    }
  }
}
```

## Component Structure

```
HealthProfessionalDashboard
├── Navbar
├── HealthProfessionalSidebar
├── Header Section (Welcome Card)
├── Stats Section (4 stat cards)
├── Main Content
│   ├── Left Column
│   │   ├── Next Patient Card
│   │   └── Today's Tasks Card
│   └── Right Column
│       ├── Upcoming Sessions Card
│       └── Today's Schedule Card
├── Online Meetings Section (conditional)
├── Quick Actions Section
├── Help Button
├── WelcomeModal (onboarding)
└── OnboardingTour (guide)
```

## Features Matching Doctor Dashboard

✅ Real-time data loading
✅ Authentication with JWT tokens
✅ Error handling and retry logic
✅ Loading states
✅ Empty states for no data
✅ Meeting integration (Jitsi)
✅ Responsive design
✅ Onboarding tour
✅ Patient information display
✅ Appointment status badges
✅ Session type differentiation
✅ Quick actions
✅ Task management
✅ Sidebar collapse/expand
✅ Modern UI/UX

## Differences from Doctor Dashboard

1. **Terminology**: 
   - "Consultations" → "Sessions"
   - "Doctor" → "Counselor/Health Professional"
   - "Medical" → "Mental Health"

2. **Session Types**:
   - Uses `session_type` instead of `appointment_type`
   - Focused on mental health counseling

3. **API Endpoints**:
   - Uses `/api/counselor/*` instead of `/api/doctor/*`

4. **Role Context**:
   - Emphasizes mental health and counseling practice
   - Mental health resources in quick actions

## Testing Checklist

- [ ] Login as health professional user
- [ ] Verify dashboard data loads
- [ ] Check appointment display (today's and upcoming)
- [ ] Test online meeting join functionality
- [ ] Verify onboarding tour works
- [ ] Check responsive design on mobile
- [ ] Test error states
- [ ] Verify empty states display correctly
- [ ] Test sidebar collapse/expand
- [ ] Check quick actions navigation

## Future Enhancements

1. Treatment plan management
2. Progress notes integration
3. Session recording/notes
4. Patient communication history
5. Report generation
6. Resource library
7. Appointment rescheduling
8. Calendar integration
9. Session reminders
10. Patient feedback system

## Files Modified

- `client/src/pages/healthproffesional/dashboard.js` - Complete rewrite with full functionality

## Files Used (Unchanged)

- `client/src/components/HealthProfessionalSidebar.js`
- `client/src/components/navbar.js`
- `client/src/components/WelcomeModal.js`
- `client/src/components/OnboardingTour.js`
- `client/src/components/OnlineMeetingInterface.js`
- `client/src/utils/imageUtils.js`
- `client/src/components/css/doctor/dashboard.module.css`
- `client/src/components/css/doctor_sidebar.module.css`

## Conclusion

The Health Professional Dashboard now provides a complete, professional interface for counselors to manage their mental health practice, matching the functionality and user experience of the Doctor Dashboard while maintaining counselor-specific features and terminology.
