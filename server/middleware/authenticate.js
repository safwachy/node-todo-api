const {User} = require('../models/user');

// middleware func to make routes private

var authenticate = (req, res, next) => {
    //retrieve the 'x-auth' token form the headers
    let token = req.header('x-auth');

    User.findByToken(token).then((user) => {
        //if user with token is not found
        if (!user) {
            return Promise.reject();
        }

        // modifing the req object
        req.user = user;
        req.token = token;
        next(); // allows us to use modified req object in other routes
    }).catch((err) => {
        res.status(401).send();
    })
};

module.exports = {authenticate};