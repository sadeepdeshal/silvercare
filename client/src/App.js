import React from 'react';
import UserPage from './pages/UserPage';
<<<<<<< Updated upstream
=======
import { FamilyMemberReg } from './pages/familemember/signup';
import { FamilyMemberReg2 } from './pages/familemember/signup-step2';
import ElderSignup from './pages/familemember/elder-signup';
import FamilyMemberDashboard from './pages/familemember/dashboard';
import FamilyMemberElders from './pages/familemember/elders'; // Add this import
import ElderDetails from './pages/familemember/elder-details';

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
>>>>>>> Stashed changes

function App() {
  return <UserPage />;
}

export default App;
