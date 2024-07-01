// File: utils/bond.js


const bonds = {
  'U.S. 10Y': { id: 1, countryId: 1 },
  'U.K. 10Y': { id: 2, countryId: 9 },
  'Australia 10Y': { id: 3, countryId: 4 },
  'Japan 10Y': { id: 4, countryId: 2 },
  'Switzerland 10Y': { id: 5, countryId: 10 },
  'New Zealand 10Y': { id: 6, countryId: 5 },
  'Germany 10Y': { id: 7, countryId: 8 },
  'Canada 10Y': { id: 8, countryId: 6 }
};

const bondNameMap = {
  'United States': 'U.S. 10Y',
  'United Kingdom': 'U.K. 10Y',
  'Australia': 'Australia 10Y',
  'Japan': 'Japan 10Y',
  'Switzerland': 'Switzerland 10Y',
  'New Zealand': 'New Zealand 10Y',
  'Germany': 'Germany 10Y',
  'Canada': 'Canada 10Y'
};

module.exports = { bonds, bondNameMap };

  
  