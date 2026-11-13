/**
 * BusSeatInventory.js
 * --------------------
 * Mongoose model for the `bus_seat_inventories` collection.
 *
 * Each document stores the full seat layout and availability status
 * for ONE scheduled bus journey. It is linked to the `bus_schedules`
 * collection via the `busId` field (a reference to Bus._id).
 *
 * Separation of concerns:
 *   - bus_schedules  → journey information (route, fare, times, etc.)
 *   - bus_seat_inventories → seat layout + availability for that journey
 */

const mongoose = require('mongoose');

// ─── Sub-document Schema: Individual Seat ───────────────────────────────────
const seatSchema = new mongoose.Schema(
    {
        /**
         * Unique seat identifier within this bus inventory.
         * Format: <RowLetter><SeatNumber>  e.g. "A1", "B3", "J4"
         */
        seatNumber: {
            type: String,
            required: true,
            trim: true
        },

        /**
         * Current availability status of the seat.
         * "available" → Seat is free and can be selected.
         * "booked"    → Seat is already reserved; cannot be selected.
         */
        status: {
            type: String,
            enum: ['available', 'booked'],
            default: 'available',
            required: true
        },

        /**
         * Reference to the booking document that reserved this seat.
         * null when the seat is available (no booking yet).
         * This field is kept for future booking integration.
         */
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        }
    },
    { _id: false } // No separate _id for each seat sub-document
);

// ─── Main Schema: Bus Seat Inventory ────────────────────────────────────────
const busSeatInventorySchema = new mongoose.Schema(
    {
        /**
         * Reference to the specific bus journey in `bus_schedules`.
         * One inventory document exists per journey.
         */
        busId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bus',          // References the Bus model (bus_schedules collection)
            required: true,
            unique: true         // Ensures each bus journey has exactly ONE inventory
        },

        /**
         * Total number of seats in this bus (default 40 for a 10-row × 4-seat layout).
         */
        totalSeats: {
            type: Number,
            required: true,
            default: 40
        },

        /**
         * Array of all seat objects for this bus journey.
         * Each element follows the seatSchema defined above.
         */
        seats: {
            type: [seatSchema],
            default: []
        }
    },
    {
        /**
         * Mongoose timestamps automatically add:
         *   createdAt → when the inventory document was first created
         *   updatedAt → when it was last modified
         */
        timestamps: true,

        /**
         * Explicitly map this model to the `bus_seat_inventories` collection.
         */
        collection: 'bus_seat_inventories'
    }
);

// ─── Create and Export Model ─────────────────────────────────────────────────
const BusSeatInventory = mongoose.model('BusSeatInventory', busSeatInventorySchema);

module.exports = BusSeatInventory;

