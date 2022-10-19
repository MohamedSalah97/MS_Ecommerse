const express = require('express');
const mongoose  = require('mongoose');
const User = require('./User');
const {body} = require('express-validator');
const validateRequest = require('./middlewares/validate-request');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const app = express();
require('dotenv').config()
app.use(express.json());
mongoose.connect(`mongodb+srv://mohamed:${process.env.DB_PASSWORD}@auth.rjmuono.mongodb.net/?retryWrites=true&w=majority`,{
    useNewUrlParser: true,
    useUnifiedTopology: true
},()=>{
    console.log('connected to auth database');
});

// signup route
app.post('/auth/register',[
    body('name').not().isEmpty().withMessage('name is required'),
    body('email').isEmail().withMessage('Email must be valid'),
    body('password').trim().isLength({min:6,max:20}).withMessage('Password must be between 6 and 20 characters')
  ],validateRequest, async (req,res)=>{

    const {name,email,password} = req.body ;
    const foundEmail = await User.findOne({email});
    if(foundEmail){
        return res.status(400).json({msg: 'user already exists'});
    }

    const hashedPassword = await bcrypt.hash(password,10);
    const newUser = new User({
        name,
        email,
        password: hashedPassword
    });

    await newUser.save()

    res.status(201).json(newUser);

});

app.post('/auth/signin', [
    body('email').not().isEmpty().withMessage('Email must be provided'),
    body('password').not().isEmpty().withMessage('password must be provided')
], validateRequest, async (req,res) =>{
    const {email, password} = req.body;

    const user = await User.findOne({email});
    if(!user) {
        return res.status(404).json({msg: 'there is no matching user'})
    }

    const hashedPassword = user.password ;
    const match = await bcrypt.compare(password, hashedPassword);
    if(!match){
        return res.status(400).json({msg: 'wrong password'});
    }

    const payload = {
        email, 
        username: user.username
    }

    const token =  jwt.sign(payload, "secret");
    if(!token){
        throw new Error('jwt sign failed');
    }

    res.status(200).json({token});
});


const PORT = 7070 ;
app.listen(PORT, () =>{
    console.log(`auth-service at port ${PORT}`);
})