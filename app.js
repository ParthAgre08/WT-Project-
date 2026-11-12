const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Middleware to parse incoming JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Extract 'from' and 'to' places from spoken query text
 */
function extractPlaces(text) {
  let cleaned = text.toLowerCase().trim();

  const phrases = [
    "i want to go",
    "i want to travel",
    "i need to go",
    "book a bus",
    "please book a bus",
    "please"
  ];

  for (const phrase of phrases) {
    cleaned = cleaned.replace(phrase, "");
  }

  // FIX: Remove leading and trailing spaces
  cleaned = cleaned.trim();

  // Remove "from"
  cleaned = cleaned.replace(/^from\s+/, "");

  // Split using "to"
  const parts = cleaned.split(/\s+to\s+/);

  if (parts.length !== 2) {
    return {
      from: null,
      to: null
    };
  }

  return {
    from: parts[0].trim(),
    to: parts[1].trim()
  };
}

// Home route
app.get('/', (req, res) => {
  res.render('index', { from: '', to: '', spokenText: '' });
});

// GET route: receives spoken text from frontend, extracts from & to places, and passes data to index.ejs
app.get(['/find-buses', '/findbuses'], (req, res) => {
  const spokenText = req.query.query || req.query.text || '';

  console.log('[FIND BUSES ROUTE (GET)] Spoken Text Received:');
  console.log(`"${spokenText}"`);

  const places = extractPlaces(spokenText);
  console.log('[EXTRACTED PLACES]:', places);

  res.render('index', {
    from: places.from || '',
    to: places.to || '',
    spokenText: spokenText
  });
});

// POST route: handles search buses form submission (from search buses button)
app.post(['/find-buses', '/findbuses'], (req, res) => {
  const from = req.body.from || '';
  const to = req.body.to || '';

  console.log('[FIND BUSES ROUTE (POST)] Search Buses Request:');
  console.log(`From: "${from}", To: "${to}"`);

  // Searching logic will be implemented later
  res.send(`Search request received for buses: From "${from}" to "${to}"`);
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
