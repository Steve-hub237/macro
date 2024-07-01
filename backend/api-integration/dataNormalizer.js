const util = require('util');

// Define the indicator mappings and allowed titles
const indicatorMapping = {
  // NZ indicators
  "Consumer Price Index (QoQ)": "CPI QoQ",
  "Consumer Price Index (YoY)": "CPI YoY",
  "Employment Change": "Employment Change",
  "Unemployment Rate": "Unemployment Rate",
  "RBNZ Inflation Expectations (QoQ)": "Inflation Expectations",
  "Retail Sales (QoQ)": "Retail Sales QoQ",
  "Retail Sales ex Autos (QoQ)": "Core Retail Sales QoQ",
  "RBNZ Interest Rate Decision": "Interest Rate",
  "Gross Domestic Product (QoQ)": "GDP QoQ",
  "Gross Domestic Product (YoY)": "GDP YoY",
  "Business NZ PMI": "Manufacturing PMI",
  "Business NZ PSI": "Services PMI",
  
  // US indicators
  "ISM Manufacturing PMI": "ISM Manufacturing PMI",
  "JOLTS Job Openings": "JOLTS",
  "ADP Employment Change": "ADP NFP",
  "Initial Jobless Claims": "Unemployment Claims",
  "Average Hourly Earnings (MoM)": "Average Hourly Earnings MoM",
  "Average Hourly Earnings (YoY)": "Average Hourly Earnings YoY",
  "Nonfarm Payrolls": "Employment Change",
  "ISM Services PMI": "ISM Services PMI",
  "Consumer Price Index (MoM)": "CPI MoM",
  "Consumer Price Index (YoY)": "CPI YoY",
  "Consumer Price Index ex Food & Energy (MoM)": "Core CPI MoM",
  "Consumer Price Index ex Food & Energy (YoY)": "Core CPI YoY",
  "Producer Price Index (MoM)": "PPI MoM",
  "Producer Price Index (YoY)": "PPI YoY",
  "Producer Price Index ex Food & Energy (MoM)": "Core PPI MoM",
  "Producer Price Index ex Food & Energy (YoY)": "Core PPI YoY",
  "NY Empire State Manufacturing Index": "Empire State Manufacturing Index",
  "Retail Sales (MoM)": "Retail Sales MoM",
  "Retail Sales ex Autos (MoM)": "Core Retail Sales MoM",
  "Michigan Consumer Sentiment Index": "UoM Consumer Sentiment",
  "S&P Global Manufacturing PMI": "Flash Manufacturing PMI",
  "S&P Global Services PMI": "Flash Services PMI",
  "Core Personal Consumption Expenditures - Price Index (MoM)": "Core PCE Price Index MoM",
  "Fed Interest Rate Decision": "Interest Rate",
  "Gross Domestic Product Annualized": "GDP YoY",
  
  // CA indicators
  "S&P Global Manufacturing PMI": "Manufacturing PMI",
  "Average Hourly Wages (YoY)": "Average Hourly Earnings YoY",
  "Net Change in Employment": "Employment Change",
  "Ivey Purchasing Managers Index s.a": "Ivey PMI",
  "BoC Consumer Price Index Core (MoM)": "BoC Core CPI MoM",
  "BoC Consumer Price Index Core (YoY)": "BoC Core CPI YoY",
  "Consumer Price Index - Core (MoM)": "Core CPI MoM",
  "Consumer Price Index (MoM)": "CPI MoM",
  "Consumer Price Index (YoY)": "CPI YoY",
  "Retail Sales (MoM)": "Retail Sales MoM",
  "Retail Sales ex Autos (MoM)": "Core Retail Sales MoM",
  "BoC Interest Rate Decision": "Interest Rate",
  "Gross Domestic Product (MoM)": "GDP MoM",
  "Gross Domestic Product (QoQ)": "GDP QoQ",
  "Gross Domestic Product Annualized": "GDP YoY",
  
  // CH indicators
  "SVME - Purchasing Managers' Index": "Manufacturing PMI",
  "Consumer Price Index (MoM)": "CPI MoM",
  "Consumer Price Index (YoY)": "CPI YoY",
  "Real Retail Sales (YoY)": "Retail Sales YoY",
  "Gross Domestic Product (QoQ)": "GDP QoQ",
  "Gross Domestic Product (YoY)": "GDP YoY",
  "SNB Interest Rate Decision": "Interest Rate",
  "Unemployment Rate s.a (MoM)": "Unemployment Rate",
  
  // AU indicators
  "Judo Bank Manufacturing PMI": "Flash Manufacturing PMI",
  "Judo Bank Services PMI": "Flash Services PMI",
  "Retail Sales s.a. (MoM)": "Retail Sales MoM",
  "Monthly Consumer Price Index (YoY)": "AU CPI YoY",
  "Trade Balance (MoM)": "Trade Balance",
  "Consumer Inflation Expectations": "Inflation Expectations",
  "Employment Change s.a.": "Employment Change",
  "Unemployment Rate s.a.": "Unemployment Rate",
  "Consumer Price Index (QoQ)": "CPI QoQ",
  "Consumer Price Index (YoY)": "CPI YoY",
  "RBA Trimmed Mean CPI (QoQ)": "Trimmed Mean CPI QoQ",
  "RBA Trimmed Mean CPI (YoY)": "Trimmed Mean CPI YoY",
  "Producer Price Index (QoQ)": "PPI QoQ",
  "Producer Price Index (YoY)": "PPI YoY",
  "RBA Interest Rate Decision": "Interest Rate",
  "Gross Domestic Product (QoQ)": "GDP QoQ",
  "Gross Domestic Product (YoY)": "GDP YoY",
  
  // UK indicators
  "Gross Domestic Product (MoM)": "GDP MoM",
  "Claimant Count Change": "Unemployment Change",
  "Employment Change (3M)": "Employment Change",
  "ILO Unemployment Rate (3M)": "Unemployment Rate",
  "Consumer Price Index (MoM)": "CPI MoM",
  "Consumer Price Index (YoY)": "CPI YoY",
  "Core Consumer Price Index (YoY)": "Core CPI YoY",
  "Producer Price Index - Output (MoM) n.s.a": "PPI MoM",
  "Producer Price Index - Output (YoY) n.s.a": "PPI YoY",
  "Retail Sales (MoM)": "Retail Sales MoM",
  "Retail Sales (YoY)": "Retail Sales YoY",
  "Retail Sales ex-Fuel (MoM)": "Core Retail Sales MoM",
  "Retail Sales ex-Fuel (YoY)": "Core Retail Sales YoY",
  "Gross Domestic Product (QoQ)": "GDP QoQ",
  "Gross Domestic Product (YoY)": "GDP YoY",
  "BoE Interest Rate Decision": "Interest Rate",
  
  // JP indicators
  "Tokyo Consumer Price Index (YoY)": "Tokyo CPI YoY",
  "Tokyo CPI ex Fresh Food (YoY)": "Tokyo Core CPI YoY",
  "BoJ Interest Rate Decision": "Interest Rate",
  "Jibun Bank Manufacturing PMI": "Flash Manufacturing PMI",
  "Jibun Bank Services PMI": "Flash Services PMI",
  "Retail Trade s.a (MoM)": "Retail Sales MoM",
  "Retail Trade (YoY)": "Retail Sales YoY",
  "Consumer Confidence Index": "Consumer Confidence",
  "Gross Domestic Product (QoQ)": "GDP QoQ",
  "Gross Domestic Product Annualized": "GDP YoY",
  "Merchandise Trade Balance Total": "Trade Balance",
  "National Consumer Price Index (YoY)": "CPI YoY",
  "National CPI ex Food, Energy (YoY)": "Core CPI YoY",
  "Tankan Large Manufacturing Index": "Business Confidence",
  
  // EU indicators
  "Unemployment Change": "Unemployment Change",
  "Unemployment Rate s.a.": "Unemployment Rate",
  "Unemployment Rate": "Unemployment Rate",
  "Consumer Price Index (MoM)": "CPI MoM",
  "Consumer Price Index (YoY)": "CPI YoY",
  "Retail Sales (MoM)": "Retail Sales MoM",
  "Retail Sales (YoY)": "Retail Sales YoY",
  "Core Harmonized Index of Consumer Prices (MoM)": "Core Harmonized Index of Consumer Prices MoM",
  "Core Harmonized Index of Consumer Prices (YoY)": "Core Harmonized Index of Consumer Prices YoY",
  "Harmonized Index of Consumer Prices (MoM)": "Harmonized Index of Consumer Prices MoM",
  "Harmonized Index of Consumer Prices (YoY)": "Harmonized Index of Consumer Prices YoY",
  "Producer Price Index (MoM)": "PPI MoM",
  "Producer Price Index (YoY)": "PPI YoY",
  "Retail Sales (MoM)": "Retail Sales MoM",
  "Retail Sales (YoY)": "Retail Sales YoY",
  "Consumer Price Index (EU norm) (MoM)": "CPI MoM",
  "Consumer Price Index (EU norm) (YoY)": "CPI YoY",
  "HCOB Manufacturing PMI": "Flash Manufacturing PMI",
  "HCOB Services PMI": "Flash Services PMI",
  "ECB Main Refinancing Operations Rate": "Interest Rate",
  "Gross Domestic Product (QoQ)": "GDP QoQ",
  "Gross Domestic Product (YoY)": "GDP YoY",
};

const allowedTitles = new Set([
    "Unemployment Rate","Harmonized Index of Consumer Prices YoY","Core Harmonized Index of Consumer Prices MoM","Core Harmonized Index of Consumer Prices YoY",
    "Harmonized Index of Consumer Prices MoM", "Employment Change", "Inflation Expectations", "Core Retail Sales MoM", "Tokyo Core CPI YoY", "Imports YoY", 
    "Exports YoY", "NBS Manufacturing PMI", "NBS Non Manufacturing PMI", "Industrial Production YoY","Consumer Confidence", "Tokyo CPI YoY", "PPI MoM", "Core PPI MoM", 
    "Retail Sales MoM", "CB Consumer Confidence","German GDP QoQ","German GDP YoY","French GDP QoQ","Core PCE Price Index", "ISM Manufacturing PMI", "ISM Services PMI", 
    "JOLTS", "Average Hourly Earnings MoM", "GDP MoM", "Retail Sales QoQ","German Unemployment Change", "Interest Rate", "Manufacturing PMI", "CPI MoM", "CPI QoQ", 
    "Business Confidence", "Prelim GDP QoQ", "French Flash Services PMI","German PPI YoY","French CPI MoM","French Flash Services PMI","French Flash Manufacturing PMI", 
    "German Flash Manufacturing PMI", "German Flash Services PMI", "German Prelim GDP QoQ","German Unemployment Rate","French CPI YoY","French Prelim GDP QoQ", 
    "German Prelim CPI MoM", "Flash Employment Change QoQ", "Unemployment Claims", "German Prelim CPI YoY","German Retail Sales MoM","French Flash Manufacturing PMI",
    "UoM Consumer Sentiment", "Empire State Manufacturing Index", "CPI YoY", "Flash Manufacturing PMI", "Flash Services PMI", "PPI YoY","German Retail Sales YoY",
    "German PPI MoM","German PPI YoY","ADP NFP", "Trimmed Mean CPI QoQ", "Core CPI MoM", "CPI Median YoY", "Advance GDP QoQ", "Unemployment Change", "GDP QoQ", 
    "Services PMI", "Final GDP QoQ", "AU CPI YoY", "Retail Sales YoY", "GDP YoY", "CPI YoY Prel", "Building Permits MoM Prel", "Trade Balance", "Core CPI YoY", 
    "Prelim GDP YoY","Ivey PMI","BoC Core CPI MoM","BoC Core CPI YoY","PPI QoQ","Core Retail Sales YoY","Core PCE Price Index MoM","Core PPI YoY"
  ]);

function normalizeEconomicData(rawData) {
  if (!Array.isArray(rawData)) {
    throw new TypeError('Expected rawData to be an array');
  }

  return rawData.flatMap(item => {
    const events = Array.isArray(item.data) ? item.data : [];

    return events.map(event => {
      // Change country codes as required
     
      let standardizedTitle = indicatorMapping[event.name] || event.name;

      // Country-specific renaming
      if (event.name === "Unemployment Change" && event.countryCode === "DE") {
        standardizedTitle = "German Unemployment Change";
      } else if (event.name === "Unemployment Rate s.a." && event.countryCode === "DE") {
        standardizedTitle = "German Unemployment Rate";
      } else if (event.name === "Consumer Price Index (MoM)" && event.countryCode === "DE") {
        standardizedTitle = "German Prelim CPI MoM";
      } else if (event.name === "Consumer Price Index (YoY)" && event.countryCode === "DE") {
        standardizedTitle = "German Prelim CPI YoY";
      } else if (event.name === "Retail Sales (MoM)" && event.countryCode === "DE") {
        standardizedTitle = "German Retail Sales MoM";
      } else if (event.name === "Retail Sales (YoY)" && event.countryCode === "DE") {
        standardizedTitle = "German Retail Sales YoY";
      } else if (event.name === "Producer Price Index (MoM)" && event.countryCode === "DE") {
        standardizedTitle = "German PPI MoM";
      } else if (event.name === "Producer Price Index (YoY)" && event.countryCode === "DE") {
        standardizedTitle = "German PPI YoY";
      } else if (event.name === "Consumer Price Index (EU norm) (MoM)" && event.countryCode === "FR") {
        standardizedTitle = "French CPI MoM";
      } else if (event.name === "Consumer Price Index (EU norm) (YoY)" && event.countryCode === "FR") {
        standardizedTitle = "French CPI YoY";
      } else if (event.name === "HCOB Manufacturing PMI" && event.countryCode === "FR") {
        standardizedTitle = "French Flash Manufacturing PMI";
      } else if (event.name === "HCOB Services PMI" && event.countryCode === "FR") {
        standardizedTitle = "French Flash Services PMI";
      } else if (event.name === "HCOB Manufacturing PMI" && event.countryCode === "DE") {
        standardizedTitle = "German Flash Manufacturing PMI";
      } else if (event.name === "HCOB Services PMI" && event.countryCode === "DE") {
        standardizedTitle = "German Flash Services PMI";
      } else if (event.name === "Gross Domestic Product (QoQ)" && event.countryCode === "FR") {
        standardizedTitle = "French GDP QoQ";
      } else if (event.name === "Gross Domestic Product (QoQ)" && event.countryCode === "DE") {
        standardizedTitle = "German GDP QoQ";
      } else if (event.name === "Gross Domestic Product (YoY)" && event.countryCode === "DE") {
        standardizedTitle = "German GDP YoY";
      }

      if (event.countryCode === "EMU") {
        event.countryCode = "EU";
      }
      if (event.countryCode === "UK") {
        event.countryCode = "GB";
      }

      if (allowedTitles.has(standardizedTitle)) {
        return {
          indicator: standardizedTitle,
          actual: event.actual,
          previous: event.previous,
          forecast: event.consensus,
          date: event.dateUtc,
          country: event.countryCode,
          currency: event.currencyCode,
          importance: event.volatility,
          revised:event.revised
        };
      } else {
        return null;
      }
    }).filter(event => event !== null);
  });
}

module.exports = { normalizeEconomicData };


