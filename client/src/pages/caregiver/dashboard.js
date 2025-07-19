// dashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar';
import styles from "../../components/css/caregiver/dashboard.module.css";
import CaregiverLayout from '../../components/CaregiverLayout';
import caregiverApi from '../../services/caregiverApi';
import { useAuth } from '../../context/AuthContext';


const CaregiverDashboard = () => {
  const { user } = useAuth(); // <-- pulls from logged-in context
  const navigate = useNavigate();
  const [elders, setElders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [careRequests, setCareRequests] = useState([]);
  const [carelog, setCarelogCount] = useState([]);
  const [families, setFamilies] = useState([]);


  useEffect(() => {
    if (!user || !user.caregiver_id) return;

    const caregiverId = user.caregiver_id;

    // Fetch assigned elders
    caregiverApi.fetchAssignedElders(caregiverId).then((data) => {
      const transformed = data.map((elder) => ({
        name: elder.name,
        age: elder.age,
        duration: elder.duration || "N/A",
        status: elder.status,
        //nextMedication: elder.end_sate === 'Completed' ? 'Completed' : 'In 2 hours',
      }));
      setElders(transformed);
    });
    
    // Fetch assigned families count
    caregiverApi.getAssignedFamiliesCount(caregiverId).then((data) => {
       console.log('Families API response:', data);
       const count = Number(data.count);
      if (!isNaN(count)) {
        const dummyFamilies = Array.from({ length: count }, (_, i) => ({
          elder: `Family ${i + 1}`
        }));
        setFamilies(dummyFamilies);
      } else {
        setFamilies([]);
      }
    });
    
    //Fetch carelog counts
    caregiverApi.getcarelogsCount(caregiverId).then((data) => {
        console.log('Carelog count API response:', data);
        const count = Number(data.count);
        if (!isNaN(count)) {
            setCarelogCount(count);
        } else {
            setCarelogCount(0);
        }
    }).catch(error => {
        console.error('Failed to load carelog count:', error);
        setCarelogCount(0); // Set to 0 on error
    });

    // Fetch care requests for caregiver
    caregiverApi.fetchCareRequests(caregiverId).then((data) => {
      const transformed = data
        .filter(request => request.status === 'pending') // Only show pending requests
        .map((request) => ({
          requestId: request.request_id,
          elderName: request.elder_name,
          elderAge: request.elder_age,
          elderAddress: request.elder_address,
          elderContact: request.elder_contact,
          medicalConditions: request.medical_conditions,
          familyMemberName: request.family_member_name,
          familyMemberPhone: request.family_member_phone,
          familyMemberEmail: request.family_member_email,
          startDate: request.start_date,
          endDate: request.end_date,
          status: request.status,
          duration: request.duration,
          requestDate: request.request_date
        }));
      setCareRequests(transformed);
      console.log("Care Requests Data:", transformed);
    });

    // Dummy data for messages
    setMessages([
      { sender: "Dr. Michael Chen", content: "Please update Margaret's blood pressure readings.", timeAgo: "2 hours ago" },
      { sender: "Lisa Thompson (Family)", content: "Did Margaret take her evening medication?", timeAgo: "6 hours ago" }
    ]);
  }, []);

  const dashboardContent = (
    <div className={styles.dashboard}>
      <div className={styles.summarycards}>
        <div className={styles.card}>
          <div className={styles.cardIcon}>👥</div>
          <div className={styles.cardContent}>
            <p className={styles.cardLabel}>Assigned Elders</p>
            <span className={styles.cardNumber}>{elders.length}</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>👨‍👩‍👧‍👦</div>
          <div className={styles.cardContent}>
            <p className={styles.cardLabel}>Number of Families</p>
            <span className={styles.cardNumber}>{families.length}</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>📝</div> 
          <div className={styles.cardContent}>
            <p className={styles.cardLabel}>No. of Carelogs</p> 
            <span className={styles.cardNumber}>{carelog}</span> 
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>💬</div>
          <div className={styles.cardContent}>
            <p className={styles.cardLabel}>Messages</p>
            <span className={styles.cardNumber}>{messages.length}</span>
          </div>
        </div>

      </div>

      <div className={styles.dashboardgrid}>
        <section className={styles.carerequest}>
          <h2>Care Requests</h2>
          <div className={styles.careRequestsList}>
            {careRequests.length === 0 ? (
              <div className={styles.noCareRequests}>No care requests available.</div>
            ) : (
              careRequests.map((request, i) => (
                <div className={styles.careRequestCard} key={i}>
                  <div className={styles.careRequestHeader}>
                    <div className={styles.requestInfo}>
                      <h3 className={styles.elderName}>{request.elderName}</h3>
                    </div>
                    <div className={`${styles.statusBadge} ${styles[request.status]}`}>
                      {request.status}
                    </div>
                  </div>
                  
                  <div className={styles.careRequestDetails}>
                    <div className={styles.requestDetail}>
                      <span className={styles.label}>Elder Age:</span>
                      <span className={styles.value}>{request.elderAge} years</span>
                    </div>
                    <div className={styles.requestDetail}>
                      <span className={styles.label}>Duration:</span>
                      <span className={styles.value}>
                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={styles.requestDetail}>
                      <span className={styles.label}>Location:</span>
                      <span className={styles.value}>{request.elderAddress}</span>
                    </div>
                    <div className={styles.requestDetail}>
                      <span className={styles.label}>Family Contact:</span>
                      <span className={styles.value}>{request.familyMemberName}</span>
                    </div>
                  </div>

                  <div className={styles.careRequestActions}>
                    <button 
                      className={styles.viewMoreButton}
                      onClick={() => navigate(`/caregiver/care-request/${request.requestId}`)}
                    >
                      View More Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className={styles.recentelders}>
        <h2>Recent Elders</h2>
        <div className={styles.elderlist}>
          {elders.length === 0 ? (
            <p className={styles.noElders}>No elders assigned yet.</p>
          ) : (
            elders.map((elder, i) => (
              <div className={styles.eldercard} key={i}>
                <div className={styles.elderHeader}>
                  <div className={styles.elderAvatar}>
                    {elder.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className={styles.elderInfo}>
                    <h4>{elder.name}</h4>
                    <div className={styles.elderAge}>{elder.age} years old</div>
                  </div>
                </div>
                <div className={styles.elderDetails}>
                  <div className={styles.elderDetail}>
                    <span className={styles.label}>Duration :</span>
                    <span className={styles.value}>{elder.duration}</span>
                  </div>
                  <div className={styles.elderDetail}>
                    <span className={styles.label}>Status :</span>
                      <span className={`${styles.value} ${
                        elder.status === 'completed' ? styles.completedStatus :
                        elder.status === 'ongoing' ? styles.ongoingStatus :
                        elder.status === 'upcoming' ? styles.upcomingStatus : ''
                      }`}>
                        {elder.status}
                      </span>
                    {/*<span className={`${styles.value} ${elder.nextMedication === 'Completed' ? styles.completed : elder.nextMedication.includes('hours') ? styles.urgent : ''}`}>
                      {elder.nextMedication}
                    </span>*/}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.recentmessages}>
        <h2>Recent Messages</h2>
        <ul>
          {messages.map((msg, i) => (
            <li key={i}>
              <div className={styles.messageAvatar}>
                {msg.sender.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div className={styles.messageContent}>
                <div className={styles.messageSender}>{msg.sender}</div>
                <p className={styles.messageText}>{msg.content}</p>
              </div>
              <span className={styles.messageTime}>{msg.timeAgo}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <CaregiverLayout>
        {dashboardContent}
      </CaregiverLayout>
    </>
  );
};

export default CaregiverDashboard;
