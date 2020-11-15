// Import models 
const User = require("../models/User");
const Offer = require("../models/Offer");

const isAuthenticated = async(req,res,next) => {
try{

    console.log("On rentre dans le middleware");
    if(req.headers.authorization){
            const token = req.headers.authorization.replace("Bearer ","");   
            //Chercher dans la bdd si un user possède ce token 
            const user = await User.findOne({token: token}).select("account _id email");

            // console.log(user);

            //Si un user possédant ce token est retrouvé dans la BDD
            if(user){
            // On passe à la suite
    console.log("On sort du middleware...");
            // On ajoute une clé user à l'objet req
            req.user = user;
            return next();
            }else{
                return res.status(400).json({message: "Unauthorized"});
            }
    }else {
        return res.status(400).json({message: "Unauthorized"});
    }

}catch(error){
    res.status(400).json({error: error.message});
}

};
module.exports = isAuthenticated;