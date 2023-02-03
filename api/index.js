const express = require('express');
const router = express.Router();

// GET /api/health
router.get('/health', async (req, res, next) => {
    try {
        res.send({ message: "All is well" });
    } catch (error) {
        next(error);
    }
});

// ROUTER: /api/users
const usersRouter = require('./users');
router.use('/users', usersRouter);

// ROUTER: /api/activities
const activitiesRouter = require('./activities');
router.use('/activities', activitiesRouter);

// ROUTER: /api/routines
const routinesRouter = require('./routines');
router.use('/routines', routinesRouter);

// ROUTER: /api/routine_activities
const routineActivitiesRouter = require('./routineActivities');
router.use('/routine_activities', routineActivitiesRouter);

// error handling middleware
router.use((error, req, res, next) => {
    res.send({
        error: error.error,
        name: error.name,
        message: error.message
    });
});

router.use((req, res, next) => {
    res.status(404).send({
        error: '404',
        name: 'PageNotFoundError',
        message: 'Page not found'
    })
  })

module.exports = router;
