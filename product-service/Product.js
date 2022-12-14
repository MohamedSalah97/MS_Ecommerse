const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    desc: {
        type: String
    },
    quantity: {
        type: Number,
        required: true
    },
    created_at:{
        type: Date,
        default: Date.now
    }
});

module.exports = Product = mongoose.model('product', ProductSchema);