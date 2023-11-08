use budget-calculator;
db.dropDatabase();

db.customers.insertMany([
        {
            first_name: "Bob",
            last_name: "Saget",
            email: "bobsaget@madeup.com",
            password: 'bobs',
            phone: "987654321",
            income: 0,
            other_income: 0,
            mortgage: 0,
            car: 0,
            taxes: 0,
            media: 0,
            food: 0,
            insurance: 0,
            creditors: 0,
            other_outgoings: 0

        },
        {
            first_name: "Liz",
            last_name: "Anya",
            email: "lizanya@madeup.com",
            password: 'liza',
            phone: "111111111",
            income: 0,
            other_income: 0,
            mortgage: 0,
            car: 0,
            taxes: 0,
            media: 0,
            food: 0,
            insurance: 0,
            creditors: 0,
            other_outgoings: 0
    },
       

]);

