//IMPORT PACKAGES
const express = require("express");
const router = express.Router();

//CLOUDINARY
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//MIDDLEWARE
const isAuthenticated = require("../middlewares/isAuthenticated");

//IMPORT MODELS
const User = require("../models/User");
const Offer = require("../models/Offer");

//EXPRESS-FORMIDABLE
const formidableMiddleware = require("express-formidable");

const app = express();

app.use(formidableMiddleware());

//ROUTE PUBLISH OFFER
router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    let pictureToUpload = req.files.product_image.path;

    //Création offre sans image
    const newOffer = new Offer({
      product_name: req.fields.title,
      product_description: req.fields.description,
      product_price: req.fields.price,
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

      owner: req.user.populate("owner"), //Pour rappel, req.user rajouté via middleware  isAuthenticated
    });

    //Envoi image à Cloudinary
    const result = await cloudinary.uploader.upload(pictureToUpload, {
      folder: `/vinted/${newOffer._id}`,
    });

    newOffer.product_image = result;

    //Sauvegarde offre
    await newOffer.save();

    res.status(200).json(newOffer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route qui permettra de récupérer un tableau contenant l'ensemble des annonces

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

    let limit = Number(req.query.limit);

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

    const count = await Offer.countDocuments(filters);

    res.status(200).json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Route qui permettra de récupérer les détails concernant une annonce, en fonction de son id.

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
