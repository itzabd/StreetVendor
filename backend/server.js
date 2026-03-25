require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/zones', require('./routes/zones'));
app.use('/api/blocks', require('./routes/blocks'));
app.use('/api/spots', require('./routes/spots'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/permissions', require('./routes/permissions'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/rent', require('./routes/rent'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'StreetVendor BD API is running' }));
app.get('/', (req, res) => res.json({ message: 'StreetVendor BD API is running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
