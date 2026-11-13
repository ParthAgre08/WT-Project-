const express = require('express');
const chrono = require('chrono-node');
const mongoose = require('mongoose');
const Bus = require('./Models/Bus');

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

/**
 * Extract journey date from spoken query text using chrono-node
 */
function extractDate(text) {
  // Step 1: Parse date from the input
  const results = chrono.parse(text, new Date(), {
    forwardDate: true
  });

  // Step 2: Check whether a date was found
  if (results.length === 0) {
    return {
      date: null,
      dateMentioned: false,
      matchedText: null
    };
  }

  // Step 3: Get the first detected date
  const result = results[0];
  const extractedDate = result.start.date();

  // Step 4: Format date as YYYY-MM-DD
  const formattedDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(extractedDate);

  // Step 5: Return extracted information
  return {
    date: formattedDate,
    dateMentioned: true,
    matchedText: result.text
  };
}

// Escape special regex characters
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// Home route
app.get('/', (req, res) => {
  const from = req.query.from || '';
  const to = req.query.to || '';
  const date = req.query.date || '';
  res.render('index', { from, to, date, spokenText: '' });
});

// GET route: receives spoken text from frontend, extracts places & date, and passes data to index.ejs
app.get(['/find-buses', '/findbuses'], (req, res) => {
  const spokenText = req.query.query || req.query.text || '';

  console.log('[FIND BUSES ROUTE (GET)] Spoken Text Received:');
  console.log(`"${spokenText}"`);

  // Extract date
  const dateInfo = extractDate(spokenText);
  console.log('[EXTRACTED DATE]:', dateInfo);

  // Remove matched date text before extracting places (prevents date leaking into destination city)
  const textForPlaces = dateInfo.matchedText
    ? spokenText.replace(dateInfo.matchedText, '').trim()
    : spokenText;

  let places = extractPlaces(textForPlaces);
  if (!places.from && !places.to) {
    places = extractPlaces(spokenText);
  }
  console.log('[EXTRACTED PLACES]:', places);

  res.render('index', {
    from: places.from || '',
    to: places.to || '',
    date: dateInfo.date || '',
    spokenText: spokenText
  });
});

// POST route: handles search buses form submission (from search buses button)
app.post(['/find-buses', '/findbuses'], async (req, res) => {

    const from = (req.body.from || '').trim();
    const to = (req.body.to || '').trim();
    const date = (req.body.date || '').trim();

    try {

        const startOfDay = new Date(`${date}T00:00:00.000Z`);

        const nextDay = new Date(startOfDay);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);

        const query = {
            fromPlace: new RegExp(`^${escapeRegex(from)}$`, 'i'),
            toPlace: new RegExp(`^${escapeRegex(to)}$`, 'i'),

            journeyDate: {
                $gte: startOfDay,
                $lt: nextDay
            },

            availableSeats: { $gt: 0 }
        };

        console.log('[MONGO QUERY]:', query);

        const buses = await Bus.find(query)
            .sort({ departureTime: 1 })
            .lean();

        console.log(`Found ${buses.length} buses`);

        res.render('availaible_buses', {
            buses,
            from,
            to,
            date,
            error: null
        });

    } catch (err) {

        console.error('MongoDB Search Error:', err);

        res.render('availaible_buses', {
            buses: [],
            from,
            to,
            date,
            error: 'Unable to fetch buses from database'
        });
    }
});



const db_path = "mongodb://127.0.0.1:27017/msrtc_bus_booking_system";

mongoose.connect(db_path).then(() => {
    console.log("Connected to Mongo");
    app.listen(3002, () => {
        console.log("Server Running on Post http://localhost:3002 ");
    })
}).catch(err => {
    console.log("Error while connecting to the MongoDb")
})
