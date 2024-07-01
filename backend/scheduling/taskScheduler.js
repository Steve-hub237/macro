const cron = require('node-cron');
const { fetchPredefinedEconomicData,fetchCommunityOutlook } = require('../api-integration/externalApiClient');
const { calculateRelativeScores } = require('../data-analysis/relativeScoreCalculator');
const { updateScoreData, insertScoreData } = require('../database/databaseInterface');
const { normalizeEconomicData } = require('../api-integration/dataNormalizer');
const { filterDataForAllCountries } = require('../data-processing/dataFilter');
const { pairIdMap } = require('../utils/pairIdMap');
const { insertEconomicData,fetchTodayEconomicData,updateEconomicData,updateRetailData } = require('../database/databaseInterface');




async function updateEconomicDataFromApi() {
    try {
        const today = new Date();

        const formattedToday = today.toISOString().split('T')[0];
    
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + 1);

        const formattedNextDay = nextDay.toISOString().split('T')[0];
            
        const rawData = await fetchPredefinedEconomicData(formattedToday, formattedNextDay);
        const normalizedData = normalizeEconomicData(rawData);
        const filteredData = filterDataForAllCountries(normalizedData);

        // Fetch today's data from the database
        const todayData = await fetchTodayEconomicData();

        // Prepare updates for existing records
        const updates = [];

        
        Object.keys(filteredData).forEach(countryKey => {
            filteredData[countryKey].forEach(newRecord => {       
                const existingRecord = todayData.find(record =>
                    record.countryId.id === String(newRecord.countryId) &&
                    record.indicatorId.id === String(newRecord.indicatorId)
                );   
                
                //console.log("Existing records: ", newRecord);

                if (existingRecord) { 
                    updates.push({
                        id: existingRecord.id,
                        actual: newRecord.actual, 
                        previous: newRecord.previous,
                        forecast: newRecord.forecast,
                        revised:newRecord.revised,
                        importance:newRecord.importance
                    });
                }
            });
        });

        //console.log("Updates:" ,updates);
        if (updates.length > 0) {
            await updateEconomicData(updates);
            console.log("Successfully updated the database with the new API data.");
        } else {
            console.log("No matching records found to update.");
        }
    } catch (error) {
        console.error('An error occurred while updating data from the API:', error);
    }
}

  const insertDailyScores = async () => {
    const scores = await calculateRelativeScores();
    for (const [pair, data] of Object.entries(scores)) {
        const pairId = pairIdMap[pair];  
        if (pairId) {
            await insertScoreData(data.score, data.bias, pairId);
        } else {
            console.error(`No pair ID found for ${pair}`);
        }
    }
};


const updateScores = async () => {
    const scores = await calculateRelativeScores();

    console.log("Forex Biases:", scores);
    for (const [pair, data] of Object.entries(scores)) {
        await updateScoreData(data.score, data.bias, pair);
    }
};

function scheduleDailyDataFetchAndInsert() {
    cron.schedule('30 00 * * *', async () => {
        try {
            const today = new Date();
            const formattedToday = today.toISOString().split('T')[0];

            const nextDay = new Date(today);
            nextDay.setDate(today.getDate() + 1);
            const formattedNextDay = nextDay.toISOString().split('T')[0];

            // Fetch data for today and the next day
            const rawData = await fetchPredefinedEconomicData(formattedToday, formattedNextDay);
            const normalizedData = normalizeEconomicData(rawData);
            const filteredData = filterDataForAllCountries(normalizedData);

            console.log(normalizedData);
            console.log("Daily data insert: ",filteredData);

            for (const countryData of Object.values(filteredData)) {
                if (countryData.length > 0) {
                    await insertEconomicData(countryData);
                }
            }
        } catch (error) {
            console.error('An error occurred during the scheduled data insertion:', error);
        }
    });
}

function scheduleDailyScoreInserts() {
    cron.schedule('0 0 * * *', async () => {
        console.log('Inserting daily scores...');
        try {
            await insertDailyScores();
            console.log("Daily scores inserted successfully.");
        } catch (error) {
            console.error('An error occurred during the insertion of daily scores:', error);
        }
    }, {
        scheduled: true,
        timezone: "UTC"
    });
}

function scheduleRegularScoreUpdates() {
    cron.schedule('*/10 * * * *', async () => {
        console.log('Updating scores...');
        try {
            await updateScores();
            console.log("Scores updated successfully.");
        } catch (error) {
            console.error('An error occurred during the regular update of scores:', error);
        }
    }, {
        scheduled: true,
        timezone: "UTC"
    });
}

function scheduleRegularDataUpdates() {
    cron.schedule('*/30 * * * *', async () => {
        console.log("Starting the regular update of economic data...");
        try {
            await updateEconomicDataFromApi();
            console.log("Update process completed successfully.");
        } catch (error) {
            console.error('An error occurred during the regular update process:', error);
        }
    });
}

const scheduledRetailUpdate = () => {
    cron.schedule('*/45 * * * *', async () => {
      try {
        const symbols = await fetchCommunityOutlook();
        for (const symbol of symbols) {
            const pairId = pairIdMap[symbol.name];
          if (pairId) {
            await updateRetailData({
              pairId,
              longPercentage: symbol.longPercentage,
              shortPercentage: symbol.shortPercentage
            });
          }
        }
        console.log('Retail data updated successfully');
      } catch (error) {
        console.error('Failed to update data from community outlook:', error);
      }
    });
  };


  

module.exports = { scheduleDailyDataFetchAndInsert,scheduleRegularDataUpdates,scheduledRetailUpdate,scheduleDailyScoreInserts,scheduleRegularScoreUpdates};


