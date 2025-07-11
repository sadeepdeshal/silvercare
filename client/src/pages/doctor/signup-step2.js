import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import x52201 from "../../components/images/5220-1.jpg";
import group41 from "../../components/images/group41.png";
import group3984 from "../../components/images/group3984.jpg";
import group from "../../components/images/group.jpg";
import image1 from "../../components/images/image-1.jpg";
import image from "../../components/images/image.jpg";
import line133 from "../../components/images/line-133.jpg";
import styles from "../../components/css/doctor/signup.module.css";
import { Link } from "react-router-dom";
import { registerDoctor } from "../../services/registerApi"; // Make sure this exists

export const DoctorRegStep2 = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    areaOfSpecification: '',
    medicalLicenseNumber: '',
    yearOfExperience: '',
    currentInstitutions: '',
    medicalCredentials: null
  });

  // Add error states
  const [errors, setErrors] = useState({
    medicalLicenseNumber: '',
    medicalCredentials: '',
    submit: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  // Add state to store and display the generated password
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Medical license validation function
  const validateMedicalLicense = (license) => {
    const licenseRegex = /^SLMC\/\d{5}$/;
    return licenseRegex.test(license);
  };

  // File validation function
  const validateFile = (file) => {
    if (!file) return true; // Optional field
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, message: 'Please upload a PDF, JPG, or PNG file' };
    }
    
    if (file.size > maxSize) {
      return { isValid: false, message: 'File size must be less than 5MB' };
    }
    
    return { isValid: true };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear previous error when user starts typing
    setErrors(prev => ({
      ...prev,
      [name]: '',
      submit: ''
    }));

    // Real-time validation
    if (name === 'medicalLicenseNumber' && value) {
      if (!validateMedicalLicense(value)) {
        setErrors(prev => ({
          ...prev,
          medicalLicenseNumber: 'Medical license must be in format SLMC/12345'
        }));
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      medicalCredentials: file
    }));

    // Clear previous error
    setErrors(prev => ({
      ...prev,
      medicalCredentials: '',
      submit: ''
    }));

    // Validate file
    if (file) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        setErrors(prev => ({
          ...prev,
          medicalCredentials: validation.message
        }));
      }
    }
  };

  // Generate a random strong password
  const generateTempPassword = () => {
    // 12 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+-=<>?";
    const all = upper + lower + numbers + special;
    let password = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      special[Math.floor(Math.random() * special.length)]
    ];
    for (let i = 4; i < 12; i++) {
      password.push(all[Math.floor(Math.random() * all.length)]);
    }
    return password.sort(() => Math.random() - 0.5).join('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const newErrors = {};
    
    if (!validateMedicalLicense(formData.medicalLicenseNumber)) {
      newErrors.medicalLicenseNumber = 'Medical license must be in format SLMC/12345';
    }
    
    if (formData.medicalCredentials) {
      const fileValidation = validateFile(formData.medicalCredentials);
      if (!fileValidation.isValid) {
        newErrors.medicalCredentials = fileValidation.message;
      }
    }

    // If there are errors, set them and don't submit
    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }

    setIsSubmitting(true);

    try {
      // Get all stored data from previous step
      const step1Data = JSON.parse(localStorage.getItem('doctorStep1Data') || '{}');
      if (!step1Data.name || !step1Data.email) {
        setErrors(prev => ({
          ...prev,
          submit: 'Missing information from previous step. Please start registration again.'
        }));
        setIsSubmitting(false);
        return;
      }

      // Prepare form data for API
      const tempPassword = generateTempPassword();
      // Store the password in state to display it
      setGeneratedPassword(tempPassword);
      
      // Show the password in console for debugging
      console.log('Generated temporary password:', tempPassword);

      // If you need to send file, use FormData, else send as JSON
      let apiData;
      let isMultipart = false;
      if (formData.medicalCredentials) {
        apiData = new FormData();
        apiData.append('name', step1Data.name);
        apiData.append('email', step1Data.email);
        apiData.append('phone', step1Data.phone);
        apiData.append('alternativeNumber', step1Data.alternativeNumber || '');
        apiData.append('district', step1Data.district || '');
        apiData.append('areaOfSpecification', formData.areaOfSpecification);
        apiData.append('medicalLicenseNumber', formData.medicalLicenseNumber);
        apiData.append('yearOfExperience', formData.yearOfExperience);
        apiData.append('currentInstitutions', formData.currentInstitutions);
        apiData.append('medicalCredentials', formData.medicalCredentials);
        apiData.append('password', tempPassword);
        isMultipart = true;
      } else {
        apiData = {
          name: step1Data.name,
          email: step1Data.email,
          phone: step1Data.phone,
          alternativeNumber: step1Data.alternativeNumber || '',
          district: step1Data.district || '',
          areaOfSpecification: formData.areaOfSpecification,
          medicalLicenseNumber: formData.medicalLicenseNumber,
          yearOfExperience: formData.yearOfExperience,
          currentInstitutions: formData.currentInstitutions,
          medicalCredentials: null,
          password: tempPassword
        };
      }

      // Call the API to register the doctor
      await registerDoctor(apiData, isMultipart);

      // Clear localStorage after successful registration
      localStorage.removeItem('doctorStep1Data');
      localStorage.removeItem('doctorStep2Data');

      alert(`Registration successful! Your account is pending approval. Your temporary password is: ${tempPassword}`);

      navigate('/login');
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data?.error || 'Registration failed. Please try again.';
        setErrors(prev => ({
          ...prev,
          submit: errorMessage
        }));
      } else if (error.request) {
        setErrors(prev => ({
          ...prev,
          submit: 'Network error. Please check your connection and try again.'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          submit: 'An unexpected error occurred. Please try again.'
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load saved data if returning from step 1
  useEffect(() => {
    const savedStep2Data = localStorage.getItem('doctorStep2Data');
    if (savedStep2Data) {
      const parsedData = JSON.parse(savedStep2Data);
      setFormData(prev => ({
        ...prev,
        ...parsedData,
        medicalCredentials: null // Reset file input
      }));
    }
    // If step1 data is missing, redirect to step1
    const step1Data = localStorage.getItem('doctorStep1Data');
    if (!step1Data) {
      alert('Please complete Step 1 first.');
      navigate('/doctor/signup');
    }
  }, [navigate]);

  return (
    <div className={styles.doctorReg}>
      <div className={styles.bg}>
        <div className={styles.leftSection}>
          <img className={styles.mainImage} alt="Doctor Care" src={image1} />
          <div className={styles.welcomeText}>
            <h1 className={styles.welcomeTitle}>Welcome to SilverCare!</h1>
            <p className={styles.welcomeDescription}>
              Join our community of professional doctors.
              <br /> 
              Create your doctor account to connect with families,
              seniors, and healthcare professionals — all in one place
            </p>
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Professional Information</h2>
              <img className={styles.welcomeImage} alt="Welcome" src={x52201} />
            </div>

            <form onSubmit={handleSubmit} className={styles.registrationForm}>
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Professional Details</h3>
                <p className={styles.sectionSubtitle}>Please provide your professional information</p>

                {/* Display submit error if any */}
                {errors.submit && (
                  <div className={styles.submitError}>
                    <span className={styles.errorMessage}>{errors.submit}</span>
                  </div>
                )}

                {/* Display generated password if available */}
                {generatedPassword && (
                  <div style={{
                    backgroundColor: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px'
                  }}>
                    <strong>Generated Temporary Password:</strong>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      backgroundColor: '#f8f9fa',
                      padding: '8px',
                      borderRadius: '4px',
                      marginTop: '8px',
                      border: '1px solid #dee2e6'
                    }}>
                      {generatedPassword}
                    </div>
                    <small style={{ color: '#6c757d', fontSize: '12px' }}>
                      Please save this password as it will be used for login.
                    </small>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Area of Specification</label>
                  <div className={styles.inputContainer}>
                    <img className={styles.inputIcon} alt="Specification icon" src={group41} />
                    <select
                      name="areaOfSpecification"
                      value={formData.areaOfSpecification}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      required
                    >
                      <option value="">Select Specialization</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Psychiatry">Psychiatry</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Gynecology">Gynecology</option>
                      <option value="Oncology">Oncology</option>
                      <option value="Ophthalmology">Ophthalmology</option>
                      <option value="ENT">ENT</option>
                      <option value="Radiology">Radiology</option>
                      <option value="Anesthesiology">Anesthesiology</option>
                      <option value="Emergency Medicine">Emergency Medicine</option>
                      <option value="Family Medicine">Family Medicine</option>
                      <option value="Geriatrics">Geriatrics</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Medical License Number</label>
                  <div className={styles.inputContainer}>
                    <img className={styles.inputIcon} alt="License icon" src={group} />
                    <input
                      type="text"
                      name="medicalLicenseNumber"
                      value={formData.medicalLicenseNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., SLMC/12345"
                      className={`${styles.formInput} ${errors.medicalLicenseNumber ? styles.error : ''}`}
                      pattern="SLMC\/\d{5}"
                      title="Please enter a valid medical license number (e.g., SLMC/12345)"
                      required
                    />
                  </div>
                  {errors.medicalLicenseNumber && <span className={styles.errorMessage}>{errors.medicalLicenseNumber}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Years of Experience</label>
                  <div className={styles.inputContainer}>
                    <img className={styles.inputIcon} alt="Experience icon" src={image} />
                    <input
                      type="number"
                      name="yearOfExperience"
                      value={formData.yearOfExperience}
                      onChange={handleInputChange}
                      placeholder="e.g., 5"
                      className={styles.formInput}
                      min="0"
                      max="50"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Current Institutions</label>
                  <div className={styles.inputContainer}>
                    <img className={styles.inputIcon} alt="Institution icon" src={group3984} />
                    <input
                      type="text"
                      name="currentInstitutions"
                      value={formData.currentInstitutions}
                      onChange={handleInputChange}
                      placeholder="e.g., Colombo General Hospital"
                      className={styles.formInput}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Upload Medical Credentials</label>
                  <div className={styles.inputContainer}>
                    <img className={styles.inputIcon} alt="Upload icon" src={group41} />
                    <input
                      type="file"
                      name="medicalCredentials"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className={`${styles.formInput} ${errors.medicalCredentials ? styles.error : ''}`}
                    />
                  </div>
                  {errors.medicalCredentials && <span className={styles.errorMessage}>{errors.medicalCredentials}</span>}
                  <small className={styles.fileNote}>Accept: .pdf, .jpg, .png (Max 5MB)</small>
                </div>
              </div>
              
              <button 
                type="button" 
                className={styles.backBtn}
                style={{
                  backgroundColor: '#f8f9fa',
                  color: '#6c757d',
                  border: '1px solid #dee2e6',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginRight: '12px'
                }}
                onClick={() => navigate('/doctor/signup')}
                disabled={isSubmitting}
              >
                <span className={styles.buttonText}>Back to Step 1</span>
              </button>

              <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
                <span className={styles.buttonText}>
                  {isSubmitting ? 'Registering...' : 'Complete Registration'}
                </span>
              </button>
            </form>

            <div className={styles.formFooter}>
              <p className={styles.loginPrompt}>Do You Have An Account?</p>
              <Link to="/login" className={styles.signInLink}>Log In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};