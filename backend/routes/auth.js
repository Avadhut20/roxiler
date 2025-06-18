const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(cors());

router.post("/signup",async(req,res)=>{
    try {
        const{name,email,password,address,role}= req.body;
        const exisitingUser= await prisma.user.findUnique({
            where: { email: email }
        });
        if (exisitingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const newUser= await prisma.user.create({
            data:{
                name,
                email,
                password: await bcrypt.hash(password, 10),
                address,
                role
            }
        });
        res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})

router.post("/login",async(req,res)=>{
    try{
        const {email,password}= req.body;
        const user= await prisma.user.findUnique({where:{email}});
        if(!user){
            return res.status(400).json({message:'Invalid credentials'});
        }
        const isvalid= await bcrypt.compare(password,user.password);
        if(!isvalid){
            return res.status(400).json({message:'Invalid Password'});
        }
        const token= jwt.sign({id:user.id,role:user.role},process.env.JWT_SECRET);
        res.status(200).json({message:'Login successful',token,user:{id:user.id,name:user.name,email:user.email,address:user.address,role:user.role}});
    }
    catch(error){
        console.error("Error during login:", error);
        res.status(500).json({message:'Internal server error'});
    }
})
module.exports = router;