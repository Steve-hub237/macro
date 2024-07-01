const {
    analyzeNZIndicators,
    analyzeUSIndicators,
    analyzeEUIndicators,
    analyzeCAIndicators,
    analyzeCHIndicators,
    analyzeAUIndicators,
    analyzeUKIndicators,
    analyzeJPIndicators
} = require('./indicatorAnalyzer');
const{fetchRetailData,insertScoreData} = require('../database/databaseInterface')
const { pairIdMap } = require('../utils/pairIdMap');


async function calculateRelativeScores() {
    // Fetch scores for each country
    const retailData = await fetchRetailData();
    const scores = {
        NZ: await analyzeNZIndicators(),
        US: await analyzeUSIndicators(),
        EU: await analyzeEUIndicators(),
        CA: await analyzeCAIndicators(),
        CH: await analyzeCHIndicators(),
        AU: await analyzeAUIndicators(),
        UK: await analyzeUKIndicators(),
        JP: await analyzeJPIndicators()
    };

        const retailAdjustments = retailData.reduce((adjustments, data) => {
        const pair = data.Pair.Pair; 
        let adjustment = 0;
    
        // Adjust for long percentages
        if (data.longPercentage > 85) {
            adjustment = -2; 
        } else if (data.longPercentage > 70) {
            adjustment = -1; 
        } else if (data.longPercentage >= 51) {
            adjustment = 0; 
        }
    
        // Adjust for short percentages
        if (data.shortPercentage > 85) {
            adjustment = 2; 
        } else if (data.shortPercentage > 70) {
            adjustment += 1; 
        } else if (data.shortPercentage >= 51) {
            if (adjustment >= 0) {
                adjustment += 0; 
            }
        }
    
        // Ensure balance when long and short percentages are equal
        if (data.longPercentage === 50 && data.shortPercentage === 50) {
            adjustment = 0; 
        }
    
        adjustments[pair] = adjustment;
    
        console.log(`Pair: ${pair}, Adjustment: ${adjustment}`);
        return adjustments;
    }, {});
    
    const pairs = {
        'EURUSD': scores.EU - scores.US,
        'USDJPY': scores.US - scores.JP,
        'GBPUSD': scores.UK - scores.US,
        'USDCHF': scores.US - scores.CH,
        'AUDUSD': scores.AU - scores.US,
        'USDCAD': scores.US - scores.CA,
        'NZDUSD': scores.NZ - scores.US,
        'EURGBP': scores.EU - scores.UK,
        'EURAUD': scores.EU - scores.AU,
        'EURCAD': scores.EU - scores.CA,
        'EURCHF': scores.EU - scores.CH,
        'EURJPY': scores.EU - scores.JP,
        'GBPJPY': scores.UK - scores.JP,
        'CHFJPY': scores.CH - scores.JP,
        'GBPAUD': scores.UK - scores.AU,
        'GBPCAD': scores.UK - scores.CA,
        'GBPCHF': scores.UK - scores.CH,
        'AUDJPY': scores.AU - scores.JP,
        'AUDCAD': scores.AU - scores.CA,
        'AUDCHF': scores.AU - scores.CH,
        'CADJPY': scores.CA - scores.JP,
        'NZDJPY': scores.NZ - scores.JP,
        'AUDNZD': scores.AU - scores.NZ,
        'CADCHF': scores.CA - scores.CH,
        'EURNZD': scores.EU - scores.NZ,
        'NZDCAD': scores.NZ - scores.CA,
        'NZDCHF': scores.NZ - scores.CH,
        'GBPNZD': scores.UK - scores.NZ,
    };

    const categorizedPairs = {};
    for (const pair in pairs) {
        const finalScore = pairs[pair] + (retailAdjustments[pair] || 0);
        const bias = calculateBias(finalScore);
        const pairId = pairIdMap[pair] || 'unknown';

        categorizedPairs[pair] = {
            score: finalScore,
            bias: bias,
            id: pairId
        };
    }

    return categorizedPairs;
}

function calculateBias(relativeScore) {
    if (relativeScore > 8) {
        return 'Very Bullish';
    } else if (relativeScore > 3) {
        return 'Bullish';
    } else if (relativeScore >= -3 && relativeScore <= 3) {
        return 'Neutral';
    } else if (relativeScore < -3 && relativeScore >= -8) {
        return 'Bearish';
    } else if (relativeScore < -8) 
    {
        return 'Very Bearish';
    }
}




module.exports = { calculateRelativeScores };
