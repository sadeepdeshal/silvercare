# Health Professional Dashboard - Upcoming Sessions Fix (Table Mismatch)

## Issue Identified
The health professional dashboard was not displaying upcoming sessions even though the data existed in the database.

## Root Cause
The backend controller was querying the **wrong table**:
- ❌ Was querying: `appointment` table (for doctor appointments)
- ✅ Should query: `counselor_appointment` table (for health professional/counselor appointments)

## Solution Applied

### Files Modified:
**`server/controllers/healthProfessionalController.js`**

#### 1. Updated `getDashboard()` function:
Changed all queries from `appointment` table to `counselor_appointment` table:

**Before:**
```javascript
FROM appointment a
LEFT JOIN elder e ON a.elder_id = e.elder_id
WHERE a.counselor_id = $1
```

**After:**
```javascript
FROM counselor_appointment ca
LEFT JOIN elder e ON ca.elder_id = e.elder_id
WHERE ca.counselor_id = $1
```

**Key Changes:**
- Changed table alias from `a` to `ca`
- Updated all column references (e.g., `a.appointment_id` → `ca.appointment_id`)
- Added proper status filtering: `status IN ('pending', 'confirmed', 'approved')`
- Included all necessary fields from `counselor_appointment` table:
  - `appointment_id`
  - `elder_id`, `family_id`, `counselor_id`
  - `date_time`, `status`, `appointment_type`, `session_type`
  - `notes`, `session_duration`, `meeting_link`

#### 2. Updated `getAppointmentStatistics()` function:
Changed statistics query from `appointment` to `counselor_appointment`:

**Before:**
```javascript
FROM appointment 
WHERE counselor_id = $1 
```

**After:**
```javascript
FROM counselor_appointment 
WHERE counselor_id = $1 
```

## Reference Implementation
This fix follows the same pattern used in:
- **Family Member Dashboard**: `server/controllers/familyMemberController.js` (lines 347-407)
- **Elder Sessions**: `server/controllers/session.js`

Both of these correctly query the `counselor_appointment` table for counselor/health professional appointments.

## Testing

### Test Data Available:
- **Counselor ID**: 4
- **Appointments in `counselor_appointment` table**:
  - Appointment ID 36: Oct 15, 2025 (past)
  - Appointment ID 38: Oct 23, 2025 (upcoming) ✅ This should now display!

### Expected Results After Fix:
1. ✅ Appointment ID 38 should appear in "Upcoming Sessions"
2. ✅ Dashboard stats should show correct count
3. ✅ Meeting links should be available for online sessions
4. ✅ Elder information should display correctly

## How to Test:
1. **Restart backend server** to apply changes
2. **Login as health professional** (user_id: 22, counselor_id: 4)
3. **Navigate to health professional dashboard**
4. **Verify**:
   - Upcoming sessions count shows 1
   - Appointment ID 38 appears in upcoming sessions list
   - Elder name, date, and time display correctly
   - Join meeting button is available for online sessions

**Status**: ✅ Fixed - Ready for testing after backend restart
