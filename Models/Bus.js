const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
    busName: String,
    busNumber: String,
    fromPlace: String,
    toPlace: String,
    journeyDate: Date,
    departureTime: String,
    busType: String,
    fare: Number,
    availableSeats: Number,
    description: String
});

const Bus = mongoose.model(
    "Bus",
    busSchema,
    "bus_schedules"
);

module.exports = Bus;