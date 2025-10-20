# Health Professional Dashboard - Error Fixes

## Issues Found

### 1. **403 Forbidden Error**
- **Cause**: Authentication/authorization issue
- **Status**: Needs investigation of auth middleware

### 2. **404 Not Found Error** 
- **URL**: `/api/counselor/user/5`
- **Cause**: Wrong API endpoint - dashboard was using `/api/counselor/*` but server uses `/api/healthprofessional/*`
- **Status**: ✅ FIXED

## Fixes Applied

### Frontend Changes (`client/src/pages/healthproffesional/dashboard.js`)

1. **Changed API endpoint from `/api/counselor` to `/api/healthprofessional`**
   ```javascript
   // OLD:
   const counselorData = await fetchWithAuth(`${API_BASE}/api/counselor/user/${currentUser.user_id}`);
   
   // NEW:
   const counselorData = await fetchWithAuth(`${API_BASE}/api/healthprofessional/user/${currentUser.user_id}`);
   ```

2. **Updated response property name**
   ```javascript
   // OLD:
   if (!counselorData?.counselor?.counselor_id)
   
   // NEW:
   if (!counselorData?.healthprofessional)
   ```

3. **Added graceful fallback for missing dashboard endpoint**
   ```javascript
   try {
     const dashboard = await fetchWithAuth(`${API_BASE}/api/healthprofessional/${counselorId}/dashboard`);
     if (dashboard?.data) {
       setDashboardData(dashboard.data);
     }
   } catch (dashErr) {
     console.log('Dashboard endpoint not available yet, using empty data');
     // Continue with empty dashboard data instead of crashing
   }
   ```

4. **Improved error messages**
   - Added specific 404 error message
   - Better user-facing error descriptions

### Backend Changes

#### 1. **`server/controllers/healthProfessionalController.js`**

**Added real database query for `getByUserId`**:
```javascript
// OLD: Returned placeholder data
const hp = { user_id: userId, name: 'Demo Health Professional', ... };

// NEW: Queries actual database
SELECT c.*, u.name, u.email, u.phone
FROM counselor c
JOIN "User" u ON c.user_id = u.user_id
WHERE c.user_id = $1
```

**Added new `getDashboard` function**:
- Fetches today's appointments
- Fetches upcoming appointments (next 7 days)
- Finds next appointment
- Returns counts and full appointment data
- Includes elder information (name, dob, gender, contact, medical conditions, avatar)

**Fixed `getAppointmentStatistics`**:
- Changed from `counselor_appointment` table to `appointment` table
- Changed from `appointment_type` to `session_type` field
- Now uses correct table structure

#### 2. **`server/routes/healthprofessionalRoutes.js`**

**Added dashboard route**:
```javascript
router.get('/:counselorId/dashboard', healthProfessionalController.getDashboard);
```

**Important**: Route order matters! Dashboard route must come BEFORE other parameterized routes.

## Database Schema Used

### Counselor Table
```sql
SELECT counselor_id, user_id, specialization, license_number, 
       alternative_number, years_of_experience, current_institution, 
       proof, status, district
FROM counselor
```

### Appointment Table (for counselors)
```sql
SELECT appointment_id, elder_id, counselor_id, date_time, 
       status, session_type, session_duration, 
       patient_concerns, notes, meeting_link,
       patient_name, contact_number, emergency_contact
FROM appointment
WHERE counselor_id = ?
```

### Elder Table (joined for patient info)
```sql
SELECT elder_id, name, dob, gender, contact, address, 
       medical_conditions, profile_photo
FROM elder
```

## API Endpoints Now Available

### ✅ GET `/api/healthprofessional/user/:userId`
- Returns counselor profile by user ID
- Joins with User table for name, email, phone
- Returns 404 if not found

### ✅ GET `/api/healthprofessional/:counselorId/dashboard`
- Returns today's appointments
- Returns upcoming appointments (next 7 days)
- Returns next appointment
- Returns appointment counts
- Includes full elder/patient information

### ✅ GET `/api/healthprofessional/:counselorId/appointment-statistics`
- Returns appointment counts by session_type
- Filters by status (completed, confirmed)

### ✅ GET `/api/healthprofessional/:counselorId/elders-with-appointments`
- Gets list of elders with appointments (for chat)

### ✅ GET `/api/healthprofessional/:counselorId/elder/:elderId/appointments`
- Gets appointment history with specific elder

## Testing Checklist

- [x] Fixed API endpoint paths
- [x] Added real database queries
- [x] Added dashboard endpoint
- [x] Fixed appointment statistics query
- [x] Added proper error handling
- [ ] Test with actual health professional login
- [ ] Verify counselor record exists in database
- [ ] Check appointments display correctly
- [ ] Test meeting join functionality

## Remaining Issues to Investigate

### 1. **403 Forbidden Error**
Possible causes:
- JWT token invalid or expired
- Auth middleware rejecting request
- CORS issue
- Missing auth header

**Next steps**:
1. Check browser console for full error details
2. Verify JWT token in localStorage
3. Check server auth middleware logs
4. Test with Postman/curl with token

### 2. **Counselor Record Setup**
The health professional user (user_id = 5) may not have a counselor record yet.

**To verify**:
```sql
SELECT * FROM counselor WHERE user_id = 5;
```

**If no record exists**, create one:
```sql
INSERT INTO counselor (user_id, specialization, license_number, status, district)
VALUES (5, 'Mental Health', 'HP-001', 'approved', 'Colombo');
```

## Files Modified

1. ✅ `client/src/pages/healthproffesional/dashboard.js`
2. ✅ `server/controllers/healthProfessionalController.js`
3. ✅ `server/routes/healthprofessionalRoutes.js`

## How to Test

1. **Start the server**:
   ```bash
   cd server
   npm start
   ```

2. **Start the client**:
   ```bash
   cd client
   npm start
   ```

3. **Login as health professional** (user_id = 5)

4. **Check browser console** for:
   - Successful API calls
   - Proper data loading
   - Any remaining errors

5. **Check server logs** for:
   - Database queries
   - Success/error messages
   - Response data

## Expected Behavior After Fix

1. ✅ Dashboard loads without 404 error
2. ✅ Health professional profile fetched from database
3. ✅ Dashboard shows empty state if no appointments
4. ✅ Dashboard shows appointments if they exist
5. ✅ Proper error messages if setup incomplete

## Next Steps

1. **Resolve 403 error** - Check authentication
2. **Verify counselor record** - Ensure user has counselor profile
3. **Test appointments** - Create test appointments for counselor
4. **Test meeting join** - Verify video session functionality
5. **Add more endpoints** - Sessions, reports, patient management
