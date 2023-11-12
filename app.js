const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");

//Middleware
app.use(cors());
app.use(express.json());

//Connect to DB
async function connect() {
    const client = new MongoClient("mongodb://127.0.0.1:27017", {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    try {
        await client.connect();
        console.log("Connected to the database");
        return client.db("budget-calculator");
    } catch (error) {
        console.error("Error connecting to the database:", error);
        throw error;
    }
}

//ROUTES

//Get all customers
app.get("/customers", async (req, res) => {
    try {
        const db = await connect();
        const customers = await db.collection("customers").find().toArray();
        res.json(customers);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

//Get customer by ID
app.get("/customers/:id", async (req, res) => {
    try {
        //Connect to DB
        const db = await connect();
        // Extract the customer ID from the request parameters
        const customerId = req.params.id;
        console.log(customerId);
        // Validate the ID format
        if (!ObjectId.isValid(customerId)) {
            return res
                .status(400)
                .json({ error: "Invalid customer ID format" });
        }

        // Find the customer by ID
        const customer = await db
            .collection("customers")
            .findOne({ _id: new ObjectId(customerId) });

        // Check if the customer exists
        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }

        // Send the customer data in the response
        res.json(customer);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

//Register new customer
app.post("/register", async (req, res) => {
    try {
        const customer = req.body;
        //Connect to DB
        const db = await connect();
        //Get current list of customers
        const currentCustomers = await db
            .collection("customers")
            .find()
            .toArray();
        //Check new customer is not already registered
        const isEmailRegistered = currentCustomers.some(
            customer => customer.email === req.body.email
        );

        if (isEmailRegistered) {
            // Don't add if email is already registered
            console.log("Email is already registered.");
            res.status(400).json({ message: "Email is already registered" });
        } else {
            // Add the new customer
            await db.collection("customers").insertOne(customer);
            console.log("New customer added.");
            res.status(201).json({ message: "Customer added successfully" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

//Login customer
app.post("/login", async (req, res) => {
    try {
        //Connect to DB
        const db = await connect();
        //Extract body
        const user = req.body;
        console.log(user);
        // Find the customer by email
        const customer = await db.collection("customers").findOne(user);
        console.log(customer);
        // Check if the customer exists
        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }

        // If everything is okay, you can return the customer data or a token for authentication
        res.json(customer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
    console.log(`App is listening on port ${PORT}.`);
});
