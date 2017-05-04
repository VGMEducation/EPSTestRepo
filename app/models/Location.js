var mongoose = require("mongoose");

var LocationsSchema = new mongoose.Schema({
    locationId: Number,
    name: String,
    order: Number,
    active: Boolean,
    text: String,
    createDate: Date
}, { collection: 'locations' });

var Location = mongoose.model('Location', LocationsSchema);

module.exports = Location;