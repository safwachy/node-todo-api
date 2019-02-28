const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server.js');
const {Todo} = require('./../models/todo.js');
const {User} = require('./../models/user.js');
const {
	todosTestData, 
	populateTodos, 
	usersTestData, 
	populateUsers
} = require('./seed/seed.js');

//runs before each test case
beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST todos', () => {
	it('should create a new todo', (done) => {
		var text = 'test todo text';

		request(app)
			.post('/todos')
			.set('x-auth', usersTestData[0].tokens[0].token)
			.send({text})
			.expect(200)
			.expect((res) => {
				expect(res.body.text).toBe(text);
			})
			.end((err, res) => {
				if (err) return done(err);

				Todo.find({text}).then((todos) => {
					expect(todos.length).toBe(1);
					expect(todos[0].text).toBe(text);
					done();
				}).catch((err) => done(err));
			});
	});

	it('should not create todo with invalid body data', (done) => {
		request(app)
			.post('/todos')
			.set('x-auth', usersTestData[0].tokens[0].token)
			.send({})
			.expect(400)
			.end((err, res) => {
				if (err) return done(err);

				Todo.find().then((todos) => {
					expect(todos.length).toBe(2);
					done();
				}).catch((err) => done(err));
			});
	});
});

describe('GET /todos', () => {
	it('should get all todos', (done) => {
		request(app)
			.get('/todos')
			.set('x-auth', usersTestData[0].tokens[0].token)
			.expect(200)
			.expect((res) => {
				expect(res.body.todos.length).toBe(1);
			})
			.end(done);
	});
});

describe('GET /todos/:id', () => {
	it('should return todo doc', (done) => {
		request(app)
			.get(`/todos/${todosTestData[0]._id.toHexString()}`)
			.set('x-auth', usersTestData[0].tokens[0].token)
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.text).toBe(todosTestData[0].text);
			})
			.end(done);
	});

	it('should not return todo doc created by other user', (done) => {
		request(app)
			.get(`/todos/${todosTestData[1]._id.toHexString()}`)
			.set('x-auth', usersTestData[0].tokens[0].token)
			.expect(404)
			.end(done);
	});

	it('should return 404 if todo not found', (done) => {
		var hexID = new ObjectID().toHexString();

		request(app)
			.get(`/todos/${hexID}`)
			.set('x-auth', usersTestData[0].tokens[0].token)
			.expect(404)
			.end(done);
	});

	it('should return 404 if object ID is invalid', (done) => {
		request(app)
			.get('/todos/123')
			.set('x-auth', usersTestData[0].tokens[0].token)
			.expect(404)
			.end(done);
	});
}); 

describe('DELETE /todos/:id', () => {
	it('should remove a todo', (done) => {
		var hexID = todosTestData[1]._id.toHexString();

		request(app)
			.delete(`/todos/${hexID}`)
			.set('x-auth', usersTestData[1].tokens[0].token)
			.expect(200)
			.expect((res) => {
				expect(res.body.todo._id).toBe(hexID);
			})
			.end((err, res) =>{
				if(err) return done(err);

				//fetch todo from db and make assertions
				Todo.findById(hexID).then((todo) => {
					expect(todo).toBeFalsy();
					done();
				}).catch((err) => done(err));
			});
	});

	it('should return 404 if todo not found', (done) => {
		var hexID = todosTestData[1]._id.toHexString();

		request(app)
			.delete(`/todos/${hexID}`)
			.set('x-auth', usersTestData[1].tokens[0].token)
			.expect(404)
			.end((err, res) =>{
				if(err) return done(err);

				//fetch todo from db and make assertions
				Todo.findById(hexID).then((todo) => {
					expect(todo).toBeTruthy();
					done();
				}).catch((err) => done(err));
			});
	});

	it('should return 404 if todo not found', (done) => {
		var hexID = new ObjectID().toHexString();

		request(app)
			.delete(`/todos/${hexID}`)
			.set('x-auth', usersTestData[1].tokens[0].token)
			.expect(404)
			.end(done);
	});

	it('should return 404 if object ID is invalid', (done) => {
		request(app)
			.delete('/todos/123')
			.set('x-auth', usersTestData[1].tokens[0].token)
			.expect(404)
			.end(done);
	});
});

describe('PATCH /todos/:id', () => {
	it('should update the todo', (done) => {
		var hexId = todosTestData[0]._id.toHexString();
		var text = 'Updated text';

		request(app)
			.patch(`/todos/${hexId}`)
			.set('x-auth', usersTestData[0].tokens[0].token)
			.send({
				completed: true,
				text: text
			})
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.text).toBe(text);
				expect(res.body.todo.completed).toBe(true);
				expect(typeof res.body.todo.completedAt).toBe('number');
			})
			.end(done);
	});

	it('should clear completedAt when todo is not completed', (done) => {
		var hexId = todosTestData[1]._id.toHexString();
		var text = 'Updated text!!';

		request(app)
			.patch(`/todos/${hexId}`)
			.set('x-auth', usersTestData[1].tokens[0].token)
			.send({
				completed: false,
				text
			})
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.text).toBe(text);
				expect(res.body.todo.completed).toBe(false);
				expect(res.body.todo.completedAt).toBeFalsy();
			})
			.end(done);
	});
});

describe('GET /users/me', () => {
	it('should return user if authenticated', (done) => {
		request(app)
			.get('/users/me')
			.set('x-auth', usersTestData[0].tokens[0].token)
			.expect(200)
			.expect((res) => {
				expect(res.body._id).toBe(usersTestData[0]._id.toHexString());
				expect(res.body.email).toBe(usersTestData[0].email);
			})
			.end(done);
	});

	it('should return 401 if not authenticated', (done) => {
		request(app)
			.get('/users/me')
			.expect(401)
			.expect((res) => {
				expect(res.body).toEqual({})
			})
			.end(done);
	});
});

describe('POST /users', () => {
	it('should create a user', (done) => {
		var email = 'example@email.com';
		var password = 'abc1234';

		request(app)
			.post('/users')
			.send({email, password})
			.expect(200)
			.expect((res) => {
				expect(res.headers['x-auth']).toBeTruthy();//cannot use dot operator for 'headers' b/c the header has a hyphen
				expect(res.body._id).toBeTruthy();
				expect(res.body.email).toBe(email);
			})
			.end((err) => {
				if (err) return done(err);

				//fetch user from db and ake assertions
				User.findOne({email}).then((user) => {
					expect(user).toBeTruthy();
					expect(user.password).not.toBe(password);//if the passwords are equal, then the password is not being hashed
					done();
				}).catch((err) => done(err));
			});
	});

	it('should return validation error if request invalid', (done) => {
		request(app)
			.post('/users')
			.send({
				email: 'invalidEmail',
				password: '123'
			})
			.expect(400)
			.end(done);
	});

	it('should not create user if email in use', (done) => {
		request(app)
			.post('/users')
			.send({
				email: usersTestData[0].email,
				password: 'password123'
			})
			.expect(400)
			.end(done);
	});
});

describe('POST /users/login', () => {
	it('should login user and return auth token', (done) => {
		request(app)
			.post('/users/login')
			.send({
				email: usersTestData[1].email,
				password :usersTestData[1].password
			})
			.expect(200)
			.expect((res) => {
				expect(res.headers['x-auth']).toBeTruthy();
			})
			.end((err, res) => {
				if (err) return done(err);

				User.findById(usersTestData[1]._id).then((user) => {
					expect(user.toObject().tokens[1]).toMatchObject({
						access: 'auth',
						token: res.headers['x-auth']
					});
					done();
				}).catch((err) => done(err));
			});
	});

	it('should reject invalid login', (done) => {
		request(app)
			.post('/users/login')
			.send({
				email: usersTestData[1].email,
				password: 'invalidPassword'
			})
			.expect(400)
			.expect((res) => {
				expect(res.headers['x-auth']).toBeFalsy();
			})
			.end((err, res) => {
				if (err) return done(err);

				User.findById(usersTestData[1]._id).then((user) => {
					expect(user.tokens.length).toBe(1);
					done();
				}).catch((err) => done(err));
			});	
	});
});

describe('DELETE /users/me/token', () => {
	it('should remove x-auth token on logout', (done) => {
		request(app)
			.delete('/users/me/token')
			.set('x-auth', usersTestData[0].tokens[0].token)
			.expect(200)
			.end((err, res) => {
				if (err) return done(err);

				User.findById(usersTestData[0]._id).then((user) => {
					expect(user.tokens.length).toBe(0);
					done()
				}).catch((err) => done(err));
			});
	});
});