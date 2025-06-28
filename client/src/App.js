import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserPage from './pages/UserPage';
import { FamilyMemberReg } from './pages/familemember/signup';
import { FamilyMemberReg2 } from './pages/familemember/signup-step2';
import FamilyMemberDashboard from './pages/familemember/dashboard';
import { CaregiverReg } from './pages/caregiver/signup';
import { CaregiverRegStep2 } from './pages/caregiver/signup-step2';
import CaregiverDashboard from './pages/caregiver/dashboard';
import AdminDashboard from './pages/admin/dashboard';
import { DoctorReg } from './pages/doctor/signup';
import { MentalHealthProfessionalReg } from './pages/healthproffesional/signup';
import { DoctorRegStep2 } from './pages/doctor/signup-step2';
import { DoctorRegStep3  } from './pages/doctor/signup-step3';
import DoctorDashboard from './pages/doctor/dashboard';
import { Login } from './pages/login';
import { Roles } from './pages/roles';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={< Roles  />} />
        <Route path="/roles" element={< Roles  />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/family-member/signup" element={<FamilyMemberReg />} />
        <Route path="/family-member/signup-step2" element={<FamilyMemberReg2 />} />
        <Route path="/family-member/dashboard" element={<FamilyMemberDashboard />} />
         <Route path="/doctor/signup" element={<DoctorReg  />} />
         <Route path="/doctor/signup-step2" element={<DoctorRegStep2  />} />
         <Route path="/doctor/signup-step3" element={<DoctorRegStep3  />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
         <Route path="/healthproffesional/signup" element={<MentalHealthProfessionalReg />} />
        <Route path="/caregiver/signup" element={<CaregiverReg />} />
        <Route path="/caregiver/signup-step2" element={<CaregiverRegStep2 />} />
        <Route path="/caregiver/dashboard" element={<CaregiverDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/users" element={<UserPage />} />
      </Routes>
    </Router>
  );
}

export default App;
