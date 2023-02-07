const client = require('./client');

async function createActivity({ name, description }) {
  try {
    const { rows: [ activity ] } = await client.query(`
      INSERT INTO activities(name, description)
      VALUES ($1, $2)
      ON CONFLICT (name) DO NOTHING
      RETURNING *;
    `, [ name, description ]);

    return activity;
  } catch (error) {
      console.log(error);
  }
}

async function getAllActivities() {
  try {
    const { rows } = await client.query(`
      SELECT * FROM activities;
    `)

    return rows;
  } catch (error) {
    console.log(error);
  }
}

async function getActivityById(id) {
  try {
    const { rows: [ activity ] } = await client.query(`
      SELECT * FROM activities
      WHERE id='${ id }';
    `)

    return activity;
  } catch (error) {
    console.log(error);
  }
}

async function getActivityByName(name) {
  try {
    const { rows: [ activity ] } = await client.query(`
      SELECT * FROM activities
      WHERE name='${ name }';
    `)

    return activity;
  } catch (error) {
    console.log(error);
  }
}

async function attachActivitiesToRoutines(routines) {
  try {
    const { rows: activities } = await client.query(`
      SELECT activities.*, "routineId", duration, count, routine_activities.id as "routineActivityId"
      FROM activities
      JOIN routine_activities ON "activityId"=activities.id;
    `);

    const routinesWithActs = routines.map(routine => {
      const routineActivities = [];
      for (let activity of activities) {
        if (activity.routineId === routine.id) {
          routineActivities.push(activity);
        }
      }
      routine.activities = routineActivities;
      return routine;
    });

    return routinesWithActs;
  } catch (error) {
    console.log(error)
  }
}

async function updateActivity({ id, ...fields }) {
  const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
  ).join(', ');

  if (setString.length === 0) {
      return;
  }

  try {
    const { rows: [ activity ] } = await client.query(`
        UPDATE activities
        SET ${ setString }
        WHERE id='${ id }'
        RETURNING *;
    `, Object.values(fields));

    return activity;
  } catch (error) {
      console.log(error);
  }
}

module.exports = {
  getAllActivities,
  getActivityById,
  getActivityByName,
  attachActivitiesToRoutines,
  createActivity,
  updateActivity,
};
