import React, { useEffect, useState } from 'react';
import Navbar from '../../components/navbar';
//import { useAuth } from '../../context/AuthContext';
import styles from "../../components/css/caregiver/dashboard.module.css";



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

 
  return (
    <div className={styles.dashboard}>
       <Navbar />
      <header className={styles.dashboardheader}>
        <h1>Caregiver Dashboard</h1>
      </header>

      <div className={styles.summarycards}>
        <div className={styles.card}>
          <h3>Assigned Elders</h3>
          <p>{elders.length}</p>
        </div>
        <div className={styles.card}>
          <h3>Pending Alerts</h3>
          <p>{alerts.length}</p>
        </div>
        <div className={styles.card}>
          <h3>Messages</h3>
          <p>{messages.length}</p>
        </div>
        <div className={styles.card}>
          <h3>Med Reminders</h3>
          <p>{medReminders.length}</p>
        </div>
      </div>

      <div className={styles.dashboardgrid}>
        <section className={styles.recentactivities}>
          <h2>Recent Activities</h2>
          <ul>
            {activities.map((act, i) => (
              <li key={i}>
                <span>{act.description}</span>
                <span className={styles.time}>{act.timeAgo}</span>
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
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.recentelders}>
          <h2>Recent Elders</h2>
          <div className={styles.elderlist}>
            {elders.map((elder, i) => (
              <div className={styles.eldercard} key={i}>
                <h4>{elder.name}</h4>
                <p>Age: {elder.age}</p>
                <p>Last Visit: {elder.lastVisit}</p>
                <p>Duration: {elder.duration}</p>
                <p>Next Med: <strong>{elder.nextMedication}</strong></p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.recentmessages}>
          <h2>Recent Messages</h2>
          <ul>
            {messages.map((msg, i) => (
              <li key={i}>
                <strong>{msg.sender}</strong>
                <p>{msg.content}</p>
                <span className={styles.time}>{msg.timeAgo}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default CaregiverDashboard;
