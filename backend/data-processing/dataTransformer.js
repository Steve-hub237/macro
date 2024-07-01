/**
 * Normalizes raw economic event data to a consistent format using predefined mappings.
 * @param {Array} rawData - The array of raw data objects from the API.
 * @returns {Array} An array of normalized data objects.
 */

const indicatorMapping = {
    "BoC Interest Rate Decision": "Interest Rate",
    "SNB Interest Rate Decision": "Interest Rate",
    "Ivey PMI s.a": "Manufacturing PMI",
    "Inflation Rate MoM": "CPI MoM",
    "procure.ch Manufacturing PMI": "Manufacturing PMI",
    "Judo Bank Manufacturing PMI Flash":"Flash Manufacturing PMI",
    "GDP Growth Rate QoQ": "GDP QoQ",
    "RBNZ Interest Rate Decision": "Interest Rate",
    "Inflation Rate QoQ": "CPI QoQ",
    "Loan Prime Rate 1Y":"Interest Rate",
    "Caixin Manufacturing PMI " : "Manufacturing PMI",
    "Caixin Services PMI":"Services PMI",
    "Tankan Large Manufacturers Index": "Business Confidence",
    "GDP Capital Expenditure QoQ Prel": "Prelim GDP QoQ",
    "BoJ Interest Rate Decision": "Interest Rate",
    "ECB Interest Rate Decision": "Interest Rate",
    "GDP Growth Rate QoQ Flash": "GDP QoQ",
    "GDP Growth Rate QoQ Final": "GDP QoQ",
    "GDP Growth Rate QoQ Prel":"Prelim GDP QoQ",
    "Employment Change QoQ Prel": "Flash Employment Change QoQ",
    "Employment Change QoQ":"Employment Change",
    "Core Inflation Rate MoM": "Core CPI MoM",
    "Initial Jobless Claims": "Unemployment Claims",
    "Michigan Consumer Sentiment Prel": "UoM Consumer Sentiment",
    "NY Empire State Manufacturing Index": "Empire State Manufacturing Index",
    "Inflation Rate YoY": "CPI YoY",
    "Fed Interest Rate Decision": "Interest Rate",
    "S&P Global Manufacturing PMI Flash": "Flash Manufacturing PMI",
    "Jibun Bank Manufacturing PMI Flash":"Flash Manufacturing PMI",
    "Jibun Bank Services PMI Flash":"Flash Services PMI",
    "S&P Global Services PMI Flash": "Flash Services PMI",
    "Judo Bank Services PMI Flash":"Flash Services PMI",
    "Retail Sales MoM Prel":"Retail Sales MoM",
    "BoE Interest Rate Decision": "Interest Rate",
    "RBA Interest Rate Decision":"Interest Rate",
    "ADP Employment Change": "ADP NFP",
    "RBA Trimmed Mean CPI QoQ": "Trimmed Mean CPI QoQ",
    "Claimant Count Change": "Unemployment Change",
    "Non Farm Payrolls" : "Employment Change",
    "JOLTS Job Openings":"JOLTS",
    "CPI Trimmed-Mean YoY":"Trimmed Mean CPI QoQ",
    "Retail Sales Ex Autos MoM":"Core Retail Sales MoM",
    "GDP Growth Rate QoQ Adv":"Advance GDP QoQ",
    "Business NZ PMI":"Manufacturing PMI",
    "Services NZ PSI":"Services PMI",
    "GDP Growth Rate QoQ 2nd Est":"Prelim GDP QoQ",
    "PCE Price Index MoM":"Core PCE Price Index",
    "GDP Growth Rate YoY Flash":"GDP YoY",
    "GDP Growth Rate YoY":"GDP YoY",
    "GDP Growth Rate Annualized":"GDP YoY",
    "PPI Output MoM":"PPI MoM",
    "PPI Output YoY":"PPI YoY",
    "Balance of Trade" : "Trade Balance",
    "RBA Trimmed Mean CPI YoY":"Trimmed Mean CPI YoY",
    "Core Inflation Rate YoY":"Core CPI YoY",
    "GDP Growth Rate YoY Prel":"Prelim GDP YoY"
};

const allowedTitles = new Set([
    "Unemployment Rate", "Employment Change", "Wage Price Index QoQ", "Core Retail Sales MoM", "Tokyo Core CPI YoY","Imports YoY","Exports YoY","NBS Manufacturing PMI","NBS Non Manufacturing PMI","Industrial Production YoY",
    "Consumer Confidence", "Tokyo CPI YoY", "PPI MoM", "Core PPI MoM", "Retail Sales MoM", "CB Consumer Confidence",
    "Core PCE Price Index", "ISM Manufacturing PMI", "ISM Services PMI", "JOLTS", "Average Hourly Earnings MoM", "GDP MoM", "Retail Sales QoQ",
    "Interest Rate", "Manufacturing PMI", "CPI MoM", "CPI QoQ", "Business Confidence", "Prelim GDP QoQ", "French Flash Services PMI",
    "French Flash Manufacturing PMI", "German Flash Manufacturing PMI", "German Flash Services PMI", "German Prelim GDP QoQ",
    "French Prelim GDP QoQ", "German Prelim CPI MoM", "Flash Employment Change QoQ", "Unemployment Claims","German Prelim CPI YoY",
    "UoM Consumer Sentiment", "Empire State Manufacturing Index", "CPI YoY", "Flash Manufacturing PMI", "Flash Services PMI","PPI YoY",
    "ADP NFP", "Trimmed Mean CPI QoQ","Core CPI MoM","CPI Median YoY","Advance GDP QoQ","Unemployment Change","GDP QoQ","Services PMI","Final GDP QoQ","AU CPI YoY","Retail Sales YoY","GDP YoY","CPI YoY Prel","Building Permits MoM Prel","Trade Balance","Core CPI YoY","Prelim GDP YoY"
]);

  
function normalizeEconomicData(rawData) {
    if (!Array.isArray(rawData)) 
    {
        throw new TypeError('Expected rawData to be an array');
    }

    return rawData.flatMap(item => {
        if (!item.data || !Array.isArray(item.data.result)) {
            console.warn('Unexpected data structure:', item);
            return [];
        }
        return item.data.result.map(event => {
            let standardizedTitle = indicatorMapping[event.title] || event.title; 
           
            if (event.title === "HCOB Manufacturing PMI Flash" || event.title === "HCOB Services PMI Flash") {
                if (event.country === "DE") {
                    standardizedTitle = event.title.includes("Manufacturing") ? "German Flash Manufacturing PMI" : "German Flash Services PMI";
                } else if (event.country === "FR") {
                    standardizedTitle = event.title.includes("Manufacturing") ? "French Flash Manufacturing PMI" : "French Flash Services PMI";
                }
            }
            else if (event.title === "Inflation Rate MoM Prel") {
                if (event.country === "DE") {
                    standardizedTitle = "German Prelim CPI MoM";
                } else if (event.country === "EU" || event.country === "FR") {
                    standardizedTitle = "CPI MoM";
                }
            }
            else if (event.title === "Inflation Rate YoY Prel") {
                if (event.country === "DE") {
                    standardizedTitle = "German Prelim CPI MoM";
                } else if (event.country === "EU" || event.country === "FR") {
                    standardizedTitle = "CPI YoY Prel";
                }
            }
            else if (event.title === "Monthly CPI Indicator") {
                if (event.country === "AU") {
                    standardizedTitle = "AU CPI YoY";
                } else {
                    standardizedTitle = "CPI MoM";
                }
            }

                
            if (allowedTitles.has(standardizedTitle)) {
                return {
                    indicator: standardizedTitle,
                    actual: event.actual,
                    previous: event.previous,
                    forecast: event.forecast,
                    date: event.date,
                    country: event.country,
                    currency: event.currency,
                    importance:event.importance
                };
            } else {
                return null; 
            }
        }).filter(event => event !== null); 
    });
}


  
  
  module.exports = { normalizeEconomicData };
  