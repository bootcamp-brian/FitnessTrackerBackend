const client = require("./client");
const { getRoutineActivitiesByRoutine } = require("./routine_activities");

async function createRoutine({ creatorId, isPublic, name, goal }) {
  try {
      const { rows: [ routine ] } = await client.query(`
      INSERT INTO routines("creatorId", "isPublic", name, goal)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (name) DO NOTHING
      RETURNING *;
      `, [ creatorId, isPublic, name, goal ]);

      return routine;
  } catch (error) {
      throw error;
  }
}

async function getRoutineById(id) {
  try {
    const { rows: [ routine ] } = await client.query(`
        SELECT * FROM routines
        WHERE id=${ id };
    `);

    return routine;
  } catch (error) {
    throw error;
  }
}

async function getRoutinesWithoutActivities() {
  try {
    const { rows } = await client.query(`
        SELECT routines.id, "creatorId", "isPublic", name, goal, username as "creatorName"
        FROM routines
        JOIN users ON routines."creatorId"=users.id;
    `);

    return rows;
  } catch (error) {
    throw error;
  }
}

async function getAllRoutines() {
  try {
    const routines = await getRoutinesWithoutActivities();

    const routinesWithActs = await Promise.all(routines.map( async (routine) => {
      const routineActivities = await getRoutineActivitiesByRoutine({ id: routine.id });
      
      routine.activities = routineActivities;
      return routine;
    }));
    
    return routinesWithActs;
  } catch (error) {
    throw error;
  }
}

async function getAllPublicRoutines() {
  try {
    const allRoutines = await getAllRoutines();
    
    const publicRoutines = allRoutines.filter(routine => routine.isPublic ? true : false);

    return publicRoutines;
  } catch (error) {
    throw error;
  }
}

async function getAllRoutinesByUser({ username }) {
  try {
    const allRoutines = await getAllRoutines();
    
    const routinesByUser = allRoutines.filter(routine => routine.creatorName === username ? true : false);
    
    return routinesByUser;
  } catch (error) {
    throw error;
  }
}

async function getPublicRoutinesByUser({ username }) {
  try {
    const allPublicRoutines = await getAllPublicRoutines();
    
    const publicRoutinesByUser = allPublicRoutines.filter(routine => routine.creatorName === username ? true : false);
    
    return publicRoutinesByUser;
  } catch (error) {
    throw error;
  }
}

async function getPublicRoutinesByActivity({ id }) {
  try {
    const allPublicRoutines = await getAllPublicRoutines();
    
    const publicRoutinesByActivity = allPublicRoutines.filter(routine => {
      const { activities } = routine;
      let containsActivity = false;
      for (let activity of activities) {
        if (activity.id === id) {
          containsActivity = true;
        }
      }
      return containsActivity;
    });

    return publicRoutinesByActivity;
  } catch (error) {
    throw error;
  }
}

async function updateRoutine({ id, ...fields }) {
  const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
  ).join(', ');

  if (setString.length === 0) {
      return;
  }

  try {
    const { rows: [ routine ] } = await client.query(`
        UPDATE routines
        SET ${ setString }
        WHERE id='${ id }'
        RETURNING *;
    `, Object.values(fields));

    return routine;
  } catch (error) {
      throw error;
  }
}

async function destroyRoutine(id) {
  try {
    await client.query(`
    DELETE FROM routine_activities WHERE "routineId"=${ id };
    DELETE FROM routines WHERE id=${ id };
    `)
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  getRoutineById,
  getRoutinesWithoutActivities,
  getAllRoutines,
  getAllPublicRoutines,
  getAllRoutinesByUser,
  getPublicRoutinesByUser,
  getPublicRoutinesByActivity,
  createRoutine,
  updateRoutine,
  destroyRoutine,
};
