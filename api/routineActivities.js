const express = require('express');
const { updateRoutineActivity, getRoutineActivityById, getRoutineById, destroyRoutineActivity } = require('../db');
const { UnauthorizedUpdateError, UnauthorizedDeleteError } = require('../errors');
const { checkAuthorization } = require('./utils');
const routineActivitiesRouter = express.Router();

// PATCH /api/routine_activities/:routineActivityId
routineActivitiesRouter.patch('/:routineActivityId', checkAuthorization, async (req, res, next) => {
    try {
        const { id: userId, username } = req.user;
        const params = req.params;
        const id = Number(params.routineActivityId);
        const { ...fields } = req.body;

        const routineActivity = await getRoutineActivityById(id);
        const routine = await getRoutineById(routineActivity.routineId);

        if (routine.creatorId !== userId) {
            res.status(403);
            next({
                error: '403',
                name: 'UnauthorizedUpdateError',
                message: UnauthorizedUpdateError(username, routine.name)
            })
        } else if (!routineActivity) {
            res.status(404);
            next({
                error: '404',
                name: 'RoutineActivityNotFoundError',
                message: 'Routine activity not found'
            })
        } else {
            const updatedRoutineActivity = await updateRoutineActivity({ id, ...fields });
            res.send(updatedRoutineActivity);
        }
    } catch ({ error, name, message }) {
        next({ error, name, message });
    }
})

// DELETE /api/routine_activities/:routineActivityId
routineActivitiesRouter.delete('/:routineActivityId', checkAuthorization, async (req, res, next) => {
    try {
        const { id: userId, username } = req.user;
        const params = req.params;
        const id = Number(params.routineActivityId);

        const routineActivity = await getRoutineActivityById(id);
        const routine = await getRoutineById(routineActivity.routineId);

        if (routine.creatorId !== userId) {
            res.status(403);
            next({
                error: '403',
                name: 'UnauthorizedDeleteError',
                message: UnauthorizedDeleteError(username, routine.name)
            })
        } else if (!routineActivity) {
            res.status(404);
            next({
                error: '404',
                name: 'RoutineActivityNotFoundError',
                message: 'Routine activity not found'
            })
        } else {
            const deletedRoutineActivity = await destroyRoutineActivity(id);
            res.send(deletedRoutineActivity);
        }
    } catch ({ error, name, message }) {
        next({ error, name, message });
    }
})

module.exports = routineActivitiesRouter;
