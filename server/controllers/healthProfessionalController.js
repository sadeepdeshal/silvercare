const db = require('../db');

exports.getByUserId = async (req, res) => {
  const userId = req.params.userId;
  // TODO: Replace with real DB lookup
  // Placeholder data for demonstration
  const hp = {
    user_id: userId,
    name: 'Demo Health Professional',
    email: 'demo@healthpro.com',
    phone: '1234567890',
    specialization: 'Mental Health',
    license_number: 'HP-12345',
    alternative_number: '0987654321',
    current_institution: 'SilverCare Clinic',
    proof: '',
    years_experience: 5,
    status: 'approved',
    district: 'Colombo',
    created_at: new Date().toISOString()
  };
  res.json({ healthprofessional: hp });
};

// Get appointment statistics for health professional
exports.getAppointmentStatistics = async (req, res) => {
  try {
    const counselorId = req.params.counselorId;
    
    console.log('Fetching appointment statistics for counselor ID:', counselorId);
    
    // Get appointment counts by type
    const statsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN appointment_type = 'online' THEN 1 ELSE 0 END), 0) as online,
        COALESCE(SUM(CASE WHEN appointment_type = 'physical' THEN 1 ELSE 0 END), 0) as physical,
        COALESCE(COUNT(*), 0) as total
      FROM counselor_appointment 
      WHERE counselor_id = $1 
      AND status IN ('completed', 'confirmed')
    `;
    
    const result = await db.query(statsQuery, [counselorId]);
    
    console.log('Raw stats result:', result.rows);
    
    const stats = result.rows[0] || { online: 0, physical: 0, total: 0 };
    
    // Convert to numbers to ensure proper calculation
    const statsResponse = {
      online: parseInt(stats.online) || 0,
      physical: parseInt(stats.physical) || 0,
      total: parseInt(stats.total) || 0
    };
    
    console.log('Processed stats response:', statsResponse);
    
    res.json(statsResponse);
  } catch (error) {
    console.error('Error fetching counselor appointment statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch appointment statistics',
      details: error.message 
    });
  }
}; 