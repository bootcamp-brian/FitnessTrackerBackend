/* eslint-disable no-useless-catch */
const express = require("express");
const { UserTakenError, PasswordTooShortError, UnauthorizedError } = require("../errors");
const usersRouter = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const { createUser, getUserByUsername, getUser, getUserById, getPublicRoutinesByUser, getAllRoutinesByUser } = require('../db');
const { checkAuthorization } = require("./utils");

// POST /api/users/register
usersRouter.post('/register', async (req, res, next) => {
    // destructure required user data from request body
    const { username, password } = req.body;
  
    try {
      // checks to see if the username provided is already in use
      const _user = await getUserByUsername(username);
  
      if (_user) {
        next({
            error: '403',
            name: 'UserTakenError',
            message: UserTakenError(username)
        });
      }
  
      if (password.length < 8) {
        next({
            error: '400',
            name: 'PasswordTooShortError',
            message: PasswordTooShortError()
        })
      }
      // creates new user using provided data
      const user = await createUser({ username, password });
  
      // creates token for newly registered user and sends it
      const token = jwt.sign({ 
        id: user.id, 
        username
      }, process.env.JWT_SECRET, {
        expiresIn: '1w'
      });
  
      res.send({ 
        message: "you're signed up!",
        token,
        user 
      });
    } catch ({ error, name, message }) {
      next({ error, name, message });
    } 
  });

// POST /api/users/login
usersRouter.post('/login', async (req, res, next) => {
    // destructure username & password from request body
    const { username, password } = req.body;

    try {
        const user = await getUser({ username, password });

        if (!user) {
            next({
                error: '400',
                name: 'IncorrectCredentials Error',
                message: 'Incorrect username or password'
            })
        }
        
        const token = jwt.sign({ id: user.id, username }, JWT_SECRET);
        res.send({ 
            message: "you're logged in!",
            token,
            user 
        });
    } catch ({ error, name, message }) {
      next({ error, name, message });
    } 
});

// GET /api/users/me
usersRouter.get('/me', checkAuthorization, async (req, res, next) => {
    try {
        res.send(req.user);
    } catch ({ error, name, message }) {
        next({ error, name, message });
    } 
})

// GET /api/users/:username/routines
usersRouter.get('/:username/routines', checkAuthorization, async (req, res, next) => {
    try {
        const { username } = req.params;
        if (username === req.user.username) {
            const routines = await getAllRoutinesByUser({ username });
            res.send(routines);
        } else {
            const routines = await getPublicRoutinesByUser({ username });
            res.send(routines);
        }
    } catch ({ error, name, message }) {
        next({ error, name, message })
    }
})
module.exports = usersRouter;
