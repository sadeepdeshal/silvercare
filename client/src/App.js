import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserPage from './pages/UserPage';
import { FamilyMemberReg } from './pages/familemember/signup';
import { FamilyMemberReg2 } from './pages/familemember/signup-step2';
import FamilyMemberDashboard from './pages/familemember/dashboard';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FamilyMemberReg />} />
        <Route path="/family-member/signup" element={<FamilyMemberReg />} />
        <Route path="/family-member/signup-step2" element={<FamilyMemberReg2 />} />
        <Route path="/family-member/dashboard" element={<FamilyMemberDashboard />} />
        <Route path="/users" element={<UserPage />} />
      </Routes>
    </Router>
  );
}

export default App;
