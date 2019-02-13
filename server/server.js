const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

const {mongoose} = require('./db/mongoose.js');
const {Todo} = require('./models/todo.js');
const {User} = require('./models/user.js');
const {authenticate} = require('./middleware/authenticate.js');

var app = express();

app.use(bodyParser.json());

//POST /todos
//creating resources
app.post('/todos', (req, res) => {
    let todo = new Todo({
        text: req.body.text 
    });
    
    todo.save().then((doc) => {
        res.send(doc);
    }, (err) => {
        res.status(400).send(err); 
    });
});

// GET /todos
// listing resources
app.get('/todos', (req, res) => {
    Todo.find(req.body).then((todos) => {
        res.send({todos});
    }, (err) => {
        res.status(400).send(err);
    }); 
});

// GET /todos/:id
// reading a resource by id
app.get(`/todos/:id`, (req, res) => {
    let id = req.params.id;
    
    //validate id
    if ( !ObjectID.isValid(id) ) {
        res.status(404).send();    
    }
    
    //find and return doc by id
    Todo.findById(id).then((todo) => {
        if (!todo) {
            return res.status(404).send();
        } 
        
        res.send({todo})
    }).catch((err) => {
        res.status(400).send()
    });
});

// DELETE /todos/:id
// deleting a resource by id
app.delete('/todos/:id', (req, res) => {
    let id = req.params.id;
    
    //validate id
    if ( !ObjectID.isValid(id) ) {
        res.status(404).send();    
    }
    
    //delete and return doc by id
    Todo.findByIdAndRemove(id).then((todo) => {
        if (!todo) {
            return res.status(404).send();
        } 
        
        res.send({todo})
    }).catch((err) => {
        res.status(400).send();
    });  
});

// PATCH /todos/:id
// updating a resource
app.patch('/todos/:id', (req, res) => {
    let id = req.params.id;
    //takes an object, then array of 
    //properties that we need to pick and put into 'body'
    let body = _.pick(req.body, ['text', 'completed']);

    //validate id
    if ( !ObjectID.isValid(id) ) {
        res.status(404).send();    
    }

    //update the completedAt property
    if (_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }

    //update the todo doc
    Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then((todo) => {
        if (!todo) {
            return res.status(404).send();
        }

        res.send({todo});
    }).catch((err) => {
        res.status(400).send()
    });
});

// POST /users
app.post('/users', (req, res) => {
    //create an object by taking 'email' and 'password' from the request object 
    let body = _.pick(req.body, ['email', 'password']);
    let user = new User(body);
    
    //save the new user into the db
    user.save().then(() => {
        //create new auth token for the new user
        return user.generateAuthToken();
    }).then((token) => {
        res.header('x-auth', token).send(user);
    }).catch((err) => {
        res.status(400).send();
    });
});

// GET /users/me
//requires a valid 'x-auth' token to work
app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});

//POST /users/login
 app.post('/users/login', (req, res) => {
    var body = _.pick(req.body, ['email', 'password']);

    User.findByCredentials(body.email, body.password).then((user) => {
        //creates a new 'x-auth' token when user logs in successfully
        return user.generateAuthToken().then((token) => {
            //show the value of the token in the header
            res.header('x-auth', token).send(user);
        });
    }).catch ((err) => {
        res.status(400).send();
    });
 });

//DELETE /users/me/token
//occurs when user logs out, can only do so when 
app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send();
    }, () => {
        res.status(400).send();
    });
});


app.listen(3000, () => {
   console.log('Started on port 3000'); 
});

