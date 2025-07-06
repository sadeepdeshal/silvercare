const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // Important: for parsing JSON body

// Load user routes
const userRoutes = require('./routes/userRoutes');
<<<<<<< Updated upstream
app.use('/api/users', userRoutes); // Mount the full route
=======
const registerRoutes = require('./routes/registerRoutes');
const authRoutes = require('./routes/authRoutes'); // Add this line
const elderRoutes = require('./routes/elderRoutes'); // Add this line
const doctorRoutes = require('./routes/doctorRoutes'); // Indipa Added this line
app.use('/api/users', userRoutes); // Mount the full route
app.use('/api/register', registerRoutes);
app.use('/api/auth', authRoutes); // Add this line
app.use('/api/elders', elderRoutes);
//Indipa Added this line
app.use('/api/doctor',doctorRoutes);//Indipa added this
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
