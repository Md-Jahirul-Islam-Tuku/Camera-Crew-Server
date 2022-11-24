const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

async function run() {
  try{
    const Users = client.db('CameraCrew').collection('users');
  }
  finally{

  }
}

app.get('/', (req, res) => {
  res.send('Camera Crew server is running...')
})

app.listen(port, () => {
  console.log(`Camera Crew server is listening on ${port}`);
})