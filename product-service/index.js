const express = require('express');
const mongoose = require('mongoose');
const isAuth = require('../isAuthenticated');
const amqp = require('amqplib');
const Product = require('./Product');
const validateRequest = require('./middlewares/validate-request');
const {body} =require('express-validator');

const app = express();
app.use(express.json());
require('dotenv').config();
mongoose.connect(`mongodb+srv://mohamed:${process.env.DB_PASSWORD}@product.3hdhufq.mongodb.net/?retryWrites=true&w=majority`,{
    useNewUrlParser: true,
    useUnifiedTopology: true
},()=>{
    console.log('connected to product database');
});

let channel;
async function connect(){
    const connection = await amqp.connect('amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertQueue('PRODUCT');
}

connect();

app.post('/product/create', isAuth ,[
    body('title').not().isEmpty().withMessage('Title required'),
    body('price').isFloat({gt: 0}).withMessage('price must be greater than 0'),
    body('quantity').isNumeric({gt: 0}).withMessage('quantity must be greater than 0')
],validateRequest, async (req,res) =>{
    const {title,price,desc, quantity} = req.body ;
    const newProduct = new Product({ 
        title,
        price,
        desc,
        quantity
    });

    await newProduct.save(); 

    return res.status(201).json(newProduct);
});
 
app.post('/product/buy', isAuth ,[
    body('ids').not().isEmpty().withMessage('empty order')
], validateRequest, async(req,res) =>{ 
   const {ids} = req.body ;
    const products = await Product.find({_id: {$in: ids}});
    channel.sendToQueue('ORDER', Buffer.from(JSON.stringify({products, user: req.user.name})));
    let order;
    channel.consume('PRODUCT', async(data) =>{
        order = JSON.parse(data.content);
        channel.ack(data);
        console.log(order.products);
        await order.products.map(async(product) => {
            await Product.findByIdAndUpdate(product._id, {$inc: {quantity: -1}});
        });
        res.json(order);
    });
});

app.get('/product', async (req,res) => {
    const products = await Product.find();
    res.json(products)
})


app.listen(8080,() =>{
    console.log('product service running on port 8080') 
})