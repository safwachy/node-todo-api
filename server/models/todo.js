const mongoose = require('mongoose');
var Schema = mongoose.Schema;

/////////////////////////////////////////////////
//Conventional way to create model
//adds more flexibility to model
var todoSchema = new Schema({
    text: {
        type: String,
        // setting required to true means that the value must exist
        // therefore 'text' property must exist
        required: true,
        // sets min length of string
        minlength: 1,
        // removes leading and trailing spaces
        trim: true
    
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Number,
        default: null
    }
});

var Todo = mongoose.model('Todo', todoSchema);

module.exports = {Todo};

/////////////////////////////////////////////////
//Other way to create model
// var Todo = mongoose.model('Todo', {
//     text: {
//         type: String,
//         //setting required to true means that the value must exist
//         //therefore 'text' property must exist
//         required: true,
//         //sets min length of string
//         minlength: 1,
//         //removes leading and trailing spaces
//         trim: true
    
//     },
//     completed: {
//         type: Boolean,
//         default: false
//     },
//     completedAt: {
//         type: Number,
//         default: null
//     }
// });


