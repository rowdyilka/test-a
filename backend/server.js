// server.js - Backend Server for Authentication System
// Run with: node server.js

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['https://rowdyilka.github.io', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// In-memory database (replace with real database in production)
const users = [];
const sessions = new Map();

// Email configuration - REPLACE WITH YOUR CREDENTIALS
const emailTransporter = nodemailer.createTransport({
  service: 'gmail', // or 'sendgrid', 'mailgun', etc.
  auth: {
    user: 'your-email@gmail.com', // Your email
    pass: 'your-app-password'      // App password (not regular password)
  }
});

// Alternative: Using SendGrid (recommended for production)
/*
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('YOUR_SENDGRID_API_KEY');
*/

// Utility: Generate 6-digit code
function generate2FACode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Utility: Generate mnemonic
function generateMnemonic() {
  const words = ['apple', 'banana', 'cherry', 'dragon', 'elephant', 'forest', 
                 'guitar', 'harmony', 'island', 'jungle', 'kingdom', 'lemon', 
                 'mountain', 'nature', 'ocean', 'planet', 'quartz', 'river',
                 'sunset', 'thunder', 'unicorn', 'valley', 'whisper', 'zenith'];
  const phrase = [];
  for (let i = 0; i < 12; i++) {
    phrase.push(words[Math.floor(Math.random() * words.length)]);
  }
  return phrase.join(' ');
}

// Utility: Send email
async function sendEmail(to, subject, text) {
  try {
    // Using nodemailer
    await emailTransporter.sendMail({
      from: 'your-email@gmail.com',
      to: to,
      subject: subject,
      text: text,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
               <h2>${subject}</h2>
               <p>${text}</p>
             </div>`
    });
    
    /* Alternative: Using SendGrid
    await sgMail.send({
      to: to,
      from: 'your-email@gmail.com',
      subject: subject,
      text: text,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
               <h2>${subject}</h2>
               <p>${text}</p>
             </div>`
    });
    */
    
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
}

// API Endpoints

// 1. Check if username or email exists
app.post('/api/check-availability', (req, res) => {
  const { username, email } = req.body;
  
  const usernameExists = users.some(u => u.username === username);
  const emailExists = users.some(u => u.email === email);
  
  res.json({
    usernameAvailable: !usernameExists,
    emailAvailable: !emailExists
  });
});

// 2. Register (simplified - no 2FA)
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  // Check if already exists
  if (users.some(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Generate mnemonic
  const mnemonic = generateMnemonic();
  
  // Create user
  const user = {
    id: crypto.randomBytes(16).toString('hex'),
    username,
    email,
    password: hashedPassword,
    mnemonic,
    createdAt: new Date().toISOString()
  };
  
  users.push(user);
  
  // Send welcome email with mnemonic
  const emailSent = await sendEmail(
    email,
    '🔐 Your EduPortal Recovery Phrase - Save This!',
    `Hi ${username}!\n\nYour account has been created successfully!\n\n🔑 RECOVERY PHRASE (Save this securely!):\n${mnemonic}\n\n⚠️ IMPORTANT:\n- Write this phrase down and store it safely\n- You'll need this if you forget your username or password\n- We cannot recover this phrase for you\n- Never share this with anyone\n\nWelcome to EduPortal!\n\nBest regards,\nThe EduPortal Team`
  );
  
  res.json({ 
    success: true, 
    mnemonic,
    emailSent: emailSent.success,
    message: 'Registration successful. Check your email for your recovery phrase!'
  });
});

// 3. Login
app.post('/api/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  
  // Find user
  const user = users.find(u => 
    u.username === usernameOrEmail || u.email === usernameOrEmail
  );
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Verify password
  const validPassword = await bcrypt.compare(password, user.password);
  
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Create session
  const sessionToken = crypto.randomBytes(32).toString('hex');
  sessions.set(sessionToken, {
    userId: user.id,
    username: user.username,
    createdAt: Date.now()
  });
  
  res.json({ 
    success: true, 
    token: sessionToken,
    username: user.username
  });
});

// 4. Logout
app.post('/api/logout', (req, res) => {
  const { token } = req.body;
  sessions.delete(token);
  res.json({ success: true });
});

// 5. Verify session
app.post('/api/verify-session', (req, res) => {
  const { token } = req.body;
  const session = sessions.get(token);
  
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  
  res.json({ 
    success: true, 
    username: session.username 
  });
});

// 6. Password recovery (using mnemonic)
app.post('/api/recover', (req, res) => {
  const { mnemonic } = req.body;
  
  const user = users.find(u => u.mnemonic === mnemonic);
  
  if (!user) {
    return res.status(404).json({ error: 'Invalid recovery phrase' });
  }
  
  res.json({ 
    success: true, 
    username: user.username,
    email: user.email
  });
});

// 7. Reset password
app.post('/api/reset-password', async (req, res) => {
  const { username, newPassword, mnemonic } = req.body;
  
  const user = users.find(u => 
    u.username === username && u.mnemonic === mnemonic
  );
  
  if (!user) {
    return res.status(404).json({ error: 'Invalid credentials' });
  }
  
  user.password = await bcrypt.hash(newPassword, 10);
  
  res.json({ success: true, message: 'Password reset successful' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Make sure to configure your email settings!`);
});