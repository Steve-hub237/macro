require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');  // Add this line to import the fs module
const app = express();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getXataClient } = require('./src/xata');
const { updateBonds } = require('./api-integration/scrapeBond');
const { filterDataForAllCountries } = require('./data-processing/dataFilter');
const { fetchPredefinedEconomicData } = require('./api-integration/externalApiClient');
const { normalizeEconomicData } = require('./api-integration/dataNormalizer');
const { CotData ,createUser,findUserByEmail,fetchScoreData,fetchLatestCOTData} = require('./database/databaseInterface');
const { scheduleDailyDataFetchAndInsert, scheduleRegularDataUpdates, scheduledRetailUpdate, scheduleDailyScoreInserts, scheduleRegularScoreUpdates } = require('./scheduling/taskScheduler');
const util = require('util');
const xata = getXataClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

app.use(cors());
app.use(express.json());

const { analyzeUSIndicators, analyzeEUIndicators, analyzeCHIndicators, analyzeNZIndicators, analyzeJPIndicators, analyzeAUIndicators, analyzeUKIndicators, analyzeCAIndicators, analyzeCHINAIndicators } = require('./data-analysis/indicatorAnalyzer');

scheduleDailyDataFetchAndInsert();
scheduleRegularDataUpdates();
scheduledRetailUpdate();
scheduleDailyScoreInserts();
scheduleRegularScoreUpdates();

analyzeUKIndicators();

//updateBonds();
let fetchedData = {}; // Variable to hold the fetched, normalized, and filtered data

async function main() {
  try {
    const rawData = await fetchPredefinedEconomicData("2024-04-20", "2024-04-27");
    const normalizedData = normalizeEconomicData(rawData);
    const filteredData = filterDataForAllCountries(normalizedData);
    fetchedData = filteredData; // Store the filtered data
    console.log("Normalize:", util.inspect(normalizedData, { depth: null, colors: true }));
  } catch (error) {
    console.error('Error fetching and normalizing data:', error);
  }
}

// main();

app.get('/me', (req, res) => {
  res.json(fetchedData); // Serve the data as JSON
});

app.get('/api/cot', async (req, res) => {
  const countryId = req.query.countryId || '2'; // Default to '2' if not provided
  try {
    const cot = await CotData(countryId);
    res.json(cot);
  } catch (error) {
    console.error('Error fetching COT data:', error);
    res.status(500).json({ error: 'Failed to fetch COT data' });
  }
});
app.get('/api/latest-cot', async (req, res) => {
  try {
    const cot = await fetchLatestCOTData();
    res.json(cot);
  } catch (error) {
    console.error('Error fetching latest COT data:', error);
    res.status(500).json({ error: 'Failed to fetch latest COT data' });
  }
});

app.get('/api/score', async (req, res) => {
  const biasFilter = req.query.bias;

  try {
    const scoreData = await fetchScoreData(biasFilter);
    res.json(scoreData);
  } catch (error) {
    console.error('Error fetching score data:', error);
    res.status(500).json({ message: 'Error fetching score data' });
  }
});


app.post('/api/signup', async (req, res) => {
  const { email, password,name} = req.body;

  try {
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(400).send({ message: 'User already exists' });
    }

    const user = await createUser(email,password,name)

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);

    res.status(201).send({ token });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).send({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).send({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);

    res.status(200).send({ token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Serve static files from the React app


const port = process.env.PORT || 4000; // Ensure this line reads the correct port from .env
app.listen(port, () => {
  console.log(`Server connected on port ${port}`);
});


