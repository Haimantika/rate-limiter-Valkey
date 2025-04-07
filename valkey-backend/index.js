require('dotenv').config();
const express = require('express');
const Redis = require('ioredis');
const cors = require('cors');
const fetch = require('node-fetch'); // make sure you have node-fetch installed

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;

// Log Valkey connection info
console.log("VALKEY_HOST:", process.env.VALKEY_HOST);
console.log("VALKEY_PORT:", process.env.VALKEY_PORT);
console.log("VALKEY_PASSWORD:", process.env.VALKEY_PASSWORD ? '✔️ present' : '❌ missing');

// Create Redis (Valkey) client
const redis = new Redis({
  host: process.env.VALKEY_HOST,
  port: Number(process.env.VALKEY_PORT),
  password: process.env.VALKEY_PASSWORD,
  tls: {}, // Required for DigitalOcean Valkey
});

// Health check route
app.get('/api/ping', (req, res) => {
  res.send('pong');
});

// Rate limiter middleware
const rateLimiter = async (req, res, next) => {
  const ip = req.ip || 'global';
  const now = Math.floor(Date.now() / 60); // time window in minutes
  const key = `rate:${ip}:${now}`;
  const limit = 5;

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, 60);
    }
    console.log(`[RateLimit] IP: ${ip} - Count: ${current}`);
    if (current > limit) {
      return res.status(429).send('Rate limit exceeded');
    }
    next();
  } catch (err) {
    console.error('[Redis error]', err);
    res.status(500).send('Redis error');
  }
};

// Chuck Norris joke route (rate limited)
app.get('/api/ping', (req, res) => {
  res.send('pong');
});


// Start server
app.listen(PORT, () => {
  console.log(`✅ API server running on http://localhost:${PORT}`);
});



