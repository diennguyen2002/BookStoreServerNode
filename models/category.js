const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: String,
    books_id : [{type: mongoose.Types.ObjectId}]
});

module.exports = mongoose.model('Category', categorySchema);