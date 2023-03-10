const express = require("express");
const mongo = require("mongodb");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
dotenv.config();
const MongoClient = mongo.MongoClient;
const app = express();
app.use(cors());

const PORT = process.env.PORT || 8000;
const MONGO_URL = process.env.MONGO_URL;
let db;

//supporting libraries - middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Mongodb Connection
MongoClient.connect(MONGO_URL, (err, client) => {
  console.log("Mongo is connected");
  if (err) console.log("Error while connecting");
  db = client.db("Zomato");
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
});

// Express server default endpoint
app.get("/", (req, res) => {
  res.send("Hello, welcome to Express 🥳😄😃😄");
});

// location endpoint
app.get("/locations", (req, res) => {
  db.collection("locations")
    .find()
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

//get restaurants data, on basis of city and meal
app.get("/restaurants", (req, res) => {
  let query = {};
  let stateId = Number(req.query.stateId);
  let mealId = Number(req.query.mealId);
  if (stateId && mealId) {
    query = { state_id: stateId, "mealTypes.mealtype_id": mealId };
  } else if (stateId) {
    query = { state_id: stateId };
  } else if (mealId) {
    query = { "mealTypes.mealtype_id": mealId };
  }
  db.collection("restaurantdata")
    .find(query)
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

//quickSearch
app.get("/quickSearch", (req, res) => {
  db.collection("mealtype")
    .find()
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

//filter and sort
app.get("/filter/:mealId", (req, res) => {
  let mealId = Number(req.params.mealId);
  let cuisineId = Number(req.query.cuisineId);
  let lcost = Number(req.query.lcost);
  let hcost = Number(req.query.hcost);
  let query = {};
  //sorting
  let sort = { cost: 1 };
  if (req.query.sort) {
    sort = { cost: req.query.sort };
  }
  if (cuisineId && lcost && hcost) {
    query = {
      "mealTypes.mealtype_id": mealId,
      $and: [{ cost: { $gte: lcost, $lte: hcost } }],
      "cuisines.cuisine_id": cuisineId,
    };
  } else if (lcost && hcost) {
    query = {
      "mealTypes.mealtype_id": mealId,
      $and: [{ cost: { $gte: lcost, $lte: hcost } }],
    };
  } else if (cuisineId) {
    query = {
      "mealTypes.mealtype_id": mealId,
      "cuisines.cuisine_id": cuisineId,
    };
  }
  db.collection("restaurantdata")
    .find(query)
    .sort(sort)
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

//details of restaurant
app.get("/details/:id", (req, res) => {
  let id = Number(req.params.id);
  db.collection("restaurantdata")
    .find({ restaurant_id: id })
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

//get menu items of restaurant
app.get("/menu/:id", (req, res) => {
  let id = Number(req.params.id);
  db.collection("restaurantmenu")
    .find({ restaurant_id: id })
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

//menu details based on user selected items
app.post("/menuItems", (req, res) => {
  if (Array.isArray(req.body)) {
    db.collection("restaurantmenu")
      .find({ menu_id: { $in: req.body } })
      .toArray((err, result) => {
        if (err) throw err;
        res.send(result);
      });
  } else {
    res.send("Invalid input");
  }
});

//place order
app.post("/placeOrder", (req, res) => {
  console.log(req.body);
  db.collection("orders").insert(req.body, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

//list of orders & orders of particular user
app.get("/orders", (req, res) => {
  let email = req.query.email;
  let query = {};
  if (email) {
    query = { email };
  }
  db.collection("orders")
    .find(query)
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

//update orders
app.put("/updateOrder/:id", (req, res) => {
  let oid = Number(req.params.id);
  db.collection("orders").updateOne(
    { orderId: oid },
    {
      $set: {
        status: req.body.status,
        bank_name: req.body.bank_name,
        date: req.body.date,
      },
    },
    (err, result) => {
      if (err) throw err;
      res.send("Order Updated");
    }
  );
});

//delete orders
app.delete("/deleteOrder/:id", (req, res) => {
  let oid = mongo.ObjectId(req.params.id);
  db.collection("orders").deleteOne({ _id: oid }, (err, result) => {
    if (err) throw err;
    res.send("Order Deleted");
  });
});
