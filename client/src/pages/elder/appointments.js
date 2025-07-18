import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/navbar";
import {
  getElderDetailsByEmail,
  getAllAppointments,
  cancelAppointment,
  joinAppointment,
} from "../../services/elderApi2";
import styles from "../../components/css/elder/appointments.module.css";

const AllAppointments = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [elderDetails, setElderDetails] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter and search states
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 6;

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get elder details first
        const elderResponse = await getElderDetailsByEmail(currentUser.email);
        setElderDetails(elderResponse.data);

        // Then fetch all appointments
        if (elderResponse.data?.elder_id) {
          const appointmentsResponse = await getAllAppointments(elderResponse.data.elder_id);
          setAppointments(appointmentsResponse.data.appointments || []);
          setFilteredAppointments(appointmentsResponse.data.appointments || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.response?.data?.error || "Failed to fetch appointments");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.email) {
      fetchData();
    }
  }, [currentUser.email]);

  // Filter appointments based on status, search, date, and type
  useEffect(() => {
    let filtered = [...appointments];

    // Filter by status
    if (activeFilter !== "all") {
      if (activeFilter === "upcoming") {
        filtered = filtered.filter(
          (apt) => new Date(apt.date_time) > new Date() && apt.status !== "cancelled"
        );
      } else if (activeFilter === "past") {
        filtered = filtered.filter(
          (apt) => new Date(apt.date_time) < new Date() || apt.status === "completed"
        );
      } else if (activeFilter === "cancelled") {
        filtered = filtered.filter((apt) => apt.status === "cancelled");
      }
    }

    // Filter by search term (doctor name or specialization)
    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          apt.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter(
        (apt) => apt.date_time.split("T")[0] === dateFilter
      );
    }

    // Filter by appointment type
    if (typeFilter !== "all") {
      filtered = filtered.filter((apt) => apt.appointment_type === typeFilter);
    }

    setFilteredAppointments(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [appointments, activeFilter, searchTerm, dateFilter, typeFilter]);

  // Pagination logic
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(
    indexOfFirstAppointment,
    indexOfLastAppointment
  );
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      await cancelAppointment(elderDetails.elder_id, appointmentId);
      
      // Refresh appointments
      const appointmentsResponse = await getAllAppointments(elderDetails.elder_id);
      setAppointments(appointmentsResponse.data.appointments || []);
      
      alert("Appointment cancelled successfully");
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Failed to cancel appointment");
    }
  };

  const handleJoinAppointment = async (appointmentId) => {
    try {
      const response = await joinAppointment(elderDetails.elder_id, appointmentId);
      if (response.data.success) {
        window.open(response.data.meetingLink, '_blank');
      }
    } catch (error) {
      console.error("Error joining appointment:", error);
      alert(error.response?.data?.error || "Failed to join appointment");
    }
  };

  const clearFilters = () => {
    setActiveFilter("all");
    setSearchTerm("");
    setDateFilter("");
    setTypeFilter("all");
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClass = (status, dateTime) => {
    if (status === "cancelled") return styles.statusCancelled;
    if (status === "completed") return styles.statusCompleted;
    if (new Date(dateTime) < new Date()) return styles.statusPast;
    return styles.statusUpcoming;
  };

  const getStatusText = (status, dateTime) => {
    if (status === "cancelled") return "Cancelled";
    if (status === "completed") return "Completed";
    if (new Date(dateTime) < new Date()) return "Past";
    return "Upcoming";
  };

  const canCancelAppointment = (appointment) => {
    if (appointment.status === "cancelled" || appointment.status === "completed") return false;
    return new Date(appointment.date_time) > new Date();
  };

  const getTimeRemaining = (dateString) => {
    if (!dateString) return { text: "N/A", urgent: false, detail: "" };
    const now = new Date();
    const appointmentDate = new Date(dateString);
    const diffTime = appointmentDate - now;

    if (diffTime < 0) return { text: "Past due", urgent: false, detail: "" };

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 7) return { text: `${diffDays} days`, urgent: false, detail: "More than a week away" };
    if (diffDays > 1) return { text: `${diffDays} days`, urgent: false, detail: `${diffHours} hours remaining` };
    if (diffHours > 2) return { text: `${diffHours} hours`, urgent: true, detail: "Today" };
    if (diffHours > 0) return { text: `${diffHours}h ${diffMinutes % 60}m`, urgent: true, detail: "Very soon!" };
    if (diffMinutes > 0) return { text: `${diffMinutes} minutes`, urgent: true, detail: "Starting soon!" };
    return { text: "Now", urgent: true, detail: "Time to join!" };
  };

  const isUpcomingAppointment = (appointment) => {
    return new Date(appointment.date_time) > new Date() && appointment.status !== "cancelled";
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your appointments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Error Loading Appointments</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryBtn}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      
      <div className={styles.contentContainer}>
        {/* Summary Stats - moved to top */}
        <div className={styles.summaryStats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <h4>Total Appointments</h4>
              <p>{appointments.length}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏰</div>
            <div className={styles.statContent}>
              <h4>Upcoming</h4>
              <p>{appointments.filter(apt => new Date(apt.date_time) > new Date() && apt.status !== "cancelled").length}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statContent}>
              <h4>Completed</h4>
              <p>{appointments.filter(apt => apt.status === "completed").length}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>❌</div>
            <div className={styles.statContent}>
              <h4>Cancelled</h4>
              <p>{appointments.filter(apt => apt.status === "cancelled").length}</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className={styles.filtersContainer}>
          <div className={styles.filtersHeader}>
            <h2>All Appointments</h2>
            <button 
              onClick={() => navigate("/elder/dashboard")}
              className={styles.backBtn}
            >
              ← Back to Dashboard
            </button>
          </div>
          
          <div className={styles.filtersContent}>
            <div className={styles.filtersRow}>
              {/* Status Filter */}
              <div className={styles.filterGroup}>
                <label>Filter by Status:</label>
                <div className={styles.statusFilters}>
                  {[
                    { key: "all", label: "All", count: appointments.length },
                    { key: "upcoming", label: "Upcoming", count: appointments.filter(apt => new Date(apt.date_time) > new Date() && apt.status !== "cancelled").length },
                    { key: "past", label: "Past", count: appointments.filter(apt => new Date(apt.date_time) < new Date() || apt.status === "completed").length },
                    { key: "cancelled", label: "Cancelled", count: appointments.filter(apt => apt.status === "cancelled").length }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      className={`${styles.filterBtn} ${
                        activeFilter === filter.key ? styles.activeFilter : ""
                      }`}
                      onClick={() => setActiveFilter(filter.key)}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.filtersRow}>
              {/* Search */}
              <div className={styles.filterGroup}>
                <label>Search:</label>
                <input
                  type="text"
                  placeholder="Search by doctor name or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              {/* Date Filter */}
              <div className={styles.filterGroup}>
                <label>Filter by Date:</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className={styles.dateInput}
                />
              </div>

              {/* Type Filter */}
              <div className={styles.filterGroup}>
                <label>Filter by Type:</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={styles.selectInput}
                >
                  <option value="all">All Types</option>
                  <option value="online">Online</option>
                  <option value="physical">Physical</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className={styles.filterGroup}>
                <button onClick={clearFilters} className={styles.clearBtn}>
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className={styles.resultsInfo}>
          <p>
            Showing {currentAppointments.length} of {filteredAppointments.length} appointments
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>

        {/* Appointments Grid */}
        <div className={styles.appointmentsGrid}>
          {currentAppointments.length > 0 ? (
            currentAppointments.map((appointment) => (
              <div key={appointment.appointment_id} className={styles.appointmentCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.doctorInfo}>
                    <div className={styles.doctorAvatar}>👨‍⚕️</div>
                    <div className={styles.doctorDetails}>
                      <h3>Dr. {appointment.doctor_name}</h3>
                      <p className={styles.specialization}>{appointment.specialization}</p>
                      <p className={styles.institution}>{appointment.current_institution}</p>
                    </div>
                  </div>
                  <div className={styles.statusContainer}>
                    <span className={getStatusBadgeClass(appointment.status, appointment.date_time)}>
                      {getStatusText(appointment.status, appointment.date_time)}
                    </span>
                  </div>
                </div>

                <div className={styles.appointmentDetails}>
                  <div className={styles.appointmentMeta}>
                    <div className={styles.dateTimeGroup}>
                      <div className={styles.dateInfo}>
                        <span className={styles.dateText}>{formatDate(appointment.date_time)}</span>
                      </div>
                      <div className={styles.timeInfo}>
                        <span className={styles.timeText}>{formatTime(appointment.date_time)}</span>
                      </div>
                    </div>
                    <div className={styles.typeIndicator}>
                      <span className={`${styles.typeChip} ${
                        appointment.appointment_type === 'online' 
                          ? styles.onlineChip 
                          : styles.physicalChip
                      }`}>
                        {appointment.appointment_type === 'online' ? 'Online' : 'Physical'}
                      </span>
                    </div>
                  </div>
                  
                  {isUpcomingAppointment(appointment) && (
                    <div className={styles.timeRemainingBanner}>
                      <div className={`${styles.timeRemainingContent} ${
                        getTimeRemaining(appointment.date_time).urgent ? styles.urgent : styles.normal
                      }`}>
                        <div className={styles.timeRemainingLabel}>Starts in</div>
                        <div className={styles.timeRemainingValue}>
                          {getTimeRemaining(appointment.date_time).text}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className={styles.cardActions}>
                  {appointment.appointment_type === 'online' && isUpcomingAppointment(appointment) && (
                    <button
                      onClick={() => handleJoinAppointment(appointment.appointment_id)}
                      className={styles.joinBtn}
                    >
                      🎥 Join Meeting
                    </button>
                  )}
                  {canCancelAppointment(appointment) && (
                    <button
                      onClick={() => handleCancelAppointment(appointment.appointment_id)}
                      className={styles.cancelBtn}
                    >
                      ❌ Cancel
                    </button>
                  )}
                  <button 
                    onClick={() => navigate(`/elder/appointment/${appointment.appointment_id}`)}
                    className={styles.detailsBtn}
                  >
                    📋 View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noAppointments}>
              <div className={styles.noAppointmentsIcon}>📅</div>
              <h3>No Appointments Found</h3>
              <p>
                {searchTerm || dateFilter || typeFilter !== "all" || activeFilter !== "all"
                                    ? "No appointments match your current filters. Try adjusting your search criteria."
                  : "You don't have any appointments yet. Book your first appointment to get started."}
              </p>
              {(searchTerm || dateFilter || typeFilter !== "all" || activeFilter !== "all") && (
                <button onClick={clearFilters} className={styles.clearFiltersBtn}>
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={styles.paginationBtn}
            >
              ← Previous
            </button>
            
            <div className={styles.paginationNumbers}>
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`${styles.paginationNumber} ${
                        currentPage === pageNumber ? styles.activePage : ""
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (
                  pageNumber === currentPage - 2 ||
                  pageNumber === currentPage + 2
                ) {
                  return <span key={pageNumber} className={styles.paginationDots}>...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={styles.paginationBtn}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllAppointments;

