const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express());

let db = null;
const Path = require("path");
const dbPath = Path.join(__dirname, "covid19India.db");
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DATABASE ERROR : ${error}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
//API GET METHOD API1;
app.get("/states/", async (request, response) => {
  const allStateQuery = `
    SELECT *
    FROM state
    ;`;

  const allstate = await db.all(allStateQuery);
  response.send(
    allstate.map((each) => {
      return convertDbObjectToResponseObject(each);
    })
  );
});
//API GET METHOD2 API2 //
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const singleStateQuery = `
    SELECT  * 
    FROM state
    WHERE state_id = ${stateId};`;

  const statesingle = await db.get(singleStateQuery);
  response.send(convertDbObjectToResponseObject(statesingle));
});

///////////////////////

const convertDistrictObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.districtId,
    districtName: dbObject.districtName,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//POST API 3 DISTRICT;
app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
  INSERT INTO
    district (state_id, district_name, cases, cured, active, deaths)
  VALUES
    (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

// API GET DISTRICT API 4 GET ;

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsQuery = `
    SELECT
      *
    FROM
     district
    WHERE
      district_id = ${districtId};`;
  const district = await db.get(getDistrictsQuery);
response.send(convertDistrictObjectToResponseObject(district))
});

//DELETE API DISTRICT API 5 ;

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId} 
  `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//DISTRICT API PUT API 6;
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
  UPDATE
    district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active}, 
    deaths = ${deaths}
  WHERE
    district_id = ${districtId};
  `;

  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//DISTRICT API 8 METHOD ;

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id = ${districtId};`;
  const state = await db.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});

//API 7 STATES GET ;

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getCaseDetails = `
    SELECT 
    sum(cases) as totalCases ,
    sum(cured) as totalCured,
    sum(active) as totalActive,
    sum(deaths) as totalDeaths,
    FROM 
    district
    NATURAL JOIN
    STATE
    WHERE state_id = ${stateId}
    `;
  const getcase = await db.get(getCaseDetails);
  response.send({
    totalCases: getcase.totalCases,
    totalCured: getcase.totalCured,
    totalActive: getcase.totalActive,
    totalDeaths: getcase.totalDeaths,
  });
});

module.exports = app;
