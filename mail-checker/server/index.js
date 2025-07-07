const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const dns = require('dns').promises;

dotenv.config();

const app = express();
const PORT = 5076;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Check mail endpoint
app.post('/api/check-mail', async (req, res) => {
  const { email, password, host, port = 993, tls = true } = req.body;

  if (!email || !password || !host) {
    return res.status(400).json({ error: 'Email, password, and host are required' });
  }

  const imap = new Imap({
    user: email,
    password: password,
    host: host,
    port: port,
    tls: tls,
    tlsOptions: { rejectUnauthorized: false }
  });

  try {
    await new Promise((resolve, reject) => {
      imap.once('ready', resolve);
      imap.once('error', reject);
      imap.connect();
    });

    const messages = await new Promise((resolve, reject) => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) return reject(err);

        const messages = [];
        const fetchCount = Math.min(box.messages.total, 20); // Fetch last 20 messages
        
        if (fetchCount === 0) {
          return resolve(messages);
        }

        const f = imap.seq.fetch(`${Math.max(1, box.messages.total - fetchCount + 1)}:*`, {
          bodies: '',
          struct: true
        });

        f.on('message', (msg) => {
          const message = { id: null, attributes: null };
          
          msg.on('body', (stream) => {
            simpleParser(stream, async (err, parsed) => {
              if (!err && parsed) {
                message.parsed = {
                  from: parsed.from?.text || '',
                  subject: parsed.subject || '',
                  date: parsed.date || new Date(),
                  text: parsed.text || '',
                  html: parsed.html || ''
                };
              }
            });
          });

          msg.once('attributes', (attrs) => {
            message.attributes = attrs;
          });

          msg.once('end', () => {
            if (message.parsed) {
              messages.push({
                uid: message.attributes.uid,
                date: message.parsed.date,
                from: message.parsed.from,
                subject: message.parsed.subject,
                preview: message.parsed.text ? 
                  message.parsed.text.substring(0, 100) + '...' : 
                  'No preview available',
                flags: message.attributes.flags
              });
            }
          });
        });

        f.once('error', reject);
        f.once('end', () => {
          imap.end();
          resolve(messages.sort((a, b) => new Date(b.date) - new Date(a.date)));
        });
      });
    });

    res.json({
      success: true,
      mailCount: messages.length,
      messages: messages
    });

  } catch (error) {
    console.error('Mail check error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check mail'
    });
  }
});

// Get mail providers endpoint
app.get('/api/providers', (req, res) => {
  const providers = [
    { name: 'Gmail', host: 'imap.gmail.com', port: 993, tls: true },
    { name: 'Outlook/Hotmail', host: 'outlook.office365.com', port: 993, tls: true },
    { name: 'Yahoo', host: 'imap.mail.yahoo.com', port: 993, tls: true },
    { name: 'iCloud', host: 'imap.mail.me.com', port: 993, tls: true },
    { name: 'AOL', host: 'imap.aol.com', port: 993, tls: true },
    { name: 'Zoho', host: 'imap.zoho.com', port: 993, tls: true }
  ];
  
  res.json(providers);
});

// Validate email endpoint
app.post('/api/validate-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Extract domain from email
  const domain = email.split('@')[1];
  
  if (!domain) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Check MX records
    const mxRecords = await dns.resolveMx(domain);
    
    res.json({
      success: true,
      email: email,
      domain: domain,
      hasMxRecords: mxRecords && mxRecords.length > 0,
      mxRecords: mxRecords.map(record => ({
        exchange: record.exchange,
        priority: record.priority
      })).sort((a, b) => a.priority - b.priority)
    });
  } catch (error) {
    res.json({
      success: false,
      email: email,
      domain: domain,
      hasMxRecords: false,
      error: error.code === 'ENOTFOUND' ? 'Domain not found' : 'MX record lookup failed'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Mail checker API server running on port ${PORT}`);
});