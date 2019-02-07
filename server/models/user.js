const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const _ = require('lodash');

var Schema = mongoose.Schema;

//////////////////////////////////////////
//Conventional way to create a model
//adds more flexibility to te model
var userSchema = new Schema({
	email: {
   		type: String,
    	required: true,
    	trim: true,
    	minlength: 1,
    	unique: true,
    	validate: {
       		validator: validator.isEmail,// returns bool value
       		message: '{VALUE} is not a valid email'
       }
	},
    password: {
   		type: String,
   		required: true,
   		minlength: 6
   	},
   	tokens: [{
   		access: {
   			type: String,
   			required: true
   		},
   		token: {
   			type: String,
			required: true
   		}
   	}]
});

//creating a method for the schema
//Overriding a method
userSchema.methods.toJSON = function () {
	//instance methods --> gets called with indiviual document
	var user = this;
	var userObject = user.toObject();

	return _.pick(userObject, ['_id', 'email']);
};

userSchema.methods.generateAuthToken = function () {
	//'this' binds to specific document
	var user = this;
	var access = 'auth';
	var token = jwt.sign({_id: user._id.toHexString(), access}, 'testSecretValue').toString();

	user.tokens = user.tokens.concat([{access, token}]);

	return user.save().then(() => {
		return token;
	});
};

// statics --> object 
// everythnig added onto statics turns into an model method
userSchema.statics.findByToken = function (token) {
	// model method --> gets called with the model as the 'this' binding
	var User = this;
	var decoded; //set to undefined 

	try {
		// jwt.verify() throws an error if one occurs
		decoded = jwt.verify(token, 'testSecretValue');
	} catch (err) {
		// return a promise and reject it right away
			// return new Promise((resolve, reject) => {
			// 	reject();
			// });

		// simplified version of code above
		return Promise.reject();
	}

	return User.findOne({
		'_id': decoded._id,
		'tokens.token': token,
		'tokens.access': 'auth'
	});

};

var User = mongoose.model('User', userSchema);
module.exports = {User};

//////////////////////////////////////////
//Different way to create a model
// var User = mongoose.model('User', {
// 	email: {
//    		type: String,
//     	required: true,
//     	trim: true,
//     	minlength: 1,
//     	unique: true,
//     	validate: {
//        		validator: validator.isEmail,// returns bool value
//        		message: '{VALUE} is not a valid email'
//        }
// 	},
//     password: {
//    		type: String,
//    		required: true,
//    		minlength: 6
//    	},
//    	tokens: [{
//    		access: {
//    			type: String,
//    			required: true
//    		},
//    		token: {
//    			type: String,
// 			required: true
//    		}
//    	}]
// });
