import React from "react";
import "./DashboardPage.css";

function DashboardPage() {
  return (
    <div className="dashboard-container">
      <nav className="dashboard-navbar">
        <div className="logo">SilvererCare</div>
        <div className="nav-links">
          <button className="active">Dashboard</button>
          <button>Patients</button>
          <button>Sessions</button>
          <button>Resources</button>
          <button>Messages</button>
        </div>
        <div className="profile">
          <img
            src="https://randomuser.me/api/portraits/women/44.jpg"
            alt="profile"
            className="profile-pic"
          />
          <span>Dr. Sarah Johnson</span>
        </div>
      </nav>
      <main>
        <h2>Mental Health Dashboard</h2>
        <p className="subtitle">
          Manage your elderly patients’ mental wellness and consultations
        </p>
        <div className="dashboard-cards">
          <div className="card">
            <div className="card-title">Active Patients</div>
            <div className="card-value">24</div>
          </div>
          <div className="card">
            <div className="card-title">Today's Sessions</div>
            <div className="card-value">6</div>
          </div>
          <div className="card">
            <div className="card-title">Pending Approvals</div>
            <div className="card-value">3</div>
          </div>
          <div className="card">
            <div className="card-title">New Messages</div>
            <div className="card-value">8</div>
          </div>
        </div>
        <div className="dashboard-main">
          <div className="dashboard-left">
            <section className="section">
              <h3>Today's Sessions</h3>
              <div className="session-list">
                <div className="session-card">
                  <img
                    src="https://randomuser.me/api/portraits/women/65.jpg"
                    alt="Margaret"
                  />
                  <div>
                    <div className="session-name">Margaret Thompson</div>
                    <div className="session-info">
                      10:00 AM – Virtual Session
                    </div>
                  </div>
                  <button className="join">Join</button>
                  <button className="reschedule">Reschedule</button>
                </div>
                <div className="session-card">
                  <img
                    src="https://randomuser.me/api/portraits/men/32.jpg"
                    alt="Robert"
                  />
                  <div>
                    <div className="session-name">Robert Chen</div>
                    <div className="session-info">
                      2:00 PM – In-person Session
                    </div>
                  </div>
                  <button className="notes">View Notes</button>
                  <button className="reschedule">Reschedule</button>
                </div>
                <div className="session-card">
                  <img
                    src="https://randomuser.me/api/portraits/women/68.jpg"
                    alt="Eleanor"
                  />
                  <div>
                    <div className="session-name">Eleanor Davis</div>
                    <div className="session-info">
                      4:30 PM – Virtual Session
                    </div>
                  </div>
                  <button className="join">Join</button>
                  <button className="reschedule">Reschedule</button>
                </div>
              </div>
            </section>
            <section className="section">
              <h3>Recent Patient Activity</h3>
              <ul className="activity-list">
                <li>
                  <span className="icon mood"></span>
                  Margaret Thompson logged mood: Anxious
                  <span className="time">2 hours ago</span>
                </li>
                <li>
                  <span className="icon med"></span>
                  Robert Chen completed medication reminder
                  <span className="time">4 hours ago</span>
                </li>
                <li>
                  <span className="icon walk"></span>
                  Eleanor Davis completed daily walk activity
                  <span className="time">6 hours ago</span>
                </li>
              </ul>
            </section>
          </div>
          <div className="dashboard-right">
            <section className="section">
              <h3>Pending Approvals</h3>
              <div className="approval-card urgent">
                <div>
                  <div className="approval-name">James Wilson</div>
                  <div className="approval-info">
                    Requesting emergency session
                  </div>
                </div>
                <div>
                  <button className="approve">Approve</button>
                  <button className="decline">Decline</button>
                </div>
                <span className="tag urgent">Urgent</span>
              </div>
              <div className="approval-card routine">
                <div>
                  <div className="approval-name">Mary Johnson</div>
                  <div className="approval-info">
                    Session rescheduling request
                  </div>
                </div>
                <div>
                  <button className="approve">Approve</button>
                  <button className="decline">Decline</button>
                </div>
                <span className="tag routine">Routine</span>
              </div>
            </section>
            <section className="section">
              <h3>Quick Actions</h3>
              <div className="quick-actions">
                <button className="quick blue">Start Virtual Session</button>
                <button className="quick green">Add New Patient</button>
                <button className="quick orange">Create Report</button>
                <button className="quick purple">Send Message</button>
              </div>
            </section>
            <section className="section">
              <h3>Recent Messages</h3>
              <ul className="messages-list">
                <li>
                  <img
                    src="https://randomuser.me/api/portraits/men/45.jpg"
                    alt="Dr. Michael Brown"
                  />
                  <div>
                    <div className="msg-name">Dr. Michael Brown</div>
                    <div className="msg-text">
                      Patient update needed for Margaret
                    </div>
                    <span className="msg-time">1 hour ago</span>
                  </div>
                </li>
                <li>
                  <img
                    src="https://randomuser.me/api/portraits/women/46.jpg"
                    alt="Lisa Chen"
                  />
                  <div>
                    <div className="msg-name">Lisa Chen</div>
                    <div className="msg-text">
                      Thank you for the session notes
                    </div>
                    <span className="msg-time">3 hours ago</span>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
