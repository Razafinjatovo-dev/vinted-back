//Import packages 
const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const cloudinary = require("cloudinary").v2;

//Import models
const User = require("../models/User");
const Offer = require("../models/Offer");

//ROUTE USER/SIGNUP
router.post("/user/signup", async(req,res) => {
    if(!req.fields.username){//Si username non renseigné 
    res.status(400).json({message:"Username Missing"});  //signaler que username manquant 
    }else{
        try{
            // Checker si email existe , si existe informer que creation impossible sinon créer le user en passant au step prévu par "else"
            const userToCreate = await User.findOne({email: req.fields.email});
            if(userToCreate){
                res.json({message:"Unauthorized"});
                }else{// si mail inexistant, lancer création du user
                    const token =  uid2(16);// Générer salt 
                    const salt = uid2(16);// Générer salt 
                    // Générer hash à partir de password + salt 
                    const password = req.fields.password;//A checker si le stockage dans une variabe du password est à bannir pour raison de sécurité mm si non stockage dans BDD
                    const hash = SHA256(password+salt).toString(encBase64);
                    //Création user après vérif si mail déjà existant 
                    const newUser = new User({
                        email: req.fields.email,
                        account: {
                            username: req.fields.username,
                            phone: req.fields.phone,
                        },
                        token: token,
                        hash: hash,
                        salt: salt
                        });
                    await newUser.save();
                    res.json({
                        _id: newUser._id,
                        token: newUser.token,
                        account: {
                            username: newUser.account.username,
                            phone: newUser.account.phone, 
                        }
                    })
                }
            }catch(error){
                res.status(400).json({message: error.message});
        }
        }    
});

//ROUTE LOG IN 
router.post("/user/login", async (req,res) => {
    try{//Checker si les élements requis sont saisis 
    if(!req.fields.email || !req.fields.password){
    res.status(400).json({error: " EMAIL AND/OR PASSWORD ARE MISSING BRO!"})
    }else{// sinon si les élements requis sont bien saisis passer à l'étape ci dessous
            //rechercher dans la bdd un user qui possède l'email renseigné 
            const userTryLog = await User.findOne({email: req.fields.email});
            // si on retrouve le mail dans la BDD i.e si userTryLog est TRUE on passe à l'étape ci dessous sinon on retourne "UNAUTHORIZED"
            // Comparer le hash du password saisi vs hash dans la bdd 
            //Sous étape 1: Former un hash avec le mdp saisi + le salt dans la bdd 
            const hashFromClient  = SHA256(req.fields.password + userTryLog.salt).toString(encBase64);
            //Sous étape 2: Comparer résultat sous étape 1 avec le hash de la bdd 
            const hashDatabase = userTryLog.hash;
            //Sous étape 3: si les 2 hash sont identiques => connexion OK sinon Unauthorized 
            if (hashFromClient===hashDatabase){
                res.json({
                    _id: userTryLog._id,
                    token: userTryLog.token,
                    account:{
                        username: userTryLog.account.username,
                        phone: userTryLog.account.phone,
                    }
                });
            }else{
                res.status(400).json({
                    message: 'UNAUTHORIZED',
                });
            };
        };    
    
    }catch(error){
        res.status(400).json({error: error.message});
    }
});

//CLOUDINARY IMPORT 
cloudinary.config({
  cloud_name:"dlqy6elq1",
  api_key: "656379929546889",
  api_secret: "Rqd_bI_bW_rE8C8oR2UACTJbAb0"
});

//Route Upload file 
router.post("/upload", (req,res) => {
    res.json(req.files);
})


//Export routes 
module.exports = router;


