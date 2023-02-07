const client = require("./client");

async function addActivityToRoutine({
  routineId,
  activityId,
  count,
  duration,
}) {
  try {
    const { rows: [ routineActivity ] } = await client.query(`
      INSERT INTO routine_activities("routineId", "activityId", count, duration)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT ("routineId", "activityId") DO NOTHING
      RETURNING *;
      `, [ routineId, activityId, count, duration ]);

    return routineActivity;
  } catch (error) {
      console.log(error);
  }
}

async function getRoutineActivityById(id) {
  try {
    const { rows: [routineActivity] } = await client.query(`
      SELECT * FROM routine_activities
      WHERE id=${id};
    `)

    return routineActivity;
  } catch (error) {
    console.log(error);
  }
}

async function getRoutineActivitiesByRoutine({ id }) {
  try {
    const { rows: routineActivities } = await client.query(`
      SELECT * FROM routine_activities
      WHERE "routineId"=${id}
    `)
    
    return routineActivities;
  } catch (error) {
    console.log(error)
  }
}

async function updateRoutineActivity({ id, ...fields }) {
  const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
  ).join(', ');

  if (setString.length === 0) {
      return;
  }

  try {
    const { rows: [ routineActivity ] } = await client.query(`
        UPDATE routine_activities
        SET ${ setString }
        WHERE id='${ id }'
        RETURNING *;
    `, Object.values(fields));

    return routineActivity;
  } catch (error) {
      console.log(error);
  }
}

async function destroyRoutineActivity(id) {
  try {
    const { rows: [ routine ] } = await client.query(`
    SELECT * FROM routine_activities WHERE id=${ id };
    `);
   
    await client.query(`
    DELETE FROM routine_activities WHERE id=${ id };
    `);

    return routine;
  } catch (error) {
    console.log(error);
  }
}

async function canEditRoutineActivity(routineActivityId, userId) {
  try {
    const { rows: [ result ] } = await client.query(`
      SELECT routines."creatorId" FROM routines
      JOIN routine_activities as rout_acts ON rout_acts."routineId"=routines.id
      WHERE rout_acts.id=${routineActivityId};
    `)
    
    const { creatorId } = result;
    
    if (creatorId === userId) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  getRoutineActivityById,
  addActivityToRoutine,
  getRoutineActivitiesByRoutine,
  updateRoutineActivity,
  destroyRoutineActivity,
  canEditRoutineActivity,
};
