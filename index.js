const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
const stripe = require("stripe")('sk_test_51M6vipFIcZQlcbQaxqmHdDOc9n0FmeyIWY9HXnPPrPX1DqUDyZ4ag0Hhc81CGMIdc93xFHKvgyOPKaunwpuFEyQ800BFd4s0zi');

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
    const Bookings = client.db('CameraCrew').collection('bookings');
    const Reports = client.db('CameraCrew').collection('reports');
    const Payments = client.db('CameraCrew').collection('payments');

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

    // app.post("/create-payment-intent", async (req, res) => {
    //   const booking = req.body;
    //   const price = booking.price;
    //   const amount = price * 100;
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount,
    //     currency: "usd",
    //     "payment_method_types": [
    //       "card"
    //     ],
    //   });
    //   res.send({
    //     clientSecret: paymentIntent.client_secret,
    //   });
    // });

    // app.post('/payments', async (req, res) => {
    //   const payment = req.body;
    //   const result = await Payments.insertOne(payment);
    //   const id = payment.bookingId;
    //   const filter = { _id: ObjectId(id) };
    //   const updatedDoc = {
    //     $set: {
    //       paid: true,
    //       transactionId: payment.transactionId
    //     }
    //   }
    //   const updateBooking = await Bookings.updateOne(filter, updatedDoc)
    //   res.send(result);
    // })

    app.get('/reports', async (req, res) => {
      const query = {}
      const reports = await Reports.find(query).toArray();
      res.send(reports);
    })
    app.get('/booking', async (req, res) => {
      const query = {}
      const bookings = await Bookings.find(query).toArray();
      res.send(bookings);
    })
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await Users.findOne(query);
      res.send(result)
    })
    app.get('/users', async (req, res) => {
      const role = req.query.role;
      const query = { role };
      const user = await Users.find(query).toArray();
      res.send(user)
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

    app.get('/myOrders/:email', verifyJWT, async (req, res) => {
      const userEmail = req.params.email;
      const query = { userEmail };
      const bookings = await Bookings.find(query).toArray();
      res.send(bookings)
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
    app.get('/dashboard/payment/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await Bookings.findOne(query);
      res.send(product);
    })
    app.post('/reportProduct', async (req, res) => {
      const report = req.body;
      const result = await Reports.insertOne(report);
      res.send(result);
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
      res.send({ result, value })
    })
    app.delete('/seller/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const email = req.body.email;
      const filter = { _id: ObjectId(id) }
      const query = { email: email }
      const result = await Users.deleteOne(filter)
      const value = await Products.deleteMany(query);
      res.send({ result, value })
    })
    app.get('/products/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const products = await Products.find(query).toArray();
      res.send(products)
    })
    app.post('/booking', async (req, res) => {
      const booking = req.body;
      const result = await Bookings.insertOne(booking);
      res.send(result);
    })
    app.post('/products', verifyJWT, async (req, res) => {
      const product = req.body;
      const result = await Products.insertOne(product)
      res.send(result)
    })
    app.delete('/products/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const filter = { productId: id }
      const result = await Products.deleteOne(query);
      const value = await Reports.deleteMany(filter)
      res.send(result);
    })
    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { productId: id };
      const result = await Bookings.deleteOne(query);
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