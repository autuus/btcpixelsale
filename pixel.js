/**
 * Created by autuus on 10.5.2014.
 */
// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var pixelSchema = mongoose.Schema({
    url: String,
    image_data: Buffer,
    x: Number,
    y: Number,
    height: Number,
    width: Number,
    paid: Boolean,
    issue_date: Number
});

module.exports = mongoose.model('Pixel', pixelSchema);