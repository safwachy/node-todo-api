const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Todo} = require('./../../models/todo.js');
const {User} = require('./../../models/user.js');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();
const usersTestData = [{
	_id: userOneId,
	email: 'saf@email.com',
	password: 'abc123456',
	tokens: [{
		access: 'auth',
		token: jwt.sign({_id: userOneId, access: 'auth'}, 'testSecretValue').toString()
	}]
}, {
	_id: userTwoId,
	email: 'test@email.com',
	password: 'ABC123456',
		tokens: [{
		access: 'auth',
		token: jwt.sign({_id: userOneId, access: 'auth'}, 'testSecretValue').toString()
	}]
}];

const todosTestData = [{
	_id: new ObjectID(),
	text: 'first test todo',
	_creator: userOneId
}, {
	_id: new ObjectID(),
	text: 'second test todo',
	completed: true,
	completedAt: 123,
	_creator: userTwoId
}];

const populateTodos = (done) => {
	Todo.remove({}).then(() => {
		return Todo.insertMany(todosTestData);
	}).then(() => done());
};

const populateUsers = (done) => {
	User.remove({}).then(() => {
		var userOne = new User(usersTestData[0]).save();
		var userTwo = new User(usersTestData[1]).save();

		//will wait for all the 'save()' actions to complete
		return Promise.all([userOne, userTwo])
	}).then(() => done());
};

module.exports = {
	todosTestData, 
	populateTodos, 
	usersTestData, 
	populateUsers
};