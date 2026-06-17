require("dotenv").config();

const express = require('express');
const { parseOperations } = require('./src/services/parser');

const app = express();

app.use(express.json());//this middleware converts incoming JSON into request body

app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

app.post('/parse', (req, res) => {
  const spec = req.body;
  const operations = parseOperations(spec);
  res.json(operations);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});