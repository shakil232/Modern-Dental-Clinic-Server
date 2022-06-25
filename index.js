const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const admin = require("firebase-admin");
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5001;


// firebase-admin-initialize 
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID, 
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });


// middleware
app.use(express.json());
app.use(cors());

// CONNECT-MONGODB-uri 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k4txisg.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// verifyUser-TOKEN 
const verifyToken = async (req, res, next) => {
    if (req.headers.authorization.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split('Bearer ')[1]
        try {
            const decodeUser = await admin.auth().verifyIdToken(idToken)
            req.decodeUserEmail = decodeUser.email
        }
        catch {

        }
    }
    next();
};


// MONGODB-CONNECT-API 
const run = async () => {
    try {
        await client.connect();
        // database and collection 
        const database = client.db("dentalServices");
        const serviceCollection = database.collection("services");
        const bookingCollection = database.collection("bookingAppointments");
        const adminCollection = database.collection("admin");


        // ServiceCollection-All-Api 
        // ALL-SERVICE-POST-API 
        app.post('/addServices', async (req, res) => {
            const serviceInfo = req.body;
            const result = await serviceCollection.insertOne(serviceInfo);
            res.json(result)
        });

        //   ALL-SERVICE-GET-API 
        app.get('/allServices', async (req, res) => {
            const cursor = serviceCollection.find({});
            const result = await cursor.toArray();
            res.json(result)
        });

        // SINGLE-SERVICE-GET-API
        app.get('/singleService/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.findOne(query);
            res.json(result)
        });

        // SINGLE-SERVICE-UPDATE-PUT-API
        app.put('/serviceUpdate/:id', async (req, res) => {
            const id = req.params.id;
            const updateInfo = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    servicesName: updateInfo.servicesName,
                    servicesCost: updateInfo.servicesCost,
                    servicesTime: updateInfo.servicesTime,
                    servicesSpace: updateInfo.servicesSpace
                },
            };
            const result = await serviceCollection.updateOne(filter, updateDoc, options);
            res.json(result)

        });

        // SINGLE-SERVICE-DELETE-API 
        app.delete('/serviceDelete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.deleteOne(query);
            res.json(result)
        });



        // BOOKING-COLLECTIONS 
        // BOOKING-APPOINTMENT-POST-API 
        app.post('/addAppointments', async (req, res) => {
            const bookingInfo = req.body;
            const result = await bookingCollection.insertOne(bookingInfo);
            res.json(result)
        });

        // BOOKING-APPOINTMENT-GET-API 
        app.get('/allAppointments', async (req, res) => {
            const cursor = bookingCollection.find({});
            const result = await cursor.toArray();
            res.json(result)
        });

        // BOOKING-SINGLE-APPOINTMENT-DELETE-API 
        app.delete('/appointmentCancel/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookingCollection.deleteOne(query);
            res.json(result)
        });

        // UPDATE-STATUS-APPOINTMENT-PUT-API 
        app.put('/statusUpdate', async (req, res) => {
            const { id, status } = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateStatus = {
                $set: {
                    status: status
                },
            };
            const result = await bookingCollection.updateOne(filter, updateStatus, options);
            res.json(result)
        });

        // BOOKING-APPOINTMENT-QUERY-BY-EMAIL-GET-API 
        app.get('/appointmentByEmail', verifyToken, async (req, res) => {
            const email = req.query.email;
            if (req.decodeUserEmail === email) {
                const query = { PatientEmail: email }
                const cursor = bookingCollection.find(query);
                const result = await cursor.toArray();
                res.json(result)
            }
            else {
                res.status(401).json({ message: 'unauthorize user' })
            }

        })

        // BOOKING-APPOINTMENT-QUERY-BY-SELECTED-DATE-GET-API 
        app.get('/appointmentByDate', async (req, res) => {
            const date = req.query.date;
            const query = { serviceDate: date }
            const cursor = bookingCollection.find(query);
            const result = await cursor.toArray();
            res.json(result)
        })



        // ADMIN-COLLECTION 
        // POST-API  
        app.post('/makeAdmin', async (req, res) => {
            const adminInfo = req.body;
            const result = await adminCollection.insertOne(adminInfo);
            res.json(result)
        });

        // GET-API 
        app.get('/allAdmin', async (req, res) => {
            const cursor = adminCollection.find({});
            const result = await cursor.toArray();
            res.json(result)
        })

        // QUERY-ADMIN-GET-API 
        app.get('/isAdmin', async (req, res) => {
            const email = req.query.email;
            const query = { adminEmail: email }
            const cursor = adminCollection.find(query);
            const result = await cursor.toArray();
            res.json(result)
        });

          // ADMIN-DELETE-API 
          app.delete('/adminDelete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await adminCollection.deleteOne(query);
            res.json(result)
        });

    }
    finally {
        //   await client.close();
    }
}
// run-function-calling 
run().catch(console.dir);


// Default-Api 
app.get('/default', (req, res ) => {
    res.send('welcome modern-dental-clinic')
})

// LISTEN-PORT 
app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})
