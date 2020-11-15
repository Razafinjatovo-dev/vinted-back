
require('dotenv').config();

const cors= require('cors');

//npm init-y 
// npm i express express-formidable mongoose uid2 crypto-js

// Import packages 
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");

// Création serveur 
const app = express();
app.use(formidable());
app.use(cors());


//CLOUDINARY IMPORT
const cloudinary = require("cloudinary").v2;
//CLOUDINARY CONFIG
cloudinary.config({
  cloud_name:"dlqy6elq1",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Import routes 
const userRoutes = require("./routes/user");
app.use(userRoutes);

const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

// Connexion à la bdd Vinted
mongoose.connect(
   process.env.MONGODB_URI,
    { useNewUrlParser: true,  
      useUnifiedTopology: true,
      useCreateIndex: true 
    }
  );


app.all("*", function(req, res) {
    res.json({message: "Page not found"});
  });

//Initialisation Serveur 
app.listen(process.env.PORT, () => {
    console.log("Server has started");
  });