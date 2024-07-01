const { getXataClient } = require("../src/xata");
const {getIndicators,CotData,seasonalityData,getBondValues} = require("../database/databaseInterface")
const xata = getXataClient();
const fs = require('fs');
const path = require('path');
const { error } = require("console");

// Load the indicators data
const indicatorsDataPath = path.join(__dirname, '..', 'utils', 'indicators.json');
const indicatorsData = JSON.parse(fs.readFileSync(indicatorsDataPath, 'utf8'));

// Function to get indicators for a specific country
function getCountryIndicators(country) 
{
  return indicatorsData[country] || {};
}


/**
 * Fetches the latest data entry for a given indicator.
 * @param {string} indicatorName - Name of the economic indicator.
 * @param {number} impactScore - Impact score potential of the indicator.
 * @param {number} countryId - The country ID in the database.
 * @returns {Promise<number>} - The score for the indicator.
 */
async function fetchLatestIndicatorData(indicatorName, impactScore, betterIfHigher, countryId) 
{
    try 
    {
        const records = await getIndicators(indicatorName,countryId)

        //console.log(records);

        
        
        if (!records || records.actual === null || records.actual === undefined) {
            console.log(`No valid data found for indicator ${indicatorName}.`);
            return 0;  // Return 0 if no records are found or actual is null/undefined
        }

        let comparisonValue;
        if (records.forecast !== null && records.forecast !== undefined) 
        {
            comparisonValue = records.forecast;
        } 
        else if (records.previous !== null && records.previous !== undefined) 
        {
            comparisonValue = records.previous;
        } 
        else 
        {
            console.log(`No valid forecast or previous values available for ${indicatorName}.`);
            return 0;  // No valid data to compare against, return score 0
        }


        // Determine the score based on actual vs. forecast comparison
        let score = 0; // Default score is 0

        
    
        
        if (records.actual > comparisonValue) 
        {
            score = betterIfHigher ? impactScore : -impactScore;
        } 
        else if (records.actual < comparisonValue) 
        {
            score = betterIfHigher ? -impactScore : impactScore;
        }


        return score;
    } 
    catch (error) 
    {
        console.error(`Failed to fetch data for ${indicatorName}:`, error);
        return 0;  // Return a neutral score in case of an error
    }
}
async function fetchBondValueScore(countryId) 
{
    try {
      const bondValues = await getBondValues(countryId);
      let bondScoreAdjustment = 0;
  
      bondValues.forEach(bond => {
        if (bond.chg >= 0 && bond.chg <= 1) bondScoreAdjustment += 0;
        else if (bond.chg > 1 && bond.chg <= 2) bondScoreAdjustment += 1;
        else if (bond.chg > 2 && bond.chg < 3 ) bondScoreAdjustment += 2;
        else if (bond.chg > 3 ) bondScoreAdjustment += 3;
        else if (bond.chg < 0  && bond.chg > -1) bondScoreAdjustment += 0;
        else if (bond.chg < -1 && bond.chg >= -2) bondScoreAdjustment -= 1;
        else if (bond.chg < -2 && bond.chg >= -3) bondScoreAdjustment -= 2;
        else if (bond.chg < -3) bondScoreAdjustment -= 3;
      });

      console.log("Bond Adjustment: ",bondScoreAdjustment)
      return bondScoreAdjustment;
    } catch (error) {
      console.error(`Failed to fetch bond values for country ID ${countryId}:`, error);
      return 0; // Return a neutral score in case of an error
    }
  }

async function fetchSeasonalityScore(countryId) {
    try {
        const currentMonth = new Date().getMonth() + 1;  
        const seasonality = await seasonalityData(countryId,currentMonth)
        if (!seasonality || seasonality.value === undefined) {
            console.error("No seasonality data found." + error);
            return 0;  // Return 0 if no data is found
        }

        console.log("Country: " , countryId,"With Month: ",currentMonth," and seasonality: ",seasonality)

        const { value } = seasonality;
        
        if (value >= 1) {
            return 2;
        } else if (value >= 0.5) {
            return 1;
        } else if (value > -0.5) {
            return 0;
        } else if (value > -1) {
            return -1;
        } else {
            return -2;
        }
    } catch (error) {
        console.error(`Failed to fetch seasonality data for country ID ${countryId}:`, error);
        return 0;  // Return a neutral score in case of an error
    }
}

async function fetchCOTData(countryId) {
    try {
        const records = await CotData(countryId)
        return records;
    } catch (error) {
        console.error(`Failed to fetch COT data for country ID ${countryId}:`, error);
        return []; // Return an empty array on error
    }
}

async function calculateCOTScore(countryId) {
    const records = await fetchCOTData(countryId);
    if (records.length < 2) {
        console.log("Not enough data to calculate COT score.");
        return 0; // Not enough data to calculate difference
    }


    const netPositionDiff = records[0].NetPosition - records[1].NetPosition;
    let score = 0;

    // Calculate score based on the difference in NetPosition
    if (netPositionDiff > 8000) {
        score = 3;
    } else if (netPositionDiff > 5000) {
        score = 2;
    } else if (netPositionDiff > 0) {
        score = 1;
    } else if (netPositionDiff > -4000) {
        score = -1;
    } else if (netPositionDiff > -8000) {
        score = -2;
    } else {
        score = -3;
    }

    console.log(`COT Score for country ID ${countryId} (Net Position Difference: ${netPositionDiff}): ${score}`);
    return score;
}



/**
 * Analyzes all indicators for New Zealand and returns the total score.
 * @returns {Promise<number>} - Total score for New Zealand.
 */
async function analyzeNZIndicators() 
{
    const nzIndicators = getCountryIndicators("New Zealand");
    let totalScore = 0;

    const countryId = "5"
    const cotScore = await calculateCOTScore(countryId); 
    totalScore += cotScore;

    const seasonalityScore = await fetchSeasonalityScore(countryId);
    totalScore += seasonalityScore;

    const bondValueScore = await fetchBondValueScore(countryId);
    totalScore += bondValueScore;


    console.log("score" + seasonalityScore);

    for (const [indicator, details] of Object.entries(nzIndicators)) {
        const { impact, betterIfHigher } = details;
        const score = await fetchLatestIndicatorData(indicator, impact, betterIfHigher, "5");
        totalScore += score;
        console.log(`NZ: ${indicator}: ${score}`);
    }

    const realScore = Math.round((totalScore/22)*10)
    console.log("NZ score: ",realScore)
    return realScore;
}

async function analyzeUSIndicators() 
{
    const USAIndicators = getCountryIndicators("USA");
    let totalScore = 0;

    const countryId = "1"
    const cotScore = await calculateCOTScore(countryId); 
    totalScore += cotScore;

    const seasonalityScore = await fetchSeasonalityScore(countryId);
    totalScore += seasonalityScore;

    const bondValueScore = await fetchBondValueScore(countryId);
    totalScore += bondValueScore;
    

    for (const [indicator, details] of Object.entries(USAIndicators)) {
        const { impact, betterIfHigher } = details;
        const score = await fetchLatestIndicatorData(indicator, impact, betterIfHigher, "1");
        totalScore += score;
        console.log(`US: ${indicator}: ${score}`);
    }

    const realScore = Math.round((totalScore/24)*10)
    console.log("Us score: " + realScore)
    return realScore;
}

async function analyzeEUIndicators() 
{
    const USAIndicators = getCountryIndicators("EU");
    let totalScore = 0;

    const countryId = "8"
    const cotScore = await calculateCOTScore(countryId); 
    totalScore += cotScore;

    const seasonalityScore = await fetchSeasonalityScore(countryId);
    totalScore += seasonalityScore;

    const bondValueScore = await fetchBondValueScore(countryId);
    totalScore += bondValueScore;


    //console.log("cot score" + cotScore);
    for (const [indicator, details] of Object.entries(USAIndicators)) {
        const { impact, betterIfHigher } = details;
        const score = await fetchLatestIndicatorData(indicator, impact, betterIfHigher, "8");
        totalScore += score;
        console.log(`EU: ${indicator}: ${score}`);
    }

    const realScore = Math.round((totalScore/22)*10)
    console.log("EU score: ",realScore);
    return realScore;
}
async function analyzeCAIndicators() 
{
    const CAIndicators = getCountryIndicators("Canada");
    let totalScore = 0;

    const countryId = "6"
    const cotScore = await calculateCOTScore(countryId); 
    totalScore += cotScore;

    const seasonalityScore = await fetchSeasonalityScore(countryId);
    totalScore += seasonalityScore;

    const bondValueScore = await fetchBondValueScore(countryId);
    totalScore += bondValueScore;


    for (const [indicator, details] of Object.entries(CAIndicators)) {
        const { impact, betterIfHigher } = details;
        const score = await fetchLatestIndicatorData(indicator, impact, betterIfHigher, "6");
        totalScore += score;
        console.log(`CA:${indicator}: ${score}`);
    }

    const realScore = Math.round((totalScore/30)*10)
    console.log("CA score: ",realScore);
    return realScore;
}

async function analyzeCHIndicators() 
{
    const CHIndicators = getCountryIndicators("Switzerland");
    let totalScore = 0;

    const countryId = "10"
    const cotScore = await calculateCOTScore(countryId); 
    totalScore += cotScore;

    const seasonalityScore = await fetchSeasonalityScore(countryId);
    totalScore += seasonalityScore;

    const bondValueScore = await fetchBondValueScore(countryId);
    totalScore += bondValueScore;

    for (const [indicator, details] of Object.entries(CHIndicators)) {
        const { impact, betterIfHigher } = details;
        const score = await fetchLatestIndicatorData(indicator, impact, betterIfHigher, "10");
        totalScore += score;
        console.log(`CH: ${indicator}: ${score}`);
    }

    const realScore = Math.round((totalScore/15)*10)
    console.log("CH score: ",realScore);
    return realScore;
}

async function analyzeAUIndicators() 
{
    const AUIndicators = getCountryIndicators("Australia");
    let totalScore = 0;

    const countryId = "4"
    const cotScore = await calculateCOTScore(countryId); 
    totalScore += cotScore;

    const seasonalityScore = await fetchSeasonalityScore(countryId);
    totalScore += seasonalityScore;

    const bondValueScore = await fetchBondValueScore(countryId);
    totalScore += bondValueScore;


    for (const [indicator, details] of Object.entries(AUIndicators)) 
    {
        const { impact, betterIfHigher } = details;
        const score = await fetchLatestIndicatorData(indicator, impact, betterIfHigher, "4");
        totalScore += score;
        console.log(`AU: ${indicator}: ${score}`);
    }

    const realScore = Math.round((totalScore/19)*10)
    console.log("AU score: ",realScore)
    return realScore;
}

async function analyzeUKIndicators() 
{
    const UKIndicators = getCountryIndicators("UK");
    let totalScore = 0;
    

    const countryId = "9"
    const cotScore = await calculateCOTScore(countryId); 
    totalScore += cotScore;

    const seasonalityScore = await fetchSeasonalityScore(countryId);
    totalScore += seasonalityScore;

    const bondValueScore = await fetchBondValueScore(countryId);
    totalScore += bondValueScore;

    for (const [indicator, details] of Object.entries(UKIndicators)) 
    {
        const { impact, betterIfHigher } = details;
        const score = await fetchLatestIndicatorData(indicator, impact, betterIfHigher, "9");
        totalScore += score;
        console.log(`UK: ${indicator}: ${score}`);
    }

    const realScore = Math.round((totalScore/20)*10)
    console.log("UK score: ",realScore)
    return realScore;
}

async function analyzeJPIndicators() 
{
    const JPIndicators = getCountryIndicators("Japan");
    let totalScore = 0;
    

    const countryId = "2"
    const cotScore = await calculateCOTScore(countryId); 
    totalScore += cotScore;

    const bondValueScore = await fetchBondValueScore(countryId);
    totalScore += bondValueScore;

    const seasonalityScore = await fetchSeasonalityScore(countryId);
    totalScore += seasonalityScore;

    for (const [indicator, details] of Object.entries(JPIndicators)) {
        const { impact, betterIfHigher } = details;
        const score = await fetchLatestIndicatorData(indicator, impact, betterIfHigher, "2");
        totalScore += score;
        console.log(`JP: ${indicator}: ${score}`);
    }

    const realScore = Math.round((totalScore/21)*10)
    console.log("JP score: ",realScore);
    return realScore;
}

async function analyzeCHINAIndicators() 
{
    const CHIndicators = getCountryIndicators("China");
    let totalScore = 0;
    //const seasonalityScore = await fetchSeasonalityScore(countryId);
    //totalScore += seasonalityScore;

    for (const [indicator, details] of Object.entries(CHIndicators)) {
        const { impact, betterIfHigher } = details;
        const score = await fetchLatestIndicatorData(indicator, impact, betterIfHigher, "11");
        totalScore += score;
        console.log(`CH : ${indicator}: ${score}`);
    }

    const realScore = Math.round((totalScore/16)*10)
    console.log("CHINA score: ",realScore);
    return realScore;
}
module.exports = { analyzeNZIndicators ,analyzeUSIndicators,analyzeEUIndicators,analyzeCAIndicators,analyzeCHIndicators,analyzeAUIndicators,analyzeUKIndicators,analyzeJPIndicators,analyzeCHINAIndicators};

