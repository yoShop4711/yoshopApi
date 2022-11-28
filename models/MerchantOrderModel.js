const mongoose = require('mongoose')

const ItemSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }

}, {timestamps: true})

module.exports = mongoose.model('Item', ItemSchema)