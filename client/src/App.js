import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserPage from "./pages/UserPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import { FamilyMemberReg } from "./pages/familemember/signup";
import { FamilyMemberReg2 } from "./pages/familemember/signup-step2";
import ElderSignup from "./pages/familemember/elder-signup";
import FamilyMemberDashboard from "./pages/familemember/dashboard";
import FamilyMemberElders from "./pages/familemember/elders";
import FamilyMemberReports from "./pages/familemember/reports";
import ElderDetails from "./pages/familemember/elder-details";
import CaregiverDetails from "./pages/familemember/caregiver-details";
import FamilyMemberLayout from "./components/FamilyMemberLayout";
import { CaregiverReg } from "./pages/caregiver/signup";
import { CaregiverRegStep2 } from "./pages/caregiver/signup-step2";
import Profile from "./pages/caregiver/profile";
import CaregiverDashboard from "./pages/caregiver/dashboard";
import CareRequestDetails from "./pages/caregiver/care-request-details";
import CareRequests from "./pages/caregiver/care-requests";
import Carelogs from './pages/caregiver/carelog';
import Elder from './pages/caregiver/elder';
import ViewAllElders from './pages/caregiver/viewAllElders';
import AdminDashboard from "./pages/admin/dashboard";
import { DoctorReg } from "./pages/doctor/signup";
import { MentalHealthProfessionalReg } from "./pages/healthproffesional/signup";
import { HealthProfessionalRegStep2 } from "./pages/healthproffesional/signup-step2";
import { HealthProfessionalRegStep3 } from "./pages/healthproffesional/signup-step3";
import HealthProfessionalDashboard from "./pages/healthproffesional/dashboard";
import HealthProfessionalReports from "./pages/healthproffesional/reports";
import { DoctorRegStep2 } from "./pages/doctor/signup-step2";
// Import new appointment components

import PhysicalAppointment from './pages/familemember/physical-appointment';
import OnlineAppointment from './pages/familemember/online-appointment';
import HealthcareProfessionalAppointment from './pages/familemember/healthcare-professional-appointment';
import PhysicalHealthcareProfessionalAppointment from './pages/familemember/physical-healthcare-professional-appointment';
import OnlineHealthcareProfessionalAppointment from './pages/familemember/online-healthcare-professional-appointment';
import HealthcareProfessionalBookingSummary from './pages/familemember/healthcare-professional-booking-summary';
import Appointments from './pages/familemember/appointments';
import CancelAppointment from "./pages/familemember/cancel-appointment";
import AppointmentHistory from "./pages/familemember/appointment-history";
import BookingSummary from './pages/familemember/booking-summary';
import Payment from './pages/familemember/payment';
import PaymentSuccess from './pages/familemember/payment-success';
import HealthcarePayment from './pages/familemember/healthcare-payment';
import HealthcarePaymentSuccess from './pages/familemember/healthcare-payment-success';

// Import new caregiver booking components
import FamilyMemberElderCaregivers from './pages/familemember/elder-caregivers';
import CaregiversByDistrict from './pages/familemember/caregivers-by-district';
import CaregiverBooking from './pages/familemember/caregiver-booking';
import CaregiverBookingSummary from './pages/familemember/caregiver-booking-summary';
import CaregiverPayment from './pages/familemember/caregiver-payment';
import CaregiverPaymentSuccess from './pages/familemember/caregiver-payment-success';
import CaregiverBookings from './pages/familemember/caregiver-bookings';
import TodaysCareReport from './pages/familemember/todays-care-report';
import ElderCareSchedule from './pages/familemember/elder-care-schedule';



import AllAppointments from "./pages/elder/appointments";
import AppointmentDetails from "./pages/elder/appointment-details";
import AllSessions from "./pages/elder/sessions";
import SessionDetails from "./pages/elder/session-details";
import ElderCaregivers from "./pages/elder/caregivers";


import DoctorDashboard from './pages/doctor/dashboard';
import DoctorProfile from './pages/doctor/profile';
import DoctorReports from './pages/doctor/reports';
import TodaysAppointments from './pages/doctor/appointments';
import DoctorSchedule from './pages/doctor/schedule';
import DoctorPatients from './pages/doctor/patients';
import VirtualMeetingRoom from './pages/VirtualMeetingRoom';
import JitsiMeetingRoom from './pages/JitsiMeetingRoom';
import MeetingGenerator from './pages/MeetingGenerator';
import TestMeeting from './pages/TestMeeting';
import PatientMeetingJoin from './pages/PatientMeetingJoin';
import ElderDashboard from './pages/elder/dashboard';
import { Login } from './pages/login';
import { Roles } from './pages/roles';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DoctorMessages from './pages/familemember/DoctorMessages';
import DoctorMessages2 from './pages/doctor/DoctorMessages';
import ElderMessages from './pages/familemember/ElderMessages';
// Import ElderDoctors component
import ElderDoctors from "./pages/familemember/elder-doctors";
import CaregiverProfile from "./pages/familemember/profile";
import FamilyMemberProfile from "./pages/familemember/profile";
import HealthProfessionalProfile from "./pages/healthproffesional/profile";
import ElderProfile from "./pages/elder/profile";
import FamilyMessages from "./pages/elder/FamilyMessages";
import ElderDoctorMessages from "./pages/elder/DoctorMessages";
import CounselorMessages from "./pages/elder/CounselorMessages";
import ElderChat from "./pages/doctor/ElderChat";
import HealthProfessionalElderMessages from "./pages/healthproffesional/ElderMessages";
import CaregiverMessages from "./pages/familemember/CaregiverMessages";
import FamilyMemberMessages from "./pages/caregiver/FamilyMemberMessages";

// Import caregiver-elder messaging components
import CaregiverElderMessages from "./pages/caregiver/CaregiverElderMessages";
import ElderCaregiverMessages from "./pages/elder/ElderCaregiverMessages";

import HealthcareProfessionalMessages from "./pages/familemember/HealthcareProfessionalMessages";
import HealthProfessionalFamilyMessages from "./pages/healthproffesional/FamilyMessages";

// Import admin related
import AdminUsers from "./pages/admin/users";
import AdminSettings from "./pages/admin/settings"; 
import AdminReports from "./pages/admin/reports";
import LandingPage from './pages/LandingPage';

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
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/consultation/:meetingId" element={<VirtualMeetingRoom />} />
          <Route path="/meeting/:meetingId" element={<JitsiMeetingRoom />} />
          <Route path="/generate-meeting" element={<MeetingGenerator />} />
          <Route path="/test-meeting/:meetingId" element={<TestMeeting />} />
          <Route path="/patient-join/:meetingId" element={<PatientMeetingJoin />} />

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
            path="/family-member/book-healthcare-appointment/:elderId/:counselorId"
            element={
              <ProtectedRoute allowedRoles={["family_member"]}>
                <HealthcareProfessionalAppointment />
              </ProtectedRoute>
            }
          />

          {/* New healthcare professional appointment routes matching doctor system */}
          <Route
            path="/family-member/physical-healthcare-appointment/:elderId/:counselorId"
            element={
              <ProtectedRoute allowedRoles={["family_member"]}>
                <PhysicalHealthcareProfessionalAppointment />
              </ProtectedRoute>
            }
          />

          <Route
            path="/family-member/online-healthcare-appointment/:elderId/:counselorId"
            element={
              <ProtectedRoute allowedRoles={["family_member"]}>
                <OnlineHealthcareProfessionalAppointment />
              </ProtectedRoute>
            }
          />

          <Route
            path="/family-member/elder/:elderId/healthcare-booking-summary/:counselorId"
            element={
              <ProtectedRoute allowedRoles={["family_member"]}>
                <HealthcareProfessionalBookingSummary />
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

          <Route
  path="/family-member/cancel-appointment"
  element={
    <ProtectedRoute allowedRoles={["family_member"]}>
      <CancelAppointment />
    </ProtectedRoute>
  }
/>

<Route
  path="/family-member/appointment-history"
  element={
    <ProtectedRoute allowedRoles={["family_member"]}>
      <AppointmentHistory />
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
            path="/family-member/reports"
            element={
              <ProtectedRoute allowedRoles={["family_member"]}>
                <FamilyMemberReports />
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

{/* Healthcare professional payment routes */}
<Route path="/family-member/healthcare-payment" element={
  <ProtectedRoute allowedRoles={['family_member']}>
    <HealthcarePayment />
  </ProtectedRoute>
} />

<Route path="/family-member/healthcare-payment-success" element={
  <ProtectedRoute allowedRoles={['family_member']}>
    <HealthcarePaymentSuccess />
  </ProtectedRoute>
} />

{/* NEW: Caregiver booking flow routes */}
<Route path="/family-member/elder-caregivers" element={
  <ProtectedRoute allowedRoles={['family_member']}>
    <FamilyMemberElderCaregivers />
  </ProtectedRoute>
} />

<Route path="/family-member/elder/:elderId/caregivers-list" element={
  <ProtectedRoute allowedRoles={['family_member']}>
    <CaregiversByDistrict />
  </ProtectedRoute>
} />

<Route path="/family-member/elder/:elderId/caregiver-booking/:caregiverId" element={
  <ProtectedRoute allowedRoles={['family_member']}>
    <CaregiverBooking />
  </ProtectedRoute>
} />

<Route path="/family-member/caregiver-booking-summary" element={
  <ProtectedRoute allowedRoles={['family_member']}>
    <CaregiverBookingSummary />
  </ProtectedRoute>
} />

<Route path="/family-member/caregiver-payment" element={
  <ProtectedRoute allowedRoles={['family_member']}>
    <CaregiverPayment />
  </ProtectedRoute>
} />

<Route path="/family-member/caregiver-payment-success" element={
  <ProtectedRoute allowedRoles={['family_member']}>
    <CaregiverPaymentSuccess />
  </ProtectedRoute>
} />

<Route path="/family-member/caregiver-bookings" element={
  <ProtectedRoute allowedRoles={['family_member']}>
    <CaregiverBookings />
  </ProtectedRoute>
} />

<Route path="/family-member/todays-care-report" element={
  <ProtectedRoute allowedRoles={['family_member']}>
    <TodaysCareReport />
  </ProtectedRoute>
} />

<Route path="/family-member/elder/:elderId/care-schedule" element={
  <ProtectedRoute allowedRoles={['family_member']}>
    <ElderCareSchedule />
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

          <Route path="/doctor/messages" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorMessages2 />
            </ProtectedRoute>
          } />

          <Route path="/doctor/elder-chat" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <ElderChat />
            </ProtectedRoute>
          } />

          <Route path="/doctor/appointments" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <TodaysAppointments />
            </ProtectedRoute>
          } />

          <Route path="/doctor/schedule" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorSchedule />
            </ProtectedRoute>
          } />

          <Route path="/doctor/patients" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorPatients />
            </ProtectedRoute>
          } />

          <Route path="/doctor/reports" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorReports />
            </ProtectedRoute>
          } />
                    <Route path="/doctor/reports" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorReports />
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
            path="/healthprofessional/messages"
            element={
              <ProtectedRoute allowedRoles={["healthprofessional"]}>
                <HealthProfessionalElderMessages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/healthprofessional/family-messages"
            element={
              <ProtectedRoute allowedRoles={["healthprofessional"]}>
                <HealthProfessionalFamilyMessages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/healthprofessional/reports"
            element={
              <ProtectedRoute allowedRoles={["healthprofessional"]}>
                <HealthProfessionalReports />
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
            path="/caregiver/care-requests"
            element={
              <ProtectedRoute allowedRoles={["caregiver"]}>
                <CareRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/caregiver/care-request/:requestId"
            element={
              <ProtectedRoute allowedRoles={["caregiver"]}>
                <CareRequestDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/caregiver/profile"
            element={
              <ProtectedRoute allowedRoles={["caregiver"]}>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/caregiver/carelog"
            element={
              <ProtectedRoute allowedRoles={["caregiver"]}>
                <Carelogs />
              </ProtectedRoute>
            }
          />



          <Route
            path="/caregiver/elders"
            element={
              <ProtectedRoute allowedRoles={["caregiver"]}>
                <ViewAllElders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/caregiver/elder/:elderId"
            element={
              <ProtectedRoute allowedRoles={["caregiver"]}>
                <Elder />
              </ProtectedRoute>
            }
          />

          <Route
            path="/caregiver/family-member-messages"
            element={
              <ProtectedRoute allowedRoles={["caregiver"]}>
                <FamilyMemberMessages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/caregiver/elder-messages"
            element={
              <ProtectedRoute allowedRoles={["caregiver"]}>
                <CaregiverElderMessages />
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
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminReports />
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
            path="/elder/sessions"
            element={
              <ProtectedRoute allowedRoles={["elder"]}>
                <AllSessions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/elder/session/:sessionId"
            element={
              <ProtectedRoute allowedRoles={["elder"]}>
                <SessionDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/elder/caregivers"
            element={
              <ProtectedRoute allowedRoles={["elder"]}>
                <ElderCaregivers />
              </ProtectedRoute>
            }
          />

          <Route
  path="/family-member/doctor-messages"
  element={
    <ProtectedRoute allowedRoles={["family_member"]}>
      <DoctorMessages />
    </ProtectedRoute>
  }
/>

          <Route
  path="/family-member/caregiver-chat"
  element={
    <ProtectedRoute allowedRoles={["family_member"]}>
      <CaregiverMessages />
    </ProtectedRoute>
  }
/>

          <Route
  path="/family-member/elder-messages"
  element={
    <ProtectedRoute allowedRoles={["family_member"]}>
      <ElderMessages />
    </ProtectedRoute>
  }
/>

          <Route
  path="/family-member/healthcare-professional-messages"
  element={
    <ProtectedRoute allowedRoles={["family_member"]}>
      <HealthcareProfessionalMessages />
    </ProtectedRoute>
  }
/>

          <Route
            path="/elder/family-chat"
            element={
              <ProtectedRoute allowedRoles={["elder"]}>
                <FamilyMessages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/elder/doctor-chat"
            element={
              <ProtectedRoute allowedRoles={["elder"]}>
                <ElderDoctorMessages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/elder/counselor-chat"
            element={
              <ProtectedRoute allowedRoles={["elder"]}>
                <CounselorMessages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/elder/caregiver-messages"
            element={
              <ProtectedRoute allowedRoles={["elder"]}>
                <ElderCaregiverMessages />
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
