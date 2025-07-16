import React, { useEffect, useState } from 'react';
import Navbar from '../../components/navbar';
import styles from "../../components/css/caregiver/dashboard.module.css";
import CaregiverLayout from '../../components/CaregiverLayout';

const CaregiverDashboard = () => {
  
  // Dummy data
  const dummyElders = [
    { name: "Robert Chen", age: 78, lastVisit: "Today", duration: "3 days", nextMedication: "In 2 hours" },
    { name: "Mery Silva", age: 86, lastVisit: "Yesterday", duration: "1 day", nextMedication: "Completed" },
    { name: "Jhon Davis", age: 76, lastVisit: "1 week ago", duration: "2 days", nextMedication: "Completed" }
  ];

  const dummyActivities = [
    { description: "Prepared Robert's Daily Medical Report", timeAgo: "2 hours ago" },
    { description: "Assigned Doctors", timeAgo: "6 hours ago" },
    { description: "Chatted with Family Member", timeAgo: "8 hours ago" }
  ];

  const dummyMessages = [
    { sender: "Dr. Michael Chen", content: "Please update Margaret's blood pressure readings.", timeAgo: "2 hours ago" },
    { sender: "Lisa Thompson (Family)", content: "Did Margaret take her evening medication?", timeAgo: "6 hours ago" }
  ];

  const dummySchedule = [
    { time: "9:00 AM", title: "Morning Medication" },
    { time: "11:00 AM", title: "Visit Mary Williams - Physical therapy" },
    { time: "2:00 PM", title: "Virtual consultation - Support John Davis" }
  ];

  const dummyAlerts = [
    { id: 1, elder: "Robert Chen", type: "Emergency", status: "Pending" },
    { id: 2, elder: "Mery Silva", type: "Medication Missed", status: "Pending" }
  ];

  const dummyMedReminders = [
    { elder: "Robert Chen", due: "In 2 hours" },
    { elder: "Mary Silva", due: "Completed" }
  ];

  // State assignment
  const [elders, setElders] = useState([]);
  const [activities, setActivities] = useState([]);
  const [messages, setMessages] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [medReminders, setMedReminders] = useState([]);

  useEffect(() => {
    // Load dummy data into state
    setElders(dummyElders);
    setActivities(dummyActivities);
    setMessages(dummyMessages);
    setSchedule(dummySchedule);
    setAlerts(dummyAlerts);
    setMedReminders(dummyMedReminders);
  }, []);

  // Content that will be wrapped by CaregiverLayout
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
          <div className={styles.cardIcon}>🚨</div>
          <div className={styles.cardContent}>
            <p className={styles.cardLabel}>Pending Alerts</p>
            <span className={styles.cardNumber}>{alerts.length}</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>💬</div>
          <div className={styles.cardContent}>
            <p className={styles.cardLabel}>Messages</p>
            <span className={styles.cardNumber}>{messages.length}</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>⏰</div>
          <div className={styles.cardContent}>
            <p className={styles.cardLabel}>Med Reminders</p>
            <span className={styles.cardNumber}>{medReminders.length}</span>
          </div>
        </div>
      </div>

      <div className={styles.dashboardgrid}>
        <section className={styles.recentactivities}>
          <h2>Recent Activities</h2>
          <ul>
            {activities.map((act, i) => (
              <li key={i}>
                <div className={`${styles.activityIcon} ${styles[act.type]}`}>
                  {act.type === 'report' && '📋'}
                  {act.type === 'doctor' && '👨‍⚕️'}
                  {act.type === 'chat' && '💬'}
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityDescription}>{act.description}</div>
                  <div className={styles.activityTime}>{act.timeAgo}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.schedule}>
          <h2>Today's Schedule</h2>
          <ul>
            {schedule.map((item, i) => (
              <li key={i}>
                <span className={styles.time}>{item.time}</span>
                <span className={styles.scheduleTitle}>{item.title}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={styles.recentelders}>
        <h2>Recent Elders</h2>
        <div className={styles.elderlist}>
          {elders.map((elder, i) => (
            <div className={styles.eldercard} key={i}>
              <div className={styles.elderHeader}>
                <div className={styles.elderAvatar}>
                  {elder.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className={styles.elderInfo}>
                  <h4>{elder.name}</h4>
                  <div className={styles.elderAge}>Age {elder.age}</div>
                </div>
              </div>
              <div className={styles.elderDetails}>
                <div className={styles.elderDetail}>
                  <span className={styles.label}>Last Visit :</span>
                  <span className={styles.value}>{elder.lastVisit}</span>
                </div>
                <div className={styles.elderDetail}>
                  <span className={styles.label}>Duration :</span>
                  <span className={styles.value}>{elder.duration}</span>
                </div>
                <div className={styles.elderDetail}>
                  <span className={styles.label}>Next Med :</span>
                  <span className={`${styles.value} ${elder.nextMedication === 'Completed' ? styles.completed : elder.nextMedication.includes('hours') ? styles.urgent : ''}`}>
                    {elder.nextMedication}
                  </span>
                </div>
              </div>
            </div>
          ))}
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



