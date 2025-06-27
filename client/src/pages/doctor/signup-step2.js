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
    medicalCredentials: ''
  });

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
      [name]: ''
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
      medicalCredentials: ''
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

  const handleSubmit = (e) => {
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
      setErrors(newErrors);
      return;
    }
    
    console.log('Step 2 form submitted:', formData);
    
    // Store form data in localStorage for use in step 3
    localStorage.setItem('doctorStep2Data', JSON.stringify({
      ...formData,
      medicalCredentials: formData.medicalCredentials ? formData.medicalCredentials.name : null
    }));
    
    // Navigate to step 3
    navigate('/doctor/signup-step3');
  };

  // Load saved data if returning from step 3
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
  }, []);

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
