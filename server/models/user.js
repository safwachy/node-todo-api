const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const _ = require('lodash');
const bcrypt = require('bcryptjs')

var Schema = mongoose.Schema;

//////////////////////////////////////////
//Conventional way to create a model
//adds more flexibility to the model
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
// everything added onto statics turns into a model method
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

userSchema.statics.findByCredentials = function (email, password) {
	var User = this;

	return User.findOne({email}).then((user) => {
		//if user cannot be found in database
		if (!user) {
			return Promise.reject();
		}

		//bycrpt.compare only supports callbacks
		//return a new promise instead to keep the code consistent
		return new Promise((resolve, reject) => {

			bcrypt.compare(password, user.password, (err, res) => {
				if (!res) {
					//if passwords do not match
					reject();
				} else {
					//resolve the promise with 'user'
					resolve(user);
				}
			});
		});
	});
};

userSchema.methods.removeToken = function (token) {
	var user = this;

	//returning allows us to chain the calls in server.js
	return user.update({
		//'$pull' removes itmes from array that fit certain criteria
		$pull: {
			// tokens:{
			// 	//remove if token passed into func matches token in the document
			// 	token: token
			// }
			// Can be simplified: 
			tokens: {token}
		}
	});
}

userSchema.pre('save', function (next) {
	var user = this;

	if (user.isModified('password')) {
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(user.password, salt, (err, hash) => {
				user.password = hash;
				next();
			});
		});
	} else {
		next();
	}
});

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
