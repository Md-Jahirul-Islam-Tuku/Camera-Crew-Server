const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  const token = authHeader.split(' ')[1]

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fqmp7pn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    const Users = client.db('CameraCrew').collection('users');
    const Products = client.db('CameraCrew').collection('products');
    const Categories = client.db('CameraCrew').collection('categories');

    app.put('/user/:email', async (req, res) => {
      const email = req.params.email
      const user = req.body
      const filter = { email: email }
      const options = { upsert: true }
      const updateDoc = {
        $set: user,
      }
      const result = await Users.updateOne(filter, updateDoc, options)

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '40d',
      })
      res.send({ result, token })
    })
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await Users.findOne(query);
      res.send(user)
    })
    app.get('/users', async (req, res) => {
      const role = req.query.role;
      const query = { role };
      const user = await Users.find(query).toArray();
      res.send(user)
    })
    app.get('/products/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const products = await Products.find(query).toArray();
      res.send(products)
    })

    app.get('/categoryProducts/:category', async (req, res) => {
      const category = req.params.category;
      const query = { category };
      const products = await Products.find(query).toArray();
      res.send(products)
    })
    app.get('/advertisementProducts', async (req, res) => {
      const query = { advertisement: true };
      const products = await Products.find(query).toArray();
      res.send(products)
    })
    app.get('/categories', async (req, res) => {
      const query = {};
      const products = await Categories.find(query).toArray();
      res.send(products)
    })
    app.put('/products/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          advertisement: true
        }
      }
      const result = await Products.updateOne(filter, updateDoc, options)
      res.send(result)
    })
    app.put('/productReport/:id', async (req, res) => {
      const id = req.params.id;
      const email = req.body?.email;
      const filter = { _id: ObjectId(id) }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          report: true,
          reportEmail: email
        }
      }
      const result = await Products.updateOne(filter, updateDoc, options)
      res.send(result)
    })
    app.put('/seller/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const verification = req.body.changeText;
      const email = req.body.email;
      const filter = { _id: ObjectId(id) }
      const query = { email: email }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          badge: verification
        }
      }
      const result = await Users.updateOne(filter, updateDoc, options)
      const value = await Products.updateMany(query, updateDoc, options);
      res.send({result, value})
    })
    app.post('/products', verifyJWT, async (req, res) => {
      const product = req.body;
      const result = await Products.insertOne(product)
      res.send(result)
    })
    app.delete('/products/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await Products.deleteOne(query);
      res.send(result);
    })
  }
  finally {

  }
}
run().catch(err => console.error(err));

app.get('/', (req, res) => {
  res.send('Camera Crew server is running...')
})

app.listen(port, () => {
  console.log(`Camera Crew server is listening on ${port}`);
})