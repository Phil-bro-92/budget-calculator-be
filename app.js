const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

//Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization; // Assuming token is sent in the Authorization header

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    jwt.verify(token, "your-secret-key", (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        req.user = decoded; // Store user information in the request object for later use
        next();
    });
};

//Connect to DB
async function connect() {
    const client = new MongoClient("mongodb://127.0.0.1:27017");

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
        //Connect to DB
        const db = await connect();

        // Hash the password
        const password = req.body.password;
        const hashedPassword = await bcrypt.hash(password, 10);
        const customer = { ...req.body, password: hashedPassword };

        //Get current list of customers
        const currentCustomers = await db
            .collection("customers")
            .find()
            .toArray();
        //Check new customer is not already registered
        const isEmailRegistered = currentCustomers.some(
            (customer) => customer.email === req.body.email
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
        // Connect to DB
        const db = await connect();

        // Find user by email
        const { email, password } = req.body;
        const user = await db.collection("customers").findOne({ email });
        console.log(user);
        // Check if the customer exists
        if (!user) {
            return res.status(404).json({ error: "Customer not found" });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign({ customer: user }, "secret-key");

        // If everything is okay, send back the user information and token
        res.status(200).json({ user, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//Update Customer details
app.post("/update-details", async (req, res) => {
    try {
        const updatedDetails = req.body; // Assuming request body contains updated details
        const customerId = req.body.id;
        console.log(customerId);
        console.log(req.body);
        // Connect to DB
        const db = await connect();
        const updatedCustomer = await db
            .collection("customers")
            .findOneAndUpdate(
                { _id: new ObjectId(customerId) }, // Ensure _id is of type ObjectID
                {
                    $set: {
                        first_name: updatedDetails.first_name,
                        last_name: updatedDetails.last_name,
                        email: updatedDetails.email,
                        phone: updatedDetails.phone,
                    },
                },
                { returnDocument: "after" } // 'after' to get the updated document
            );
        console.log(updatedCustomer);
        if (!updatedCustomer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        res.json(updatedCustomer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//Create new budget
app.post("/submit/:id", async (req, res) => {
    try {
        // Connect to DB
        const db = await connect();

        //Sum Income and outgoing
        const incomeKeys = ["income", "otherIncome"];
        const outgoingKeys = [
            "mortgage",
            "car",
            "taxes",
            "media",
            "food",
            "insurance",
            "creditors",
            "otherOutgoings",
        ];
        const totalIncome = incomeKeys.reduce((accumulator, key) => {
            const value = +req.body[key] || 0;
            return accumulator + value;
        }, 0);
        const totalOutgoings = outgoingKeys.reduce((accumulator, key) => {
            const value = +req.body[key] || 0;
            return accumulator + value;
        }, 0);

        //Find and update user budgets

        const budget = {
            id: new ObjectId(),
            ...req.body,
            disposable: totalIncome - totalOutgoings,
        };

        await db.collection("customers").findOneAndUpdate(
            { _id: new ObjectId(req.params) }, // Match the user by _id field
            { $push: { budgets: budget } }, // Push the new budget to the 'budgets' array
            { returnOriginal: false } // Return the updated document
        );

        // Find the customer by ID
        const customer = await db
            .collection("customers")
            .findOne({ _id: new ObjectId(req.params) });

        res.json(customer); // Send the updated user as the response
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//Delete a budget
app.delete(`/delete/:userId/:budgetId`, async (req, res) => {
    const { userId, budgetId } = req.params;
    try {
        // Connect to DB
        const db = await connect();
        const customer = await db.collection("customers").findOne({
            _id: new ObjectId(userId),
        });

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Filter out the budget to be deleted
        customer.budgets = customer.budgets.filter(
            (budget) => budget.id.toString() !== budgetId
        );

        // Update the customer document with the modified budgets array
        await db
            .collection("customers")
            .updateOne(
                { _id: new ObjectId(userId) },
                { $set: { budgets: customer.budgets } }
            );

        const updated = await db.collection("customers").findOne({
            _id: new ObjectId(userId),
        });

        res.status(200).json(updated);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
    console.log(`App is listening on port ${PORT}.`);
});
