/**
 * generateSeatInventories.js
 * ---------------------------
 * One-time setup script to create seat inventory documents in the
 * `bus_seat_inventories` collection for every existing bus schedule
 * found in the `bus_schedules` collection.
 *
 * HOW TO RUN:
 *   node scripts/generateSeatInventories.js
 *
 * SAFE TO RE-RUN:
 *   The script checks whether an inventory already exists for each bus
 *   before inserting. It will NEVER overwrite or duplicate an existing
 *   inventory document.
 *
 * SEAT LAYOUT (2+2 configuration, 8 rows, 32 seats total):
 *
 *   ROW  LEFT PAIR  AISLE  RIGHT PAIR
 *    A    A1  A2    |  |    A3  A4
 *    B    B1  B2    |  |    B3  B4
 *    C    C1  C2    |  |    C3  C4
 *    D    D1  D2    |  |    D3  D4
 *    E    E1  E2    |  |    E3  E4
 *    F    F1  F2    |  |    F3  F4
 *    G    G1  G2    |  |    G3  G4
 *    H    H1  H2    |  |    H3  H4
 *
 * All 32 seats are initialized as "available" (no pre-booked seats).
 */

const mongoose = require('mongoose');

// ─── Load Models ─────────────────────────────────────────────────────────────

// Bus model → reads from `bus_schedules`
const Bus = require('../Models/Bus');

// BusSeatInventory model → writes to `bus_seat_inventories`
const BusSeatInventory = require('../Models/BusSeatInventory');

// ─── Database Connection ──────────────────────────────────────────────────────

const DB_URI = 'mongodb://127.0.0.1:27017/msrtc_bus_booking_system';

// ─── Seat Layout Configuration ────────────────────────────────────────────────

/**
 * Row letters A through H (8 rows × 4 seats = 32 seats total).
 */
const ROW_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// No pre-booked seats — all seats start as "available"

// ─── Helper: Generate Seat Array ──────────────────────────────────────────────

/**
 * Generates an array of 32 seat objects for a standard 2+2 bus layout (8 rows).
 * All seats are initialized as "available".
 *
 * @returns {Array<{ seatNumber: string, status: string, bookingId: null }>}
 */
function generateSeats() {
    const seats = [];

    for (const row of ROW_LETTERS) {
        // Each row has 4 seats: 1, 2 (left of aisle) and 3, 4 (right of aisle)
        for (let seatNum = 1; seatNum <= 4; seatNum++) {
            const seatNumber = `${row}${seatNum}`;

            seats.push({
                seatNumber: seatNumber,
                status: 'available',   // All seats start as available
                bookingId: null
            });
        }
    }

    return seats;
}

// ─── Main Script Function ─────────────────────────────────────────────────────

async function generateSeatInventories() {
    console.log('='.repeat(60));
    console.log('  MSRTC Seat Inventory Generator');
    console.log('='.repeat(60));

    // Step 1: Connect to MongoDB
    console.log(`\n[1/5] Connecting to MongoDB at: ${DB_URI}`);
    try {
        await mongoose.connect(DB_URI);
        console.log('      ✓ Connected to MongoDB successfully.');
    } catch (err) {
        console.error('      ✗ Failed to connect to MongoDB:', err.message);
        process.exit(1); // Exit with error code if connection fails
    }

    // Step 2: Fetch all bus schedules
    console.log('\n[2/5] Fetching all bus schedules from `bus_schedules`...');
    let allBuses;
    try {
        allBuses = await Bus.find({}).lean();
        console.log(`      ✓ Found ${allBuses.length} bus schedule(s).`);
    } catch (err) {
        console.error('      ✗ Error fetching bus schedules:', err.message);
        await mongoose.disconnect();
        process.exit(1);
    }

    if (allBuses.length === 0) {
        console.log('\n      ⚠ No bus schedules found. Add bus data first, then re-run this script.');
        await mongoose.disconnect();
        return;
    }

    // Step 3: Process each bus schedule
    console.log('\n[3/5] Processing each bus schedule...');
    console.log('-'.repeat(60));

    let createdCount = 0;  // Count of newly created inventories
    let skippedCount = 0;  // Count of buses that already had an inventory

    for (const bus of allBuses) {
        const busLabel = `${bus.busName || 'Unknown'} (${bus.busNumber || 'N/A'}) [ID: ${bus._id}]`;

        // Step 3a: Check if inventory already exists for this bus
        const existingInventory = await BusSeatInventory.findOne({ busId: bus._id });

        if (existingInventory) {
            // Inventory already exists — skip to avoid overwriting booking data
            console.log(`  ⊘ SKIPPED  : ${busLabel}`);
            console.log(`             Inventory already exists (ID: ${existingInventory._id})`);
            skippedCount++;
            continue;
        }

        // Step 3b: Generate a fresh 32-seat layout — all seats available
        const seats = generateSeats();

        // Step 3c: Build the inventory document
        const inventoryDoc = new BusSeatInventory({
            busId: bus._id,
            totalSeats: 32,
            seats: seats
        });

        // Step 3d: Save to `bus_seat_inventories`
        try {
            const saved = await inventoryDoc.save();
            console.log(`  ✓ CREATED  : ${busLabel}`);
            console.log(`             Inventory ID : ${saved._id}`);
            console.log(`             Total Seats  : 32  |  All Available`);
            createdCount++;
        } catch (saveErr) {
            console.error(`  ✗ ERROR    : ${busLabel}`);
            console.error(`             ${saveErr.message}`);
        }
    }

    // Step 4: Print Summary
    console.log('-'.repeat(60));
    console.log('\n[4/5] Summary:');
    console.log(`      Total bus schedules  : ${allBuses.length}`);
    console.log(`      Inventories created  : ${createdCount}`);
    console.log(`      Already existed      : ${skippedCount}`);

    // Step 5: Disconnect from MongoDB
    console.log('\n[5/5] Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('      ✓ Disconnected successfully.');
    console.log('\n' + '='.repeat(60));
    console.log('  Done! Seat inventories are ready in `bus_seat_inventories`.');
    console.log('='.repeat(60) + '\n');
}

// ─── Run the Script ───────────────────────────────────────────────────────────
generateSeatInventories();

