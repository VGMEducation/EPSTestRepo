var mongoose = require("mongoose");

// This is a dedicated sub-document. There is no collection associated to it.

var QuestionsSchema = new mongoose.Schema({
    //_id: String,
    title: String,
    order: Number,
    active: Boolean,
    text: String,
    createDate: Date,
    isCoreComponent: Boolean
});

//var Question = mongoose.model('Question', QuestionsSchema);

module.exports = QuestionsSchema;