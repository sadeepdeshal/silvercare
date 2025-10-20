const pool = require('../db');

const getAllFeedback = async (req, res) => {
    try {
        console.log("Fetching all feedback entries");

        const result = await pool.query('SELECT doctor_id , rating FROM feedback');
        console.log("Feedback entries fetched successfully:", result.rows);

        res.json({
            success: true,
            feedbacks: result.rows
        });

    } catch (error) {
        console.error("Error fetching feedback entries:", error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

module.exports = {
    getAllFeedback
};