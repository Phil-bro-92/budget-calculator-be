const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  console.log("HELLO WORLD");
  res.status(200);
  res.send({ message: "Hello World" });
});

app.post("/submit", async (req, res) => {
  res.status(200);
  res.send("Success");
  console.log(req.body);
});

const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}.`);
});
