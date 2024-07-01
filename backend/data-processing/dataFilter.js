// Example country IDs
const countryIds = {
    "US": 1,
    "CH": 10,
    "JP": 2,
    "FR": 3,
    "AU": 4,
    "NZ": 5,
    "CA": 6,
    "DE": 7,
    "EU": 8,
    "GB": 9,
    "CN": 11
};

// Example indicator IDs
const indicatorIds = {
    "GDP MoM": 1,
    "Interest Rate": 10,
    "Unemployment Rate": 11,
    "ADP NFP": 12,
    "Employment Change": 13,
    "JOLTS": 14,
    "Unemployment Claims": 15,
    "CB Consumer Confidence": 16,
    "UoM Consumer Sentiment": 17,
    "Retail Sales MoM": 18,
    "Core Retail Sales": 19,
    "CPI MoM": 2,
    "ISM Manufacturing PMI": 20,
    "Flash Manufacturing PMI": 21,
    "ISM Services PMI": 22,
    "Flash Services PMI": 23,
    "Trade Balance": 24,
    "CPI YoY": 3,
    "Core PCE Price Index": 4,
    "PPI MoM": 5,
    "Core PPI MoM": 6,
    "Average Hourly Earnings": 7,
    "Mean CPI": 8,
    "Trimmed Mean CPI QoQ": 9,
    "Core CPI MoM": 25,
    "Empire State Manufacturing Index":26,
    "Core Retail Sales MoM": 27,
    "Prelim UoM Consumer Sentiment":28,
    "Average Hourly Earnings MoM":29,
    "Core PCE Price Index MoM":30,
    "Final GDP QoQ":31,
    "Manufacturing PMI":32,
    "Consumer Confidence":33,
    "Tokyo Core CPI YoY":34,
    "Tokyo CPI YoY":35,
    "Prelim GDP QoQ":36,
    "Business Confidence":37,
    "French Flash Manufacturing PMI":38,
    "German Prelim CPI MoM":39,
    "Retail Sales QoQ":40,
    "German Flash Manufacturing PMI":41,
    "Flash Employment Change QoQ":43,
    "Wage Price Index QoQ":44,
    "CPI Median YoY":45,
    "CPI QoQ":46,
    "Advance GDP QoQ":47,
    "Unemployment Change":48,
    "French Flash Services PMI":49,
    "German Flash Services PMI":50,
    "GDP QoQ":51,
    "Services PMI":52,
    "AU CPI YoY":53,
    "Retail Sales YoY":54,
    "GDP YoY": 55,
    "CPI YoY Prel":56,
    "German Prelim CPI YoY":57,
    "Building Permits MoM Prel":58,
    "Trade Balance":59,
    "Trimmed Mean CPI YoY":60,
    "Core CPI YoY":61,
    "PPI YoY":62,
    "Prelim GDP YoY":63,
    "Exports YoY":64,
    "Imports YoY":65,
    "NBS Non Manufacturing PMI":66,
    "NBS Manufacturing PMI":67,
    "Industrial Production YoY":68,

    "Core Retail Sales QoQ":69,
    "Inflation Expectations":70,
    "Average Hourly Earnings YoY":71,
    "Core PPI YoY":72,
    "German Unemployment Change":73,
    "German Unemployment Rate":74,
    "German Retail Sales MoM":75,
    "German Retail Sales YoY":76,
    "Core Harmonized Index of Consumer Prices MoM":77,
    "Core Harmonized Index of Consumer Prices YoY":78,
    "Harmonized Index of Consumer Prices YoY":79,
    "Harmonized Index of Consumer Prices MoM":80,
    "PPI YoY ":81,
    "French CPI MoM":82,
    "French CPI YoY":83,
    "German PPI MoM":84,
    "German PPI YoY":85,
    "French GDP QoQ":86,
    "German GDP QoQ":87,
    "German GDP YoY":88,
    "Ivey PMI":89,
    "BoC Core CPI MoM":90,
    "PPI QoQ":91,
    "Core Retail Sales YoY":92,
    "BoC Core CPI YoY":93
  };
  
// dataFilter.js

/**
 * Filters data for all countries and maps indicators to their respective IDs.
 * @param {Array} data - Array of normalized data objects.
 * @returns {Object} Filtered and mapped data indexed by country.
 */
function filterDataForAllCountries(data) {
    const result = {};

    // Assume countryIds contains all the necessary country codes
    for (const country of Object.keys(countryIds)) {
        // Filter data for the specific country
        const filteredData = data.filter(item => item.country === country);

        result[country] = filteredData.map(item => {
            // Check if the country is Germany or France, and assign them the EU's countryId
            let assignedCountryId = countryIds[country];
            if (country === 'DE' || country === 'FR') {
                assignedCountryId = countryIds['EU'];  // Assign EU's ID for Germany and France
            }

            return {
                ...item,
                countryId: assignedCountryId, // Use the possibly adjusted country ID
                indicatorId: indicatorIds[item.indicator] || null, // Map indicator title to indicator ID, default to null if not found
            };
        });
    }

    return result;
}

module.exports = { filterDataForAllCountries };
