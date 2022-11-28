const mongoose = require('mongoose')

const WishListSchema = mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    productImage: {
        data: Buffer,
        contentType: String
    
    },
    productDescription: {
        type: String,
        required: true
    },
   createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },

}, {
    timestamps: true
})

module.exports = mongoose.model('Wish', WishListSchema)