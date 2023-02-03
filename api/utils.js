const express = require('express');
const { UnauthorizedError } = require('../errors');
const jwt = require('jsonwebtoken');
const { getUserById } = require('../db');
const { JWT_SECRET } = process.env;

const checkAuthorization = async (req, res, next) => {
    const prefix = 'Bearer ';
    const auth = req.header('Authorization');
  
    // checks for auth in request header
    if (!auth) {
        res.status(401);
        next({
            error: '401',
            name: 'UnauthorizedError',
            message: UnauthorizedError()
        });
    } else if (auth.startsWith(prefix)) {
      // grabs token from auth in request header
      const token = auth.slice(prefix.length);
  
      try {
        // decodes id from token
        const { id } = jwt.verify(token, JWT_SECRET);
  
        // checks for id from token
        if (id) {
          // uses id from token to get user data and attaches it to the request object
          req.user = await getUserById(id);
          next();
        }
      } catch ({ error, name, message }) {
        next({ error, name, message });
      }
    } else {
      next({
        error: '401',
        name: 'UnauthorizedError',
        message: UnauthorizedError()
      });
    }
}

module.exports = {
    checkAuthorization
}