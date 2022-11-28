const mongoose = require('mongoose')

const MessageSchema = mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    body: {
        type: String,
        required: true,
    },


}, {
    timestamps: true
})

module.exports = mongoose.model('Message', MessageSchema)