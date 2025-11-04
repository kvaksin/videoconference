import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, '../db/database.json');

app.get('/api/meetings', (req, res) => {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  res.json(db.meetings || []);
});

app.post('/api/auth/login', (req, res) => {
  // Dummy login for now
  res.json({ token: 'dummy-token' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
