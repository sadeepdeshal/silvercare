import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import HealthProfessionalSidebar from '../../components/HealthProfessionalSidebar';
import axios from 'axios';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const calculateAge = (dob) => {
  if (!dob) return 'N/A';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const AppointmentDetails = () => {
  const { currentUser } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allSessionData, setAllSessionData] = useState([]); // Store all sessions from API
  const [sessionData, setSessionData] = useState([]); // Filtered sessions to display
  const [pagination, setPagination] = useState({ total: 0, limit: 10, offset: 0, hasMore: false });
  const [errorMessage, setErrorMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [counselorId, setCounselorId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState(''); // New state for search query

  useEffect(() => {
    const fetchCounselorId = async () => {
      setLoading(true);
      const storedUser = localStorage.getItem('silvercare_user');
      if (!storedUser) {
        setErrorMessage('No user data found in local storage');
        setLoading(false);
        return;
      }

      const userData = JSON.parse(storedUser);
      if (!userData.user_id || userData.role !== 'healthprofessional') {
        setErrorMessage('Invalid user data or role in local storage');
        setLoading(false);
        return;
      }

      try {
        const token = userData.token;
        const response = await axios.get(`http://localhost:5000/api/healthprofessional/counselor-id/${userData.user_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to fetch counselor_id');
        }

        setCounselorId(response.data.counselor_id.toString());
      } catch (err) {
        console.error('Error fetching counselor_id:', err);
        setErrorMessage(err.message || 'Failed to load counselor details');
      } finally {
        setLoading(false);
      }
    };

    fetchCounselorId();
  }, []);

  useEffect(() => {
    if (counselorId) {
      fetchSessionDetails();
    }
  }, [counselorId, statusFilter, currentPage, limit]); // Removed searchQuery from dependency

  const fetchSessionDetails = async () => {
    try {
      const storedUser = localStorage.getItem('silvercare_user');
      const token = storedUser ? JSON.parse(storedUser).token : null;
      const offset = (currentPage - 1) * limit;
      const url = `http://localhost:5000/api/healthprofessional/counselors/${counselorId}/sessions?status=${statusFilter}&limit=${limit}&offset=${offset}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch session details');
      }

      // Filter sessions to ensure they match the logged-in user's counselorId (optional safety check)
      const filteredSessions = Array.isArray(response.data.sessions) 
        ? response.data.sessions.filter(session => session.counselor_id.toString() === counselorId)
        : [];
      setAllSessionData(filteredSessions); // Store all sessions
      setSessionData(filteredSessions.slice(offset, offset + limit)); // Set initial filtered data
      setPagination(response.data.pagination || { total: response.data.sessions.length || 0, limit, offset, hasMore: (offset + limit) < (response.data.sessions.length || 0) });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching session details:', err);
      setErrorMessage(err.message || 'Failed to load session details');
      setLoading(false);
    }
  };

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    const offset = (newPage - 1) * limit;
    setSessionData(allSessionData.slice(offset, offset + limit)); // Update displayed data based on page
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search
    const offset = 0;
    const filteredData = allSessionData.filter(session =>
      session.elder_name.toLowerCase().includes(query) || session.session_id.toString().includes(query)
    );
    setSessionData(filteredData.slice(offset, offset + limit)); // Filter and paginate
    setPagination({ total: filteredData.length, limit, offset, hasMore: (offset + limit) < filteredData.length });
  };
