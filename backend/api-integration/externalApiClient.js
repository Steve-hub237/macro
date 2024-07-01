const axios = require('axios');
const { insertRetailData } = require('../database/databaseInterface');
const { pairIdMap } = require('../utils/pairIdMap');
const util = require('util');


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to fetch economic data with retry logic
async function fetchWithRetries(options, retries = 10, delayMs = 500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
      try {
          const response = await axios.request(options);
          return response.data;
      } catch (error) {
          if (error.response && error.response.status === 403) {
              console.warn(`403 error on attempt ${attempt}, retrying after ${delayMs}ms...`);
              await delay(delayMs);
          } else {
              if (attempt === retries) {
                  throw error;
              }
              console.warn(`Attempt ${attempt} failed, retrying after ${delayMs}ms...`);
              await delay(delayMs);
          }
      }
  }
}

async function fetchDataForCountry(countryCode, from, to) {
  const options = {
      method: 'GET',
      url: 'https://economic-trading-forex-events-calendar.p.rapidapi.com/fxstreet',
      params: { 
          countries: countryCode,
          from: from, 
          to: to  
      },
      headers: {
          'X-RapidAPI-Key': 'f22e70ebb2msh8a24f329a5214b4p1d0eb8jsn1ac22a0523ea',
          'X-RapidAPI-Host': 'economic-trading-forex-events-calendar.p.rapidapi.com'
      }
  };

  return fetchWithRetries(options);
}


async function fetchEconomicDataForCountries(countryCodes, from, to) {
  const results = [];

  for (const countryCode of countryCodes) {
      try {
          const data = await fetchDataForCountry(countryCode, from, to);
          results.push({ countryCode, data });
      } catch (error) {
          console.error(`Error fetching data for country ${countryCode} from ${from} to ${to}:`, error.response ? error.response.data : error);
          throw error;
      }
  }
  return results;
}

async function fetchPredefinedEconomicData(from, to) 
{
    const countryCodes = ['CA','US','FR','JP','CH','UK','AU','NZ','DE','EMU']; 
    return fetchEconomicDataForCountries(countryCodes, from, to); 
}
  
  const fetchCommunityOutlook = async () => {
    try {
      const response = await axios.get('https://www.myfxbook.com/api/get-community-outlook.json', {
        params: {
          session: 'aW0gZYKgliYtk5Y1s99U3630330'
        }
      });
      
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      

      console.log("response:", JSON.stringify(response.data, null, 2));
      return response.data.symbols;
      
    } catch (error) {
      console.error('Error while making API call to get community outlook:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  };
  
  const storeCommunityOutlook = async () => {
    try {
      const symbols = await fetchCommunityOutlook();
      if (symbols.length) {
        for (const symbol of symbols) {
          const pairId = pairIdMap[symbol.name];
    
          if (pairId) 
          {
            await insertRetailData(pairId, symbol.longPercentage, symbol.shortPercentage);
          }
        }
        console.log('All data has been stored successfully');
      }
    } catch (error) {
      console.error('Error while storing data:', error);
    }
  };


module.exports = { fetchPredefinedEconomicData ,storeCommunityOutlook,fetchCommunityOutlook};