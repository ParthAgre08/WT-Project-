const express = require('express');
const chrono = require('chrono-node');
const mongoose = require('mongoose');
const Bus = require('./Models/Bus');
const BusSeatInventory = require('./Models/BusSeatInventory');
const Booking = require('./Models/Booking');

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

// GET route: Seat selection page for a specific bus
// Retrieves bus details from `bus_schedules` and seat inventory from `bus_seat_inventories`
app.get('/select-seats/:busId', async (req, res) => {
    const { busId } = req.params;

    try {
        // Step 1: Validate if busId is a valid MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(busId)) {
            return res.status(400).render('select_seats', {
                bus: null,
                seatInventory: null,
                error: 'Invalid bus ID provided.'
            });
        }

        // Step 2: Fetch bus journey details from `bus_schedules`
        const bus = await Bus.findById(busId).lean();

        // Step 3: Handle case where bus document does not exist
        if (!bus) {
            return res.status(404).render('select_seats', {
                bus: null,
                seatInventory: null,
                error: 'The requested bus schedule could not be found.'
            });
        }

        // Step 4: Fetch the seat inventory from `bus_seat_inventories` using busId
        // We do NOT generate inventories here — the script must be run separately first.
        const seatInventory = await BusSeatInventory.findOne({ busId: bus._id }).lean();

        // Step 5: Handle case where no seat inventory has been generated for this bus
        if (!seatInventory) {
            return res.status(404).render('select_seats', {
                bus,
                seatInventory: null,
                error: 'Seat inventory not found for this bus. Please contact support or run the inventory generation script.'
            });
        }

        // Step 6: Render select_seats.ejs with both bus info and seat inventory
        res.render('select_seats', {
            bus,
            seatInventory,
            error: null
        });

    } catch (err) {
        console.error('Error fetching bus for seat selection:', err);
        res.status(500).render('select_seats', {
            bus: null,
            seatInventory: null,
            error: 'An error occurred while loading the seat selection page.'
        });
    }
});



// POST route: Confirm seat booking
// Called when user clicks "Continue Booking" on the seat selection page.
// 1. Validates the selected seats are still available.
// 2. Creates a new Booking document in `bookings`.
// 3. Marks the booked seats in `bus_seat_inventories` as "booked".
// 4. Decrements `availableSeats` on the bus schedule.
// 5. Redirects to the confirmation page.
app.post('/book-seats', async (req, res) => {
    try {
        const { busId, selectedSeats } = req.body;

        // ── Step 1: Validate inputs ───────────────────────────────────────────

        // busId must be a valid MongoDB ObjectId
        if (!busId || !mongoose.Types.ObjectId.isValid(busId)) {
            return res.status(400).send('Invalid bus ID.');
        }

        // selectedSeats comes as a comma-separated string from the form
        // e.g. "A1,A2,B3"
        const seatArray = typeof selectedSeats === 'string'
            ? selectedSeats.split(',').map(s => s.trim()).filter(Boolean)
            : [];

        if (seatArray.length === 0) {
            return res.status(400).send('No seats selected. Please go back and select at least one seat.');
        }

        // ── Step 2: Fetch bus details ─────────────────────────────────────────
        const bus = await Bus.findById(busId);
        if (!bus) {
            return res.status(404).send('Bus schedule not found.');
        }

        // ── Step 3: Fetch the seat inventory ─────────────────────────────────
        const inventory = await BusSeatInventory.findOne({ busId: bus._id });
        if (!inventory) {
            return res.status(404).send('Seat inventory not found for this bus.');
        }

        // ── Step 4: Check that all selected seats are still "available" ───────
        const unavailableSeats = [];

        for (const seatNum of seatArray) {
            const seatDoc = inventory.seats.find(s => s.seatNumber === seatNum);
            if (!seatDoc || seatDoc.status !== 'available') {
                unavailableSeats.push(seatNum);
            }
        }

        // If any seat was grabbed by someone else, abort and send user back
        if (unavailableSeats.length > 0) {
            return res.status(409).send(
                `Sorry, the following seat(s) are no longer available: ${unavailableSeats.join(', ')}. ` +
                `Please go back and choose different seats.`
            );
        }

        // ── Step 5: Create the Booking document in `bookings` ─────────────────
        const farePerSeat = bus.fare || 0;
        const totalFare   = farePerSeat * seatArray.length;

        const newBooking = new Booking({
            busId:       bus._id,
            seatNumbers: seatArray,
            farePerSeat: farePerSeat,
            totalFare:   totalFare,
            status:      'confirmed'
        });

        const savedBooking = await newBooking.save();

        console.log(`[BOOKING CREATED] ID: ${savedBooking._id} | Seats: ${seatArray.join(', ')} | Fare: ₹${totalFare}`);

        // ── Step 6: Update bus_seat_inventories — mark seats as "booked" ──────
        // For each selected seat, set status → "booked" and bookingId → savedBooking._id
        for (const seatNum of seatArray) {
            const seatDoc = inventory.seats.find(s => s.seatNumber === seatNum);
            if (seatDoc) {
                seatDoc.status    = 'booked';
                seatDoc.bookingId = savedBooking._id;
            }
        }

        // Save the updated inventory document back to MongoDB
        await inventory.save();

        console.log(`[INVENTORY UPDATED] Bus: ${bus._id} | Booked seats: ${seatArray.join(', ')}`);

        // ── Step 7: Decrement availableSeats on the bus schedule ─────────────
        await Bus.findByIdAndUpdate(bus._id, {
            $inc: { availableSeats: -seatArray.length }
        });

        console.log(`[BUS UPDATED] availableSeats decremented by ${seatArray.length}`);

        // ── Step 8: Redirect to booking confirmation page ─────────────────────
        res.redirect(`/booking-confirmation/${savedBooking._id}`);

    } catch (err) {
        console.error('Error processing booking:', err);
        res.status(500).send('An error occurred while processing your booking. Please try again.');
    }
});



// GET route: Booking confirmation page
// Displays the confirmed booking details after a successful seat booking.
app.get('/booking-confirmation/:bookingId', async (req, res) => {
    const { bookingId } = req.params;

    try {
        // Validate bookingId
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).send('Invalid booking ID.');
        }

        // Fetch the booking document
        const booking = await Booking.findById(bookingId).lean();
        if (!booking) {
            return res.status(404).send('Booking not found.');
        }

        // Fetch the associated bus details for display
        const bus = await Bus.findById(booking.busId).lean();
        if (!bus) {
            return res.status(404).send('Bus details not found for this booking.');
        }

        // Render confirmation page with booking + bus details
        res.render('booking_confirmation', { booking, bus });

    } catch (err) {
        console.error('Error fetching booking confirmation:', err);
        res.status(500).send('An error occurred while loading the booking confirmation.');
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
