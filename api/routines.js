const express = require('express');
const { getAllPublicRoutines, createRoutine, updateRoutine, getRoutineById, destroyRoutine, addActivityToRoutine, getActivityById } = require('../db');
const { UnauthorizedUpdateError, UnauthorizedDeleteError, DuplicateRoutineActivityError } = require('../errors');
const { checkAuthorization } = require('./utils');
const routinesRouter = express.Router();

// GET /api/routines
routinesRouter.get('/', async (req, res, next) => {
    try {
        const routines = await getAllPublicRoutines();
        res.send(routines);
    } catch ({ error, name, message }) {
        next({ error, name, message });
    }
})

// POST /api/routines/:routineId/activities

routinesRouter.post('/:routineId/activities',  async (req, res, next) => {
    try {
        const {
            activityId,
            count,
            duration,
        } = req.body;
        const params = req.params;
        const routineId = Number(params.routineId);

        const routine = await getRoutineById(routineId);
        const activity = await getActivityById(activityId);

        if (!routine) {
            res.status(404);
            next({
                error: '404',
                name: 'RoutineNotFoundError',
                message: 'Routine not found'
            })
        } else if (!activity) {
            res.status(404);
            next({
                error: '404',
                name: 'ActivityNotFoundError',
                message: 'Activity not found'
            })
        } else {
            const routineActivity = await addActivityToRoutine({
                routineId,
                activityId,
                count,
                duration,
            })
            if (!routineActivity) {
                next({
                    error: '400',
                    name: 'DuplicateRoutineActivityError',
                    message: DuplicateRoutineActivityError(routineId, activityId)
                })
            } else {
                res.send(routineActivity);
            }
        }
    } catch ({ error, name, message }) {
        next({ error, name, message });
    }
})

// POST /api/routines
routinesRouter.post('/', checkAuthorization, async (req, res, next) => {
    try {
        const { isPublic, name, goal } = req.body;
        const { id: creatorId } = req.user;
        const routine = await createRoutine({ creatorId, isPublic, name, goal });

        if (!routine) {
            next({
                error: '400',
                name: 'RoutineCreationError',
                message: 'Unable to create routine'
            })
        } else {
            res.send(routine);  
        }
    } catch ({ error, name, message }) {
        next({ error, name, message });
    }
})

// PATCH /api/routines/:routineId
routinesRouter.patch('/:routineId', checkAuthorization, async (req, res, next) => {
    try {
        const { id: userId, username } = req.user;
        const { ...fields } = req.body;
        const { routineId: id } = req.params;

        const routine = await getRoutineById(id);

        if (!routine) {
            res.status(404);
            next({
                error: '404',
                name: 'RoutineNotFoundError',
                message: 'Routine not found'
            })
        } else if (routine.creatorId !== userId) {
            res.status(403);
            next({
                error: '403',
                name: 'UnauthorizedUpdateError',
                message: UnauthorizedUpdateError(username, routine.name)
            })
        } else {
            const updatedRoutine = await updateRoutine({ id, ...fields });

            if (!updatedRoutine) {
                next({
                    error: '400',
                    name: 'RoutineUpdateError',
                    message: 'Unable to update routine'
                })
            } else {
                res.send(updatedRoutine);  
            }
        }

    } catch ({ error, name, message }) {
        next({ error, name, message });
    }
})
// DELETE /api/routines/:routineId
routinesRouter.delete('/:routineId', checkAuthorization, async (req, res, next) => {
    try {
        const { id: userId, username } = req.user;
        const { routineId: id } = req.params;

        const routine = await getRoutineById(id);

        if (!routine) {
            res.status(404);
            next({
                error: '404',
                name: 'RoutineNotFoundError',
                message: 'Routine not found'
            })
        } else if (routine.creatorId !== userId) {
            res.status(403);
            next({
                error: '403',
                name: 'UnauthorizedDeleteError',
                message: UnauthorizedDeleteError(username, routine.name)
            })
        } else {
            const deletedRoutine = await destroyRoutine(id);
            res.send(deletedRoutine);
        }
    } catch ({ error, name, message }) {
        next({ error, name, message });
    }
})

module.exports = routinesRouter;
