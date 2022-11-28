const mongoose = require('mongoose')

const ProductSchema = mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    productDescription: {
        type: String,
        required: true
    },
    productQuantity: {
        type: String,
        required: true
    },
    productAvailability: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    productImage: {
        data: Buffer,
        contentType: String
    
    },
    productPrice: {
        type: Number,
        required: true
    },
     categor: {
        type: String,
        required: true
    }

})



module.exports = mongoose.model('Product', ProductSchema)