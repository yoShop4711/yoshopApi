const mongoose = require('mongoose')

const ConversationSchema = mongoose.Schema({
    recipients: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    lastMessage: {
        type: String,
    }


}, {
    timestamps: true
})

module.exports = mongoose.model('Conversation', ConversationSchema)