import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import x52201 from "../../components/images/5220-1.jpg";
import group41 from "../../components/images/group41.png";
import group3984 from "../../components/images/group3984.jpg";
import group from "../../components/images/group.jpg";
import image1 from "../../components/images/image-1.jpg";
import image from "../../components/images/image.jpg";
import line133 from "../../components/images/line-133.jpg";
import styles from "../../components/css/healthprofessional/signup.module.css";
import { Link } from "react-router-dom";

export const HealthProfessionalRegStep2 = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    areaOfSpecification: '',
    licenseRegistrationNumber: '',
    yearOfExperience: '',
    currentInstitutions: '',
    professionalCredentials: null
  });

  // Add error states
  const [errors, setErrors] = useState({
    licenseRegistrationNumber: '',
    professionalCredentials: ''
  });

  // License/Registration validation function
  const validateLicenseRegistration = (license) => {
    const licenseRegex = /^PSY-\d{5}-SL$/;
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
      [name]: ''
    }));

    // Real-time validation
    if (name === 'licenseRegistrationNumber' && value) {
      if (!validateLicenseRegistration(value)) {
        setErrors(prev => ({
          ...prev,
          licenseRegistrationNumber: 'License/Registration must be in format PSY-12345-SL'
        }));
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      professionalCredentials: file
    }));

    // Clear previous error
    setErrors(prev => ({
      ...prev,
      professionalCredentials: ''
    }));

    // Validate file
    if (file) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        setErrors(prev => ({
          ...prev,
          professionalCredentials: validation.message
        }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const newErrors = {};
    
    if (!validateLicenseRegistration(formData.licenseRegistrationNumber)) {
      newErrors.licenseRegistrationNumber = 'License/Registration must be in format PSY-12345-SL';
    }
    
    if (formData.professionalCredentials) {
      const fileValidation = validateFile(formData.professionalCredentials);
      if (!fileValidation.isValid) {
        newErrors.professionalCredentials = fileValidation.message;
      }
    }

    // If there are errors, set them and don't submit
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    console.log('Step 2 form submitted:', formData);
    
    // Store form data in localStorage for use in step 3
    localStorage.setItem('healthProfessionalStep2Data', JSON.stringify({
      ...formData,
      professionalCredentials: formData.professionalCredentials ? formData.professionalCredentials.name : null
    }));
    
    // Navigate to step 3
    navigate('/healthproffesional/signup-step3');
  };

  // Load saved data if returning from step 3
  useEffect(() => {
    const savedStep2Data = localStorage.getItem('healthProfessionalStep2Data');
    if (savedStep2Data) {
      const parsedData = JSON.parse(savedStep2Data);
      setFormData(prev => ({
        ...prev,
        ...parsedData,
        professionalCredentials: null // Reset file input
      }));
    }
  }, []);

  return (
    <div className={styles.doctorReg}>
      <div className={styles.bg}>
        <div className={styles.leftSection}>
          <img className={styles.mainImage} alt="Health Professional Care" src={image1} />
          <div className={styles.welcomeText}>
            <h1 className={styles.welcomeTitle}>Welcome to SilverCare!</h1>
            <p className={styles.welcomeDescription}>
              Join our community of professional mental health experts.
              <br /> 
              Create your health professional account to connect with families,
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
                      <option value="Clinical Psychology">Clinical Psychology</option>
                      <option value="Counseling Psychology">Counseling Psychology</option>
                      <option value="Child Psychology">Child Psychology</option>
                      <option value="Geriatric Psychology">Geriatric Psychology</option>
                      <option value="Neuropsychology">Neuropsychology</option>
                      <option value="Health Psychology">Health Psychology</option>
                      <option value="Behavioral Therapy">Behavioral Therapy</option>
                      <option value="Cognitive Behavioral Therapy">Cognitive Behavioral Therapy</option>
                      <option value="Family Therapy">Family Therapy</option>
                      <option value="Group Therapy">Group Therapy</option>
                      <option value="Addiction Counseling">Addiction Counseling</option>
                      <option value="Trauma Counseling">Trauma Counseling</option>
                      <option value="Marriage Counseling">Marriage Counseling</option>
                      <option value="Art Therapy">Art Therapy</option>
                      <option value="Music Therapy">Music Therapy</option>
                      <option value="Occupational Therapy">Occupational Therapy</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>License/Registration Number</label>
                  <div className={styles.inputContainer}>
                    <img className={styles.inputIcon} alt="License icon" src={group} />
                    <input
                      type="text"
                      name="licenseRegistrationNumber"
                      value={formData.licenseRegistrationNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., PSY-45678-SL"
                      className={`${styles.formInput} ${errors.licenseRegistrationNumber ? styles.error : ''}`}
                      pattern="PSY-\d{5}-SL"
                      title="Please enter a valid license/registration number (e.g., PSY-45678-SL)"
                      required
                    />
                  </div>
                  {errors.licenseRegistrationNumber && <span className={styles.errorMessage}>{errors.licenseRegistrationNumber}</span>}
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
                      placeholder="e.g., National Institute of Mental Health"
                      className={styles.formInput}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Upload Professional Credentials</label>
                  <div className={styles.inputContainer}>
                    <img className={styles.inputIcon} alt="Upload icon" src={group41} />
                    <input
                      type="file"
                      name="professionalCredentials"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className={`${styles.formInput} ${errors.professionalCredentials ? styles.error : ''}`}
                    />
                  </div>
                  {errors.professionalCredentials && <span className={styles.errorMessage}>{errors.professionalCredentials}</span>}
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
                onClick={() => navigate('/healthproffesional/signup')}
              >
                <span className={styles.buttonText}>Back to Step 1</span>
              </button>

              <button type="submit" className={styles.primaryBtn}>
                <span className={styles.buttonText}>Next step</span>
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
