/**
 * Booking.js
 * -----------
 * Mongoose model for the `bookings` collection.
 *
 * Each document represents one confirmed seat booking for a bus journey.
 * It stores:
 *   - which bus was booked (busId → bus_schedules)
 *   - which seats were selected (seatNumbers array)
 *   - the total fare charged
 *   - the booking status
 *   - timestamps (createdAt, updatedAt)
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        /**
         * Reference to the bus journey in `bus_schedules`.
         */
        busId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bus',
            required: true
        },

        /**
         * Array of seat numbers that were booked in this transaction.
         * Example: ["A1", "A2", "B3"]
         */
        seatNumbers: {
            type: [String],
            required: true
        },

        /**
         * Fare per seat at the time of booking (copied from bus document).
         * Stored here so fare changes on the bus won't affect past bookings.
         */
        farePerSeat: {
            type: Number,
            required: true
        },

        /**
         * Total amount paid = farePerSeat × number of seats booked.
         */
        totalFare: {
            type: Number,
            required: true
        },

        /**
         * Booking status.
         * "confirmed" → Booking is active and seats are reserved.
         * "cancelled" → Booking was cancelled (future use).
         */
        status: {
            type: String,
            enum: ['confirmed', 'cancelled'],
            default: 'confirmed'
        }
    },
    {
        /**
         * Automatically adds:
         *   createdAt → booking creation time
         *   updatedAt → last modification time
         */
        timestamps: true,

        // Explicitly map to the `bookings` collection
        collection: 'bookings'
    }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;

