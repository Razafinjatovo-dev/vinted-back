//Import packages 
const express = require("express");
const router = express.Router();
// const SHA256 = require("crypto-js/sha256"); => INUTILE ICI 
// const encBase64 = require("crypto-js/enc-base64"); => INUTILE ICI 
// const uid2 = require("uid2"); => INUTILE ICI 

//CLOUDINARY
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: "dlqy6elq1",
  api_key: "656379929546889",
  api_secret: "Rqd_bI_bW_rE8C8oR2UACTJbAb0",
});

//MIDDLEWARE
const isAuthenticated = require("../middlewares/isAuthenticated");

//IMPORT MODELS
const User = require("../models/User");
const Offer = require("../models/Offer");


//EXPRESS-FORMIDABLE
const formidableMiddleware = require('express-formidable');

const app = express();
// on utilise `express-formidable` sur toutes les routes
// cela aura un impact uniquement sur les routes qui reçoivent un FormData
app.use(formidableMiddleware());


  
//ROUTE PUBLISH OFFER 

    router.post("/offer/publish", isAuthenticated, async (req,res) => {
        try{
            // VERIFIER SI UN FILE A ETE UPLOADE
            // console.log("HEY AUTHENTICATE");
            // Qui est l'user? qui sera défini comme owner => ce probleme est résolu par la ligne 29 du middleWare 
            // const user = await User.findOne({token: req.headers.authorization.replace("Bearer ","")});

            //Insérer le destructuring assignement ici si on veut l'utiliser 
        
        let pictureToUpload = req.files.picture.path;

        // const result = await cloudinary.uploader.upload(pictureToUpLoad, {
        //     folder: "/vinted",
        //     public_id:"preview",
        // });

             //Création de l'offre sans l'image 
        const newOffer = new Offer(
            {
                product_name: req.fields.title,//Attention à bien mettre "req.fields" et non "req.files" 
                product_description: req.fields.description, //Attention à bien mettre "req.fields" et non "req.files" 
                product_price: req.fields.price, //Attention à bien mettre "req.fields" et non "req.files" 
                product_details: [
                    {
                      MARQUE: req.fields.brand,
                    },
                    {
                      TAILLE: req.fields.size,
                    },
                    {
                      ÉTAT: req.fields.condition,
                    },
                    {
                      COULEUR: req.fields.color,
                    },
                    {
                      EMPLACEMENT: req.fields.city,
                    },
                  ],
                // product_image => pas besoin de le saisir ici car djà rajouté lors de l'envoi de l'image via newOffer._product_image = result un peu plus bas (vers ligne 71)
            
                owner: req.user.populate("owner") // => car jai rajouté "req.user" à la requete via le middleware (ligne 29 isAuthenticated)
            }
        );

        //Envoi image à Cloudinary 
        const result = await cloudinary.uploader.upload(pictureToUpload,{
            folder: `/vinted/${newOffer._id}`,
        });

        // console.log(result); => pour voir dans la console les keys/values de limage
        newOffer.product_image = result;

        //Sauvegards offre 
          await newOffer.save(); //=> A réactiver pour créer des offres dans la BDD 

       res.status(200).json(newOffer);
        }catch(error){
            res.status(400).json({error: error.message});
        }
        
      });


  // VINTED ANNONCES FILTERS  - Service web qui permettra de récupérer un tableau contenant l'ensemble des annonces, ainsi que le nombre total d'annonces.

  router.get("/offers", async (req, res) => {
    try {
      let filters = {};
  
      if (req.query.title) {
        filters.product_name = new RegExp(req.query.title, "i");
      }
  
      if (req.query.priceMin) {
        filters.product_price = {
          $gte: Number(req.query.priceMin),
        };
      }
  
      if (req.query.priceMax) {
        if (filters.product_price) {
          filters.product_price.$lte = Number(req.query.priceMax);
        } else {
          filters.product_price = {
            $lte: Number(req.query.priceMax),
          };
        }
      }
  
      let sort = {};
  
      if (req.query.sort === "price-asc") {
        sort = { product_price: 1 };
      } else if (req.query.sort === "price-desc") {
        sort = { product_price: -1 };
      }
  
      // Les query sont des strings
      let limit = Number(req.query.limit); // "5" à 5
  
      let page;
      if (Number(req.query.page) < 1) {
        page = 1;
      } else {
        page = Number(req.query.page);
      }
  
      const offers = await Offer.find(filters)
        .populate({
          path: "owner",
          select: "account",
        })
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);
      // .select("product_name product_price owner");
  
      const count = await Offer.countDocuments(filters);
  
      res.status(200).json({
        count: count,
        offers: offers,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
//Service web qui permettra de récupérer les détails concernant une annonce, en fonction de son id.

  router.get("/offer/:id", async (req, res) => {
    try {
      const offer = await Offer.findById(req.params.id).populate({
        path: "owner",
        select: "account",
      });
      res.status(200).json(offer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

module.exports = router;