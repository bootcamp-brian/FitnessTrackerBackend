const express = require('express');
const { getPublicRoutinesByActivity, createActivity, updateActivity, getActivityByName } = require('../db');
const client = require('../db/client');
const { ActivityNotFoundError, ActivityExistsError } = require('../errors');
const { checkAuthorization } = require('./utils');
const activitiesRouter = express.Router();

// GET /api/activities
activitiesRouter.get('/', async (req, res, next) => {
    try {
        const { rows: activities } = await client.query(`
            SELECT * FROM activities;
        `)
        res.send(activities);
    } catch ({ error, name, message }) {
        next({ error, name, message});
    }
})

// GET /api/activities/:activityId/routines
activitiesRouter.get('/:activityId/routines', async (req, res, next) => {
    try {
        const { activityId } = req.params;
        const routines = await getPublicRoutinesByActivity({ id: Number(activityId) });
        
        if (routines.length > 0) {
            res.send(routines);
        } else {
            next({
                error: '404',
                name: 'ActivityNotFoundError',
                message: ActivityNotFoundError(activityId)
            });
        }
    } catch ({ error, name, message }) {
        next({ error, name, message });
    }
})

// POST /api/activities
activitiesRouter.post('/', checkAuthorization, async (req, res, next) => {
    try {
        const { name, description } = req.body;

        const activity = await createActivity({ name, description });

        if (!activity) {
            next({
                error: '400',
                name: 'ActivityExistsError',
                message: ActivityExistsError(name)
            })
        } else {
            res.send(activity);
        }
    } catch ({ error, name, message }) {
        next({ error, name, message });
    }
})

// PATCH /api/activities/:activityId
activitiesRouter.patch('/:activityId', checkAuthorization, async (req, res, next) => {
    try {
        const { activityId: id } = req.params;
        const { ...fields } = req.body;

        const activityByName = await getActivityByName(fields.name);
        
        if (activityByName) {
            next({
                error: '400',
                name: 'ActivityExistsError',
                message: ActivityExistsError(fields.name)
            })
        } else {
            const activity = await updateActivity({ id, ...fields });

            if (!activity) {
                next({
                    error: '404',
                    name: 'ActivityNotFoundError',
                    message: ActivityNotFoundError(id)
                })
            } else {
                res.send(activity);
            }
        }
    } catch ({ error, name, message }) {
        next({ error, name, message });
    }
})

module.exports = activitiesRouter;
