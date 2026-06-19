require("dotenv").config();

console.log(process.env.JWT_SECRET);
console.log(process.env.JWT_REFRESH_SECRET);

const express = require('express');
const { parseOperations } = require('./src/services/parser');

const cookieParser = require('cookie-parser');

const app = express();

const authRoutes =
    require('./src/routes/auth');

const specRoutes =
    require("./src/routes/specs");

const serverRoutes =
    require("./src/routes/servers");

const jobsRoutes =
  require("./src/routes/jobs");

const errorMiddleware =
  require("./src/middleware/error.middleware");

app.use(express.json());//this middleware converts incoming JSON into request body

app.use(cookieParser());

app.use("/specs", specRoutes);

app.use("/servers", serverRoutes);

app.use("/jobs", jobsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

app.post('/parse', (req, res) => {
  const spec = req.body;
  const operations = parseOperations(spec);
  res.json(operations);
});

app.use('/auth', authRoutes);

app.use(errorMiddleware);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});