import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminApi';
import Navbar from '../../components/navbar';
import styles from '../../components/css/admin/users.module.css';

const AdminUsers = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  // Role tabs configuration
  const roleTabs = [
    { key: 'all', label: 'All Users',  icon: '👥', color: '#667eea' },
    { key: 'family_member', label: 'Family Members', icon: '👨‍👩‍👧‍👦', color: '#28a745' },
    { key: 'elder', label: 'Elders', icon: '👴', color: '#fd7e14' },
    { key: 'doctor', label: 'Doctors', icon: '👨‍⚕️', color: '#dc3545' },
    { key: 'caregiver', label: 'Caregivers', icon: '🤝', color: '#6f42c1' },
    { key: 'health_professional', label: 'Mental Health', icon: '🧠', color: '#20c997' },
    { key: 'admin', label: 'Admins', icon: '⚙️', color: '#6c757d' }
  ];

  // Protect the route
  useEffect(() => {
    if (loading) return;
    
    if (!isAuthenticated || !currentUser) {
      navigate('/login', { replace: true });
      return;
    }
    
    if (currentUser.role !== 'admin') {
      navigate('/unauthorized', { replace: true });
      return;
    }
  }, [currentUser, isAuthenticated, loading, navigate]);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser || currentUser.role !== 'admin') return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        const response = await adminApi.getAllUsers();
        
        if (response.success) {
          setUsers(response.data || []);
          setFilteredUsers(response.data || []);
        } else {


          setError('Failed to load users data');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users data');
      } finally {
        setDataLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser]);

  // Filter users based on role, search term, and status
  useEffect(() => {
    let filtered = users;

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm)
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => user.status === selectedStatus);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [users, selectedRole, searchTerm, selectedStatus]);

  // Handle role tab click
  const handleRoleTabClick = (roleKey) => {
    setSelectedRole(roleKey);
    setSearchTerm(''); // Clear search when switching roles
    setSelectedStatus('all'); // Reset status filter
  };

  // Get user count for each role
  const getUserCountByRole = (roleKey) => {
    if (roleKey === 'all') return users.length;
    return users.filter(user => user.role === roleKey).length;
  };

  // Handle user status update
  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      const response = await adminApi.updateUserStatus(userId, newStatus);
      
      if (response.success) {
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.user_id === userId ? { ...user, status: newStatus } : user
          )
        );
        alert(`User status updated to ${newStatus}`);
      } else {
        alert('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status');
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await adminApi.deleteUser(userId);
      
      if (response.success) {
        setUsers(prevUsers => prevUsers.filter(user => user.user_id !== userId));
        alert('User deleted successfully');
        setShowUserModal(false);
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Get role icon
  const getRoleIcon = (role) => {
    const roleTab = roleTabs.find(tab => tab.key === role);
    return roleTab ? roleTab.icon : '👤';
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return styles.statusActive;
      case 'inactive': return styles.statusInactive;
      case 'pending': return styles.statusPending;
      case 'suspended': return styles.statusSuspended;
      case 'confirmed': return styles.statusActive;
      default: return styles.statusDefault;
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <h2>Loading...</h2>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className={styles.accessDenied}>
        <h2>Access Denied</h2>
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <div className={styles.usersContainer}>
      <Navbar />
      
      {/* Header Section */}
      <div className={styles.headerSection}>
        <div className={styles.headerContent}>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/admin/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h1 className={styles.pageTitle}>👥 User Management</h1>
          <p className={styles.pageSubtitle}>Manage all registered users in the SilverCare platform</p>
        </div>
      </div>

      {/* Role Tabs Section */}
      <div className={styles.roleTabsSection}>
        <div className={styles.roleTabsContainer}>
          {roleTabs.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.roleTab} ${selectedRole === tab.key ? styles.activeRoleTab : ''}`}
              onClick={() => handleRoleTabClick(tab.key)}
              style={{
                '--tab-color': tab.color,
                borderColor: selectedRole === tab.key ? tab.color : 'transparent',
                backgroundColor: selectedRole === tab.key ? `${tab.color}15` : 'transparent'
              }}
            >
              <span className={styles.roleTabIcon}>{tab.icon}</span>
              <div className={styles.roleTabContent}>
                <span className={styles.roleTabLabel}>{tab.label}</span>
                <span className={styles.roleTabCount}>
                  {dataLoading ? '...' : getUserCountByRole(tab.key)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters Section */}
      <div className={styles.filtersSection}>
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <label htmlFor="statusFilter">Filter by Status:</label>
            <select 
              id="statusFilter"
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="searchInput">Search Users:</label>
            <input
              id="searchInput"
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Current Filter Display */}
        <div className={styles.currentFilterDisplay}>
          <div className={styles.filterSummary}>
            <span className={styles.filterLabel}>
              Showing {filteredUsers.length} {selectedRole === 'all' ? 'users' : roleTabs.find(tab => tab.key === selectedRole)?.label.toLowerCase()}
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedStatus !== 'all' && ` with status "${selectedStatus}"`}
            </span>
          </div>
          
          {(searchTerm || selectedStatus !== 'all') && (
            <button 
              className={styles.clearFiltersButton}
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('all');
              }}
            >
              Clear Filters ✕
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Users Table Section */}
      <div className={styles.tableSection}>
        {dataLoading ? (
          <div className={styles.loadingContent}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading users...</p>
          </div>
        ) : currentUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              {getRoleIcon(selectedRole)}
            </div>
            <h3>No {selectedRole === 'all' ? 'Users' : roleTabs.find(tab => tab.key === selectedRole)?.label} Found</h3>
            <p>
              {searchTerm || selectedStatus !== 'all' 
                ? 'No users match your current filters.' 
                : `No ${selectedRole === 'all' ? 'users' : roleTabs.find(tab => tab.key === selectedRole)?.label.toLowerCase()} are registered yet.`
              }
            </p>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.usersTable}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user) => (
                    <tr key={user.user_id}>
                      <td>
                        <div className={styles.userInfo}>
                          <div className={styles.userAvatar}>
                            {getRoleIcon(user.role)}
                          </div>
                          <div className={styles.userDetails}>
                            <div className={styles.userName}>{user.name}</div>
                            <div className={styles.userEmail}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span 
                          className={styles.roleTag}
                          style={{
                            backgroundColor: `${roleTabs.find(tab => tab.key === user.role)?.color || '#6c757d'}15`,
                            color: roleTabs.find(tab => tab.key === user.role)?.color || '#6c757d',
                            border: `1px solid ${roleTabs.find(tab => tab.key === user.role)?.color || '#6c757d'}30`
                          }}
                        >
                          {user.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className={styles.contactInfo}>
                          <div>📞 {user.phone}</div>
                          {user.alternative_number && (
                            <div className={styles.altPhone}>
                              📱 {user.alternative_number}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusBadgeClass(user.status)}`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.dateInfo}>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.viewButton}
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                          >
                            👁️ View
                          </button>
                          {user.role !== 'admin' && (
                            <select
                              className={styles.statusSelect}
                              value={user.status || 'active'}
                              onChange={(e) => handleStatusUpdate(user.user_id, e.target.value)}
                            >
                              <option value="active">Active</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="pending">Pending</option>
                              <option value="inactive">Inactive</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.paginationButton}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>
                
                <div className={styles.paginationNumbers}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        className={`${styles.paginationNumber} ${currentPage === pageNumber ? styles.activePage : ''}`}
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
                
                <div className={styles.paginationInfo}>
                  Page {currentPage} of {totalPages}
                </div>
                
                <button
                  className={styles.paginationButton}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className={styles.modalOverlay} onClick={() => setShowUserModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{getRoleIcon(selectedUser.role)} User Details</h2>
              <button 
                className={styles.closeButton} 
                onClick={() => setShowUserModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.userDetailGrid}>
                <div className={styles.detailItem}>
                  <label>Name:</label>
                  <span>{selectedUser.name}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Email:</label>
                  <span>{selectedUser.email}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Phone:</label>
                  <span>{selectedUser.phone}</span>
                </div>
                {selectedUser.alternative_number && (
                  <div className={styles.detailItem}>
                    <label>Alternative Phone:</label>
                    <span>{selectedUser.alternative_number}</span>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <label>Role:</label>
                  <span 
                    className={styles.roleTag}
                    style={{
                      backgroundColor: `${roleTabs.find(tab => tab.key === selectedUser.role)?.color || '#6c757d'}15`,
                      color: roleTabs.find(tab => tab.key === selectedUser.role)?.color || '#6c757d',
                      border: `1px solid ${roleTabs.find(tab => tab.key === selectedUser.role)?.color || '#6c757d'}30`
                    }}
                  >
                    {selectedUser.role.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <label>Status:</label>
                  <span className={`${styles.statusBadge} ${getStatusBadgeClass(selectedUser.status)}`}>
                    {selectedUser.status || 'active'}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <label>Joined:</label>
                  <span>{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'N/A'}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>User ID:</label>
                  <span>{selectedUser.user_id}</span>
                </div>
                {selectedUser.district && (
                  <div className={styles.detailItem}>
                    <label>District:</label>
                    <span>{selectedUser.district}</span>
                  </div>
                )}
                {selectedUser.specialization && (
                  <div className={styles.detailItem}>
                    <label>Specialization:</label>
                    <span>{selectedUser.specialization}</span>
                  </div>
                )}
                {selectedUser.license_number && (
                  <div className={styles.detailItem}>
                    <label>License Number:</label>
                    <span>{selectedUser.license_number}</span>
                  </div>
                )}
                {selectedUser.years_experience && (
                  <div className={styles.detailItem}>
                    <label>Years of Experience:</label>
                    <span>{selectedUser.years_experience} years</span>
                  </div>
                )}
                {selectedUser.current_institution && (
                  <div className={styles.detailItem}>
                    <label>Current Institution:</label>
                    <span>{selectedUser.current_institution}</span>
                  </div>
                )}
                {selectedUser.additional_info && (
                  <div className={styles.detailItem}>
                    <label>Additional Info:</label>
                    <span>{selectedUser.additional_info}</span>
                  </div>
                )}
              </div>
              
              {selectedUser.role !== 'admin' && (
                <div className={styles.modalActions}>
                  <div className={styles.statusUpdateSection}>
                    <label htmlFor="modalStatusSelect">Update Status:</label>
                    <select
                      id="modalStatusSelect"
                      className={styles.modalStatusSelect}
                      value={selectedUser.status || 'active'}
                      onChange={(e) => {
                        handleStatusUpdate(selectedUser.user_id, e.target.value);
                        setSelectedUser(prev => ({ ...prev, status: e.target.value }));
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDeleteUser(selectedUser.user_id)}
                  >
                    🗑️ Delete User
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;