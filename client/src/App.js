import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserPage from "./pages/UserPage";
import { FamilyMemberReg } from "./pages/familemember/signup";
import { FamilyMemberReg2 } from "./pages/familemember/signup-step2";
import ElderSignup from "./pages/familemember/elder-signup";
import FamilyMemberDashboard from "./pages/familemember/dashboard";
import FamilyMemberElders from "./pages/familemember/elders";
import ElderDetails from "./pages/familemember/elder-details";
import CaregiverDetails from "./pages/familemember/caregiver-details";
import FamilyMemberLayout from "./components/FamilyMemberLayout";
import { CaregiverReg } from "./pages/caregiver/signup";
import { CaregiverRegStep2 } from "./pages/caregiver/signup-step2";
import CaregiverDashboard from "./pages/caregiver/dashboard";
import AdminDashboard from "./pages/admin/dashboard";
import { DoctorReg } from "./pages/doctor/signup";
import { MentalHealthProfessionalReg } from "./pages/healthproffesional/signup";
import { HealthProfessionalRegStep2 } from "./pages/healthproffesional/signup-step2";
import { HealthProfessionalRegStep3 } from "./pages/healthproffesional/signup-step3";
import HealthProfessionalDashboard from "./pages/healthproffesional/dashboard";
import { DoctorRegStep2 } from "./pages/doctor/signup-step2";
// Import new appointment components

import PhysicalAppointment from './pages/familemember/physical-appointment';
import OnlineAppointment from './pages/familemember/online-appointment';
import Appointments from './pages/familemember/appointments';
import BookingSummary from './pages/familemember/booking-summary';
import Payment from './pages/familemember/payment';
import PaymentSuccess from './pages/familemember/payment-success';



import AllAppointments from "./pages/elder/appointments";
import AppointmentDetails from "./pages/elder/appointment-details";


import DoctorDashboard from './pages/doctor/dashboard';
import DoctorProfile from './pages/doctor/profile';
import ElderDashboard from './pages/elder/dashboard';
import { Login } from './pages/login';
import { Roles } from './pages/roles';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import ElderDoctors component
import ElderDoctors from "./pages/familemember/elder-doctors";
import CaregiverProfile from "./pages/familemember/profile";
import FamilyMemberProfile from "./pages/familemember/profile";
import HealthProfessionalProfile from "./pages/healthproffesional/profile";
import ElderProfile from "./pages/elder/profile";

// Import admin related
import AdminUsers from "./pages/admin/users";

// Optional: Create an Unauthorized component
const Unauthorized = () => (
  <div style={{ textAlign: "center", padding: "50px" }}>
    <h1>403 - Unauthorized</h1>
    <p>You don't have permission to access this page.</p>
    <a href="/login">Go to Login</a>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes - No authentication required */}
          <Route path="/" element={<Roles />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Registration Routes - No authentication required */}
          <Route path="/family-member/signup" element={<FamilyMemberReg />} />
          <Route
            path="/family-member/signup-step2"
            element={<FamilyMemberReg2 />}
          />
          <Route
            path="/family-member/elder-signup"
            element={
              <ProtectedRoute allowedRoles={["family_member"]}>
                <ElderSignup />
              </ProtectedRoute>
            }
          />
          <Route path="/doctor/signup" element={<DoctorReg />} />
          <Route path="/doctor/signup-step2" element={<DoctorRegStep2 />} />

          <Route
            path="/healthproffesional/signup"
            element={<MentalHealthProfessionalReg />}
          />
          <Route
            path="/healthproffesional/signup-step2"
            element={<HealthProfessionalRegStep2 />}
          />
          <Route
            path="/healthproffesional/signup-step3"
            element={<HealthProfessionalRegStep3 />}
          />
          <Route path="/caregiver/signup" element={<CaregiverReg />} />
          <Route
            path="/caregiver/signup-step2"
            element={<CaregiverRegStep2 />}
          />

          {/* Family Member Routes with Layout - All protected routes use the layout */}
          <Route
            path="/family-member/elder-signup"
            element={
              <ProtectedRoute allowedRoles={["family_member"]}>
                <FamilyMemberLayout>
                  <ElderSignup />
                </FamilyMemberLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Dashboard Routes - Authentication required */}
          <Route
            path="/family-member/dashboard"
            element={
              <ProtectedRoute allowedRoles={["family_member"]}>
                <FamilyMemberDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/family-member/profile"
            element={
              <ProtectedRoute allowedRoles={["family_member"]}>
                <FamilyMemberProfile />
              </ProtectedRoute>
            }
          />

          {/* NEW: Add the appointment booking routes */}
          <Route
            path="/family-member/book-appointment/:elderId/:doctorId/physical"
            element={
              <ProtectedRoute allowedRoles={["family_member"]}>
                <PhysicalAppointment />
              </ProtectedRoute>
            }
          />

          <Route
            path="/family-member/book-appointment/:elderId/:doctorId/online"
            element={
              <ProtectedRoute allowedRoles={["family_member"]}>
                <OnlineAppointment />
              </ProtectedRoute>
            }
          />

          <Route
            path="/family-member/appointments"
            element={
              <ProtectedRoute allowedRoles={["family_member"]}>
                <Appointments />
              </ProtectedRoute>
            }
          />

          {/* Add the elders route */}
          <Route
            path="/family-member/elders"
            element={
              <ProtectedRoute allowedRoles={["family_member"]}>
                <FamilyMemberElders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/family-member/elder/:elderId"
            element={
              <ProtectedRoute allowedRoles={["family_member"]}>
                <ElderDetails />
              </ProtectedRoute>
            }
          />

          {/* Add the elder doctors route - THIS IS THE IMPORTANT ONE */}

          <Route path="/family-member/elder/:elderId/doctors" element={
            <ProtectedRoute allowedRoles={['family_member']}>
              <ElderDoctors />
            </ProtectedRoute>
          } />

          {/* NEW: Booking flow routes */}
<Route path="/family-member/elder/:elderId/booking-summary/:doctorId" element={
  <ProtectedRoute allowedRoles={['family_member']}>
    <BookingSummary />
  </ProtectedRoute>
} />

<Route path="/family-member/payment" element={
  <ProtectedRoute allowedRoles={['family_member']}>
    <Payment />
  </ProtectedRoute>
} />

<Route path="/family-member/payment-success" element={
  <ProtectedRoute allowedRoles={['family_member']}>
    <PaymentSuccess />
  </ProtectedRoute>
} />

          
          <Route path="/doctor/dashboard" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } />

              <Route path="/doctor/profile" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorProfile />
            </ProtectedRoute>
          } />
          


          <Route
            path="/family-member/elder/:elderId/doctors"
            element={
              <ProtectedRoute allowedRoles={["family_member"]}>
                <ElderDoctors />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <DoctorProfile />
              </ProtectedRoute>
            }
          />



          {/* Fix the health professional route - change from healthproffesional to healthprofessional */}
          <Route
            path="/healthprofessional/dashboard"
            element={
              <ProtectedRoute allowedRoles={["healthprofessional"]}>
                <HealthProfessionalDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/healthprofessional/profile"
            element={
              <ProtectedRoute allowedRoles={["healthprofessional"]}>
                <HealthProfessionalProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/caregiver/dashboard"
            element={
              <ProtectedRoute allowedRoles={["caregiver"]}>
                <CaregiverDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/caregiver/profile"
            element={
              <ProtectedRoute allowedRoles={["caregiver"]}>
                <CaregiverProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/elder/dashboard"
            element={
              <ProtectedRoute allowedRoles={["elder"]}>
                <ElderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/elder/profile"
            element={
              <ProtectedRoute allowedRoles={["elder"]}>
                <ElderProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/elder/appointments"
            element={
              <ProtectedRoute allowedRoles={["elder"]}>
                <AllAppointments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/elder/appointment/:appointmentId"
            element={
              <ProtectedRoute allowedRoles={["elder"]}>
                <AppointmentDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/family-member/caregivers"
            element={
              <ProtectedRoute allowedRoles={["family_member"]}>
                <CaregiverDetails />
              </ProtectedRoute>
            }
          />

          {/* Other Protected Routes */}
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UserPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
