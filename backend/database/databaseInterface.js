// databaseInterface.js

const { getXataClient } = require("../src/xata");
const xata = getXataClient();
const { gt } = require("@xata.io/client");
const bcrypt = require('bcryptjs');

/**
 * Inserts economic data records into the Xata database.
 * @param {Array} economicData - Array of filtered and normalized economic data objects.
 */
async function insertEconomicData(economicData) {
  try {

    for (const record of economicData) {
      // Make sure to handle the transformation of date strings into Date objects if necessary
      const date = new Date(record.date);

      const countryRecordId = String(record.countryId);
      const indicatorRecordId = String(record.indicatorId);


      await xata.db.data.create({
        Date: date,
        countryId: countryRecordId ,
        indicatorId: indicatorRecordId,
        previous: record.previous,
        forecast: record.forecast,
        actual: record.actual,
        revised:record.revised,
        importance:record.importance
      });
    }
  } catch (error) {
    console.error('Failed to insert economic data:', error);
    throw error; 
  }
}

async function fetchTodayEconomicData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);  // Set to start of today
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);  // Set to start of tomorrow

  console.log("Date of today is: " + today);

  try {
    return await xata.db.data.filter("Date", gt(new Date(today.toISOString()))).getAll();
  } catch (error) {
    console.error('Failed to fetch today\'s economic data:', error);
    throw error;
  }
}

async function updateEconomicData(dataToUpdate) {
  const updateOperations = dataToUpdate.map(data => {
      return {
          update: {
              table: 'data',
              id: data.id,
              fields: {
                  actual: data.actual,
                  previous: data.previous,
                  forecast: data.forecast,
                  revised:data.revised,
                  importance:data.importance
              }
          }
      };
  });

  try {
      const result = await xata.transactions.run(updateOperations);
      //console.log("Update results:", result);
  } catch (error) {
      console.error('Failed to update economic data:', error);
      throw error;
  }
}

async function getIndicators(indicatorName,countryId)
{
  const records = await xata.db.data
            .filter("indicatorId.Name", indicatorName)  
            .filter("countryId.id", countryId) 
            .sort("Date","desc")  
            .getFirst();

   return records;
}

async function CotData(countryId)
{
        const cot = xata.db.COT.filter("CountryId.id", countryId)
        .sort("Date", "desc")
        .select([
            "Date",
            "NetPosition",
            "CountryId.Name",
            "Long",
            "Short",
            "ChangeShort",
            "ChangeLong",
        ]).getAll();

      return cot;
}
// databaseInterface.js


async function fetchLatestCOTData() {
  try {
    const allData = await xata.db.COT
      .sort("Date", "desc")
      .select([
        "Date",
        "NetPosition",
        "Long",
        "Short",
        "ChangeLong",
        "ChangeShort",
        "CountryId.Name",
        "CountryId.id"
      ])
      .getAll();

    const groupedData = allData.reduce((acc, item) => {
      const countryId = item.CountryId.id;
      if (!acc[countryId]) {
        acc[countryId] = [];
      }
      acc[countryId].push(item);
      return acc;
    }, {});

    const results = Object.values(groupedData).map(records => {
      if (records.length >= 2) {
        const changeInNetPosition = records[0].NetPosition - records[1].NetPosition;
        return {
          ...records[0],
          changeInNetPosition
        };
      } else {
        return {
          ...records[0],
          changeInNetPosition: 0 // Default if there is no previous record to compare
        };
      }
    });
    console.log("Results: ",results);

    return results;
  } catch (error) {
    console.error('Failed to fetch latest COT data:', error);
    throw error;
  }
}



const insertRetailData = async (pairId, longPercentage, shortPercentage) => {
  try {
    await xata.db.Retail.create({
      Pair: { id: pairId.toString() },
      longPercentage: longPercentage,
      shortPercentage: shortPercentage
    });
    console.log('Data for pair ID ' + pairId + ' inserted successfully');
  } catch (error) {
    console.error('Failed to insert data for pair ID ' + pairId + ':', error);
  }
};

const updateRetailData = async ({ pairId, longPercentage, shortPercentage }) => {
  try {
    const retailRecord = await xata.db.Retail.filter('Pair.id', pairId).getFirst();
    if (retailRecord) {
      await xata.db.Retail.update(retailRecord.id, {
        longPercentage,
        shortPercentage
      });
    } else {
      console.log("No data");
    }
  } catch (error) {
    console.error('Error updating retail data:', error);
    throw error;
  }
};

async function fetchRetailData() {
  try {
      const retailData = await xata.db.Retail.select([
          "longPercentage",
          "shortPercentage",
          "Pair.id",
          "Pair.Pair"
      ]).getAll(); 
      return retailData;
  } catch (error) {
      console.error('Failed to fetch Retail data:', error);
      throw error;
  }
}
async function seasonalityData(countryId,currentMonth)
{
  try {
    const seasonality = xata.db.Seasonality
    .filter("country.id", countryId)
    .filter("Month.id", currentMonth.toString())  
    .select(["value"])
    .getFirst();

    return seasonality;
  }catch(error){
    console.error('Failed to fetch Retail data:', error);
    throw error;
  }
}

async function insertScoreData(score, bias,pairId) {
  try {
      await xata.db.Score.create({
          date: new Date(),  
          score: score,      
          bias: bias,        
          Pair: {id:pairId}
      });
      console.log(`Data inserted successfully for ${pairId}`);
  } catch (error) {
      console.error('Failed to insert score data:', error);
  }
}

async function updateScoreData(score, bias, pairName) {
  try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to midnight

      console.log("today: ", today);
      const records = await xata.db.Score
          .filter("date", gt(today.toISOString())) 
          .filter('Pair.Pair', pairName)
          .getFirst();

      console.log(records);
      if (records) {
          await xata.db.Score.update(records.id, {
              score: score,
              bias: bias
          });
          console.log(`Updated score successfully for ${pairName}`);
      } else {
          console.log(`No record found for ${pairName} on ${today.toISOString()} to update`);
      }
  } catch (error) {
      console.error(`Failed to update score data for ${pairName}:`, error);
  }
}

async function insertBondValues(bondData) {
  try {
    await xata.db.bond_values.create({
      bond:{id:bondData.bondId},
      country: {id:bondData.countryId},
      yield: bondData.yield,
      prev: bondData.prev,
      low: bondData.low,
      change: bondData.change,
      changePc: bondData.changePc,
      chg: bondData.chg
    });
    console.log('Bond data inserted successfully');
  } catch (error) {
    console.error('Failed to insert bond data:', error);
  }
}

async function updateBondValues(bondData) {
  try {
    const { bondId, countryId, yield: yieldVal, prev, low, change, changePc, chg, time } = bondData;

    // Find existing record
    const existingRecord = await xata.db.bond_values
      .filter({ bond: bondId, country: countryId })
      .getFirst();

      console.log("existingRecord: " , existingRecord);

    if (existingRecord) {
      // Update the existing record
      await xata.db.bond_values.update(existingRecord.id, {
        yield: yieldVal,
        prev,
        low,
        change,
        changePc,
        chg,
      });
      console.log(`Updated bond values for bondId ${bondId} and countryId ${countryId}`);
    } else {
      console.log(`No existing record found for bondId ${bondId} and countryId ${countryId}. Update skipped.`);
    }
  } catch (error) {
    console.error('Error updating bond values:', error);
  }
}


async function getBondValues(countryId) {
  try {
    const bondValues = await xata.db.bond_values.filter({ country: countryId }).getMany();
    console.log("Bond values: ",bondValues);
    return bondValues;
  } catch (error) {
    console.error('Error fetching bond values:', error);
    return [];
  }
}

async function findUserByEmail(email) {
  return await xata.db.users.filter({ email }).getFirst();
}

async function createUser(email, password,name) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return await xata.db.users.create({ email, password: hashedPassword,name });
}
 
async function fetchScoreData(biasFilter) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);  // Set to start of today

  try {
    let query = xata.db.Score.filter("date", gt(today.toISOString()))
      .sort("date", "asc")
      .select(["bias", "score", "Pair.Pair","Pair.id"]);

    if (biasFilter && biasFilter !== 'all') {
      query = query.filter("bias", biasFilter);
    }

    return await query.getAll();
  } catch (error) {
    console.error('Failed to fetch score data:', error);
    throw error;
  }
}





module.exports = {fetchLatestCOTData,fetchScoreData, createUser,insertEconomicData,updateBondValues,fetchTodayEconomicData,updateEconomicData,getIndicators,CotData,insertRetailData,updateRetailData,fetchRetailData,seasonalityData,insertScoreData,updateScoreData,insertBondValues,getBondValues,findUserByEmail};
