require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./Config/db');
const router = require('./routes/routes');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ✅ Main Routes
app.use('/api', router);

const PORT = 8080 || process.env.PORT;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to DB', err);
    process.exit(1);
  });
