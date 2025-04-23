const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const schedule = require('node-schedule');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Verbindung
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('MongoDB Verbindungsfehler:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  currentChallenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    default: null
  },
  notificationTime: { type: String, default: '09:00' }
});

// Challenge Schema
const challengeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  days: [{
    day: Number,
    task: String,
    completed: { type: Boolean, default: false },
    date: Date
  }],
  startDate: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);
const Challenge = mongoose.model('Challenge', challengeSchema);

// Generiere Challenge mit OpenAI API
async function generateChallenge(topic) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Coach, der 30-Tage-Challenges erstellt.'
          },
          {
            role: 'user',
            content: `Erstelle eine 30-Tage-Challenge zum Thema "${topic}".
                      Gib einen JSON-Array zurück mit genau 30 Objekten, jedes mit dem Format:
                      {"day": Nummer, "task": "Aufgabenbeschreibung"}.
                      Die Aufgaben sollten progressiv aufeinander aufbauen.`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extrahiere JSON aus der Antwort
    const content = response.data.choices[0].message.content;
    const jsonStartIndex = content.indexOf('[');
    const jsonEndIndex = content.lastIndexOf(']') + 1;
    const jsonStr = content.substring(jsonStartIndex, jsonEndIndex);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Fehler bei der OpenAI API:', error);
    throw new Error('Challenge konnte nicht generiert werden');
  }
}

// API Endpunkte
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Prüfe, ob Username bereits existiert
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Benutzername bereits vergeben' });
    }

    // Hash Passwort
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Erstelle neuen User
    const user = new User({
      username,
      password: hashedPassword
    });

    await user.save();

    // Erstelle Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, userId: user._id });
  } catch (error) {
    console.error('Registrierungsfehler:', error);
    res.status(500).json({ message: 'Serverfehler bei der Registrierung' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Suche User
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Ungültiger Benutzername oder Passwort' });
    }

    // Überprüfe Passwort
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Ungültiger Benutzername oder Passwort' });
    }

    // Erstelle Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ token, userId: user._id });
  } catch (error) {
    console.error('Login-Fehler:', error);
    res.status(500).json({ message: 'Serverfehler beim Login' });
  }
});

// Auth Middleware
function auth(req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'Zugriff verweigert. Kein Token vorhanden.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Ungültiger Token.' });
  }
}

app.post('/api/challenges', auth, async (req, res) => {
  try {
    const { topic } = req.body;
    const userId = req.user.id;

    // Prüfe, ob Nutzer bereits eine aktive Challenge hat
    const user = await User.findById(userId);
    if (user.currentChallenge) {
      const currentChallenge = await Challenge.findById(user.currentChallenge);

      // Wenn Challenge nicht abgeschlossen, ablehnen
      if (currentChallenge && !currentChallenge.completed) {
        return res.status(400).json({
          message: 'Du hast bereits eine aktive Challenge',
          challengeId: currentChallenge._id
        });
      }
    }

    // Generiere Aufgaben mit ChatGPT
    const tasks = await generateChallenge(topic);

    // Bereite Tage vor
    const startDate = new Date();
    const days = tasks.map((task, index) => {
      const taskDate = new Date(startDate);
      taskDate.setDate(startDate.getDate() + index);
      return {
        day: task.day,
        task: task.task,
        completed: false,
        date: taskDate
      };
    });

    // Erstelle neue Challenge
    const challenge = new Challenge({
      userId,
      topic,
      days,
      startDate
    });

    await challenge.save();

    // Update User mit aktueller Challenge
    await User.findByIdAndUpdate(userId, { currentChallenge: challenge._id });

    // Plane Benachrichtigungen
    scheduleNotifications(user, challenge);

    res.status(201).json(challenge);
  } catch (error) {
    console.error('Fehler beim Erstellen der Challenge:', error);
    res.status(500).json({ message: 'Serverfehler beim Erstellen der Challenge' });
  }
});

app.get('/api/challenges/current', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user.currentChallenge) {
      return res.status(404).json({ message: 'Keine aktive Challenge gefunden' });
    }

    const challenge = await Challenge.findById(user.currentChallenge);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge nicht gefunden' });
    }

    res.status(200).json(challenge);
  } catch (error) {
    console.error('Fehler beim Abrufen der Challenge:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Challenge' });
  }
});

app.patch('/api/challenges/day/:day', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { day } = req.params;
    const { completed } = req.body;

    const user = await User.findById(userId);
    if (!user.currentChallenge) {
      return res.status(404).json({ message: 'Keine aktive Challenge gefunden' });
    }

    const challenge = await Challenge.findById(user.currentChallenge);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge nicht gefunden' });
    }

    // Update Tag-Status
    const dayIndex = challenge.days.findIndex(d => d.day === parseInt(day));
    if (dayIndex === -1) {
      return res.status(404).json({ message: 'Tag nicht gefunden' });
    }

    challenge.days[dayIndex].completed = completed;
    await challenge.save();

    // Prüfe, ob Challenge abgeschlossen ist
    const allCompleted = challenge.days.every(day => {
      const dayDate = new Date(day.date);
      const today = new Date();
      return day.completed || dayDate > today;
    });

    const pastDue = challenge.days.every(day => {
      const dayDate = new Date(day.date);
      const today = new Date();
      return dayDate < today;
    });

    if (pastDue || allCompleted) {
      challenge.completed = true;
      await challenge.save();
    }

    res.status(200).json(challenge);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Tages:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Tages' });
  }
});

app.patch('/api/users/notification-time', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationTime } = req.body;

    await User.findByIdAndUpdate(userId, { notificationTime });

    // Plane Benachrichtigungen neu
    const user = await User.findById(userId);
    if (user.currentChallenge) {
      const challenge = await Challenge.findById(user.currentChallenge);
      if (challenge && !challenge.completed) {
        scheduleNotifications(user, challenge);
      }
    }

    res.status(200).json({ message: 'Benachrichtigungszeit aktualisiert' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Benachrichtigungszeit:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren der Benachrichtigungszeit' });
  }
});

// Benachrichtigungsfunktion
function scheduleNotifications(user, challenge) {
  const [hours, minutes] = user.notificationTime.split(':').map(Number);

  challenge.days.forEach(day => {
    const dayDate = new Date(day.date);
    dayDate.setHours(hours, minutes, 0);

    if (dayDate > new Date()) {
      schedule.scheduleJob(dayDate, async () => {
        // Hier würde die Push-Benachrichtigung gesendet werden
        // Für eine reale Anwendung müsste man Push-Notifications oder E-Mail-Service einbinden
        console.log(`Benachrichtigung für ${user.username}: Tag ${day.day} - ${day.task}`);
      });
    }
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
