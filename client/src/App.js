import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserPage from './pages/UserPage';
import { FamilyMemberReg } from './pages/familemember/signup';
import { FamilyMemberReg2 } from './pages/familemember/signup-step2';
import ElderSignup from './pages/familemember/elder-signup';
import FamilyMemberDashboard from './pages/familemember/dashboard';
import FamilyMemberElders from './pages/familemember/elders'; // Add this import
import ElderDetails from './pages/familemember/elder-details';
import CaregiverDetails from './pages/familemember/caregiver-details';
import FamilyMemberLayout from './components/FamilyMemberLayout';
import { CaregiverReg } from './pages/caregiver/signup';
import { CaregiverRegStep2 } from './pages/caregiver/signup-step2';
import CaregiverDashboard from './pages/caregiver/dashboard';
import AdminDashboard from './pages/admin/dashboard';
import { DoctorReg } from './pages/doctor/signup';
import { MentalHealthProfessionalReg } from './pages/healthproffesional/signup';
import { HealthProfessionalRegStep2 } from './pages/healthproffesional/signup-step2';
import { HealthProfessionalRegStep3 } from './pages/healthproffesional/signup-step3';
import HealthProfessionalDashboard from './pages/healthproffesional/dashboard';
import { DoctorRegStep2 } from './pages/doctor/signup-step2';
import { DoctorRegStep3  } from './pages/doctor/signup-step3';
import DoctorDashboard from './pages/doctor/dashboard';
import ElderDashboard from './pages/elder/dashboard';
import { Login } from './pages/login';
import { Roles } from './pages/roles';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Optional: Create an Unauthorized component
const Unauthorized = () => (
  <div style={{ textAlign: 'center', padding: '50px' }}>
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
          <Route path="/family-member/signup-step2" element={<FamilyMemberReg2 />} />
          <Route 
            path="/family-member/elder-signup" 
            element={
              <ProtectedRoute allowedRoles={['family_member']}>
                <ElderSignup />
              </ProtectedRoute>
            } 
          />
          <Route path="/doctor/signup" element={<DoctorReg />} />
          <Route path="/doctor/signup-step2" element={<DoctorRegStep2 />} />
          <Route path="/doctor/signup-step3" element={<DoctorRegStep3 />} />
          <Route path="/healthproffesional/signup" element={<MentalHealthProfessionalReg />} />
          <Route path="/healthproffesional/signup-step2" element={<HealthProfessionalRegStep2 />} />
          <Route path="/healthproffesional/signup-step3" element={<HealthProfessionalRegStep3 />} />
          <Route path="/caregiver/signup" element={<CaregiverReg />} />
          <Route path="/caregiver/signup-step2" element={<CaregiverRegStep2 />} />
          
                    {/* Family Member Routes with Layout - All protected routes use the layout */}
          <Route path="/family-member/elder-signup" element={
            <ProtectedRoute allowedRoles={['family_member']}>
              <FamilyMemberLayout>
                <ElderSignup />
              </FamilyMemberLayout>
            </ProtectedRoute>
          } />


          {/* Protected Dashboard Routes - Authentication required */}
          <Route path="/family-member/dashboard" element={
            <ProtectedRoute allowedRoles={['family_member']}>
              <FamilyMemberDashboard />
            </ProtectedRoute>
          } />

          {/* Add the elders route */}
          <Route path="/family-member/elders" element={
            <ProtectedRoute allowedRoles={['family_member']}>
              <FamilyMemberElders />
            </ProtectedRoute>
          } />

          <Route path="/family-member/elder/:elderId" element={
            <ProtectedRoute allowedRoles={['family_member']}>
              <ElderDetails />
            </ProtectedRoute>
          } />
          
          <Route path="/doctor/dashboard" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } />
          
          {/* Fix the health professional route - change from healthproffesional to healthprofessional */}
          <Route path="/healthprofessional/dashboard" element={
            <ProtectedRoute allowedRoles={['healthprofessional']}>
              <HealthProfessionalDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/caregiver/dashboard" element={
            <ProtectedRoute allowedRoles={['caregiver']}>
              <CaregiverDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/elder/dashboard" element={
            <ProtectedRoute allowedRoles={['elder']}>
              <ElderDashboard />
            </ProtectedRoute>
          } />

          <Route path="/family-member/caregivers" element={
  <ProtectedRoute allowedRoles={['family_member']}>
    <CaregiverDetails />
  </ProtectedRoute>
} />
          
          {/* Other Protected Routes */}
          <Route path="/users" element={
            <ProtectedRoute>
              <UserPage />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;