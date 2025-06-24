import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserPage from './pages/UserPage';
import { FamilyMemberReg } from './pages/familemember/signup';
import { FamilyMemberReg2 } from './pages/familemember/signup-step2';
import FamilyMemberDashboard from './pages/familemember/dashboard';
import { CaregiverReg } from './pages/caregiver/signup';
import { CaregiverRegStep2 } from './pages/caregiver/signup-step2';
import CaregiverDashboard from './pages/caregiver/dashboard';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CaregiverReg />} />
        <Route path="/family-member/signup" element={<FamilyMemberReg />} />
        <Route path="/family-member/signup-step2" element={<FamilyMemberReg2 />} />
        <Route path="/family-member/dashboard" element={<FamilyMemberDashboard />} />
        <Route path="/caregiver/signup" element={<CaregiverReg />} />
        <Route path="/caregiver/signup-step2" element={<CaregiverRegStep2 />} />
        <Route path="/caregiver/dashboard" element={<CaregiverDashboard />} />
        <Route path="/users" element={<UserPage />} />
      </Routes>
    </Router>
  );
}

export default App;
