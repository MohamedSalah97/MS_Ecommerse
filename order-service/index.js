const express = require('express');
const mongoose = require('mongoose');
const isAuth = require('../isAuthenticated');
const amqp = require('amqplib');
const Order = require('./Order');
// const validateRequest = require('./middlewares/validate-request');
// const {body} =require('express-validator');

const app = express();
app.use(express.json());
require('dotenv').config();
mongoose.connect(`mongodb+srv://mohamed:${process.env.DB_password}@order.hawpeu3.mongodb.net/?retryWrites=true&w=majority`,{
    useNewUrlParser: true,
    useUnifiedTopology: true
},()=>{
    console.log('connected to product database');
});

let channel;
async function connect(){
    const connection = await amqp.connect('amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertQueue('ORDER');
}

connect().then(() =>{
    channel.consume('ORDER', async data=>{
        const {products,user} = JSON.parse(data.content);
        const newOrder = await createOrder(products,user);
        channel.ack(data);
        console.log(newOrder);
        channel.sendToQueue("PRODUCT", Buffer.from(JSON.stringify(newOrder)));
    })
})

async function createOrder(products,user) {
    let total = 0 ;
    for(let i=0; i<products.length;i++){
        total += products[i].price
    }
    const newOrder = new Order({
        products,
        user,
        total_price: total
    });
    newOrder.save()
    return newOrder ;
}

app.get('/orders', async(req,res) => {
    const orders = await Order.find()
    res.json(orders);
})

app.listen(9090,() =>{
    console.log('product service running on port 9090')
})