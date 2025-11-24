const express = require('express');
const cors = require('cors');//cross origin resource sharing
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const admin = require("firebase-admin");
const serviceAccount = require("./serviceKey.json");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());



admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

//password: YFLyVz3V6Ac2V7tc
//username: 
const uri = "mongodb+srv://conceptual-session:YFLyVz3V6Ac2V7tc@cluster0.ayh9j9o.mongodb.net/?appName=Cluster0";


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

//MiddleWare
const verifyToken = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        res.status(401).send({
            message: "UnAuthorize access.Token not found"
        })
    }
    const token = authorization.split(' ')[1]


    try {
        await admin.auth().verifyIdToken(token);
        next();

    } catch (error) {
        res.status(401).send({
            message: "UnAuthorize access!"
        })
    }


}

async function run() {
    try {

        await client.connect();
        const db = client.db('model-db');
        const modelCollection = db.collection('models');
        const downloadsCollection = db.collection('downloads');



        //find 
        app.get('/models', async (req, res) => {
            const result = await modelCollection.find().toArray(); //promise
            res.send(result);
        })

        //findOne
        app.get('/models/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            const result = await modelCollection.findOne({ _id: new ObjectId(id) })
            // console.log(id);
            res.send({
                success: true,
                result,
            })
        })

        //post method
        //insertOne
        //insertMany

        app.post('/models', async (req, res) => {
            const data = req.body;
            console.log(data);
            const result = await modelCollection.insertOne(data);
            res.send({
                success: true,
                result
            })
        })
        //put  
        //updateOne
        //updateMany

        app.put('/models/:id', async (req, res) => {
            const { id } = req.params;
            const data = req.body;
            const objectId = new ObjectId(id);
            const filter = { _id: objectId };
            const upDate = {
                $set: data
            }
            const result = await modelCollection.updateOne(filter, upDate);;
            //console.log(id);
            res.send({
                success: true,
                result,
            })
        })

        //delete
        //deleteOne
        //deleteMany

        app.delete('/models/:id', async (req, res) => {
            const { id } = req.params;

            const result = await modelCollection.deleteOne({ _id: new ObjectId(id) });
            res.send({
                success: true,
                result
            })
        })

        //latest 6 data
        //find
        //get
        app.get('/latest-models', async (req, res) => {
            const result = await modelCollection.find().sort({ created_at: -1 }).limit(6).toArray();

            res.send(result)
        })

        app.get("/my-models", verifyToken, async (req, res) => {
            const email = req.query.email;
            const result = await modelCollection.find({ created_by: email }).toArray();
            res.send(result);
        })

        app.post("/downloads/:id", async (req, res) => {
            const data = req.body;
            const id  = req.params.id
            const result = await downloadsCollection.insertOne(data);

            const filter = { _id: new ObjectId(id) }
            const update = {
                $inc: {
                    downloads: 1
                }
            }
            const downloadCount = await modelCollection.updateOne(filter, update)
            res.send(result, downloadCount);
        })

        app.get("/my-downloads", verifyToken, async (req, res) => {
            const email = req.query.email;
            const result = await downloadsCollection.find({ downloaded_by: email }).toArray();
            res.send(result);
        })
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");



    }
    finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Server is Running')
})
app.get('/hello', (req, res) => {
    res.send('Hi I i am Obayed How are u!')
})

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
})
