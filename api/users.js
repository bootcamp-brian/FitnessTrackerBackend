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
    const { username, password } = req.body;
  
    try {
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

      const user = await createUser({ username, password });
  
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
usersRouter.get('/:username/routines', async (req, res, next) => {
    try {
      const prefix = 'Bearer ';
      const auth = req.header('Authorization');
      const { username } = req.params;
    
      if (!auth) {
        const routines = await getPublicRoutinesByUser({ username });
        res.send(routines);
      } else if (auth.startsWith(prefix)) {
        const token = auth.slice(prefix.length);

        const { id } = jwt.verify(token, JWT_SECRET);
    
        if (id) {
          req.user = await getUserById(id);
          if (username === req.user.username) {
            const routines = await getAllRoutinesByUser({ username });
            res.send(routines);
          } else {
            const routines = await getPublicRoutinesByUser({ username });
            res.send(routines);
          }
        } else {
          next({
            error: '404',
            name: 'UserNotFound Error',
            message: 'User not found'
          })
        }
      }
    } catch ({ error, name, message }) {
      next({ error, name, message })
    }
})
module.exports = usersRouter;
