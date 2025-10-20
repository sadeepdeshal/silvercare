const API_BASE = 'http://localhost:5000/api/feedback';

export const feedbackApi = {

    getAllFeedback: async () => {
        try {
            console.log("Fetching all feedback ");
            const response = await fetch(`${API_BASE}/`);
            const data = await response.json();
            console.log("Feedback data received:", data);
            
            if(!response.ok) {
                throw new Error(data.message || 'Failed to fetch feedback');
            }
            
            return data;
        }
        catch (error) {
            console.error("API: Error fetching feedback:", error);
            throw error;
        }
    },
}; 
export default feedbackApi;