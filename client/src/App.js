import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserPage from './pages/UserPage';
import { FamilyMemberReg } from './pages/familemember/signup';
import { FamilyMemberReg2 } from './pages/familemember/signup-step2';
import ElderSignup from './pages/familemember/elder-signup';
import FamilyMemberDashboard from './pages/familemember/dashboard';
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
           <Route path="/family-member/elder-signup" element={<ElderSignup />} />
          <Route path="/doctor/signup" element={<DoctorReg />} />
          <Route path="/doctor/signup-step2" element={<DoctorRegStep2 />} />
          <Route path="/doctor/signup-step3" element={<DoctorRegStep3 />} />
          <Route path="/healthproffesional/signup" element={<MentalHealthProfessionalReg />} />
          <Route path="/healthproffesional/signup-step2" element={<HealthProfessionalRegStep2 />} />
          <Route path="/healthproffesional/signup-step3" element={<HealthProfessionalRegStep3 />} />
          <Route path="/caregiver/signup" element={<CaregiverReg />} />
          <Route path="/caregiver/signup-step2" element={<CaregiverRegStep2 />} />
          
          {/* Protected Dashboard Routes - Authentication required */}
          <Route path="/family-member/dashboard" element={
            <ProtectedRoute allowedRoles={['family_member']}>
              <FamilyMemberDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/doctor/dashboard" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/healthproffesional/dashboard" element={
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
