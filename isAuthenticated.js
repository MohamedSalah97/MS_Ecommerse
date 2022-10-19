const jwt = require("jsonwebtoken");

module.exports = async function isAuthenticated(req, res, next) {
    if(!req.headers["authorization"]){
        return res.status(400).json({msg:"not authenticated"})
    }
    const token = req.headers["authorization"].split(" ")[1];

    jwt.verify(token, "secret", (err, user) => {
        if (err) {
            return res.json({ message: err });
        } else {
            req.user = user;
            next();
        }
    });

};