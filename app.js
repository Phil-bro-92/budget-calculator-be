const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.json());

// DB connection
const MongoClient = require("mongodb").MongoClient;

MongoClient.connect("mongodb://127.0.0.1:27017", { useUnifiedTopology: true })
    .then(client => {
        const db = client.db("budget-calculator");
        const customersCollection = db.collection("customers");

        app.use("/customers/login", async (req, res) => {
            const customers = await customersCollection.find({}).toArray();
            const data = req.body;
            for (let i = 0; i < customers.length; i++) {
                if (
                    data.email === customers[i].email &&
                    data.password === customers[i].password
                ) {
                    res.json({ message: "User exists" });
                } else {
                    res.json({ message: "User does not exist" });
                }
            }
        });
    })
    .catch(error => {
        console.error("Error connecting to MongoDB:", error);
    });

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
