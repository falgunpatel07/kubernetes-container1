// container1/app.js
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
// hi 
// Configuration
const PORT = process.env.PORT || 3000;
const STORAGE_DIR = process.env.STORAGE_DIR || './storage'; // This will map to PV in k8s
const CONTAINER2_URL = process.env.CONTAINER2_URL || 'http://localhost:3001'; // Will be service name in k8s

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// POST endpoint to store file
app.post('/store-file', (req, res) => {
  const { file, data } = req.body;
  
  // Validate input
  if (!file) {
    return res.status(400).json({
      file: null,
      error: "Invalid JSON input."
    });
  }
  
  try {
    // Write to file
    const filePath = path.join(STORAGE_DIR, file);
    fs.writeFileSync(filePath, data);
    
    return res.status(200).json({
      file: file,
      message: "Success."
    });
  } catch (error) {
    console.error(`Error writing file: ${error.message}`);
    return res.status(500).json({
      file: file,
      error: "Error while storing the file to the storage."
    });
  }
});
app.post('/calculate', async (req, res) => {
  const { file, product } = req.body;
  
  // Validate input
  if (!file) {
    return res.status(400).json({
      file: null,
      error: "Invalid JSON input."
    });
  }
  
  // Check if file exists
  const filePath = path.join(STORAGE_DIR, file);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      file: file,
      error: "File not found."
    });
  }
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // First check: file must start with "product, amount" header
    if (!fileContent.trim().startsWith('product, amount')) {
      return res.status(400).json({
        file: file,
        error: "Input file not in CSV format."
      });
    }
    // just checking the ci/cd pipeline
    // Second check: try to parse using csv-parse
    let records;
    try {
      const { parse } = require('csv-parse/sync');
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: false // Don't allow inconsistent columns
      });
      
      // Verify required columns exist
      if (!records.length || !records[0].hasOwnProperty('product') || !records[0].hasOwnProperty('amount')) {
        throw new Error('CSV format error');
      }
    } catch (parseError) {
      return res.status(400).json({
        file: file,
        error: "Input file not in CSV format."
      });
    }
    
    // Calculate sum for the product
    let sum = 0;
    records.forEach(record => {
      if (record.product && record.product.trim() === product) {
        sum += parseInt(record.amount) || 0;
      }
    });
    
    return res.status(200).json({
      file: file,
      sum: sum
    });
  } catch (error) {
    console.error(`Error processing file: ${error.message}`);
    return res.status(500).json({
      file: file,
      error: "Error processing file."
    });
  }
});

// Start endpoint needed for assessment
app.post('/start', (req, res) => {
  const { banner, ip } = req.body;
  // In a real implementation, you would save these values
  console.log(`Received start request with banner: ${banner}, ip: ${ip}`);
  res.status(200).json({ message: "Start endpoint received" });
});

app.listen(PORT, () => {
  console.log(`Container 1 listening on port ${PORT}`);
});


