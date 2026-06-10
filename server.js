const express = require('express');
const imaps = require('imap-simple');
const twilio = require('twilio');
require('dotenv').config();

const app = express();

app.use(express.urlencoded({ extended: false }));

app.post('/check-email', async (req, res) => {

  const twiml = new twilio.twiml.MessagingResponse();

  try {

    const body = (req.body.Body || '').toLowerCase().trim();

    if (body !== 'check') {
      twiml.message("Send 'check' to read emails 📩");
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    const config = {
      imap: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 10000,
        tlsOptions: {
          rejectUnauthorized: false
        }
      }
    };

    const connection = await imaps.connect(config);

    await connection.openBox('INBOX');

    const messages = await connection.search(
      ['UNSEEN'],
      {
        bodies: ['HEADER.FIELDS (FROM SUBJECT)'],
        markSeen: false
      }
    );

    connection.end();

    if (!messages.length) {
      twiml.message('🎉 No unread emails!');
    } else {

      let reply = `📩 Unread Emails: ${messages.length}\n`;

      messages.slice(-5).reverse().forEach(msg => {

        const header = msg.parts.find(
          p => p.which.includes('HEADER')
        );

        if (header?.body) {
          reply += `\nFrom: ${header.body.from?.[0]}`;
          reply += `\nSubject: ${header.body.subject?.[0]}\n`;
        }
      });

      twiml.message(reply.substring(0, 1500));
    }

    res.type('text/xml');
    res.send(twiml.toString());

  } catch (err) {

    console.error(err);

    twiml.message(
      'Error fetching emails: ' + err.message
    );

    res.type('text/xml');
    res.send(twiml.toString());
  }
});


app.get('/test-imap', async (req, res) => {

  try {

    const config = {
      imap: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 10000,
        tlsOptions: {
          rejectUnauthorized: false
        }
      }
    };

    const connection = await imaps.connect(config);

    await connection.openBox('INBOX');

    connection.end();

    res.send('✅ Gmail login successful');

  } catch (err) {

    console.error(err);

    res.send('❌ ' + err.message);
  }
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});