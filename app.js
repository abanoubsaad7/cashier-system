const express = require("express");
const app = express();
const port = 5000;

const bodyParser = require("body-parser");

app.use(bodyParser.json());

//templete engine set up
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

//session set up
const session = require("express-session");

//token
const jwt = require("jsonwebtoken");

//models
const User = require("./models/userModel");
const Receipt = require("./models/receiptModel");
const Item = require("./models/itemModel");

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

const mongoose = require("mongoose");
const { json } = require("body-parser");
mongoose
  .connect(
    "mongodb+srv://AbanoubSaad:dev@cluster0.yoqimye.mongodb.net/maicheal-beuty-salon?retryWrites=true&w=majority"
  )
  .then((result) => {
    app.listen(process.env.PORT || port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  })

  .catch((err) => {
    console.log(err);
  });

// Generate JWT token
const generateToken = (user) => {
  const secretKey = "marigerges-e3dadi-taio"; // Replace with your own secret key
  const payload = {
    userId: user._id,
    username: user.username,
    // Include any additional data you want in the token payload
  };
  const options = {
    expiresIn: "20h", // Token expiration time
  };

  return jwt.sign(payload, secretKey, options);
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization || req.session.token;

  if (!token) {
    return res.redirect("/login");
  }

  // Verify the token here
  const secretKey = "marigerges-e3dadi-taio"; // Replace with your own secret key

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).send("Invalid token");
    }

    const userId = decoded.userId;

    User.findById(userId)
      .then((user) => {
        if (!user) {
          return res.status(401).send("Invalid token after decoded");
        }

        req.user = user;
        next();
      })
      .catch((err) => {
        console.error("Error verifying token:", err);
        res.status(500).send("An error occurred while verifying the token");
      });
  });
};

const isAdmin= (req, res, next)=>{
  if(req.user.role === 'admin'){
    next()
  }else{
    res.send('you are not authorized')
  }
}

app.get('/', (req, res) => {
  res.redirect('/login')
})

app.get('/login', (req, res) => {
  res.render('login')
})


app.post("/login", function (req, res) {
  const user = {
    username: req.body.username,
    password: req.body.password,
    role: req.body.role,
  };
  User.findOne(user).then((result) => {
    console.log('result-userFounded :>> ', result);
    if (
      result.username === user.username &&
      result.password === user.password &&
      result.role === user.role
    ) {
      if(result.role === 'admin'){
        const token = generateToken(result);
        req.headers.authorization = token;
        req.session.token = token;
        res.redirect('/main-page');
      }else if(result.role === 'moderator'){
        const token = generateToken(result);
        req.headers.authorization = token;
        req.session.token = token;
        res.redirect('/main-page-moderator');
      }
    }else{
      res.redirect('/login');
    }
  });
});

app.post('/logOut', function (req, res) {
  // Delete the token from the session
  delete req.session.token;

  // Send a response indicating successful logout
  res.send('log out successfully');
});

app.get("/main-page",verifyToken,isAdmin, (req, res) => {
  res.render("main-page");
});

app.get("/main-page-moderator",verifyToken, (req, res) => {
  res.render("main-page-moderator");
});

app.get('/register',verifyToken,isAdmin,(req, res) => {
  res.render('register')
})

app.post("/register",verifyToken,isAdmin, function (req, res) {
  const newUser = new User(req.body);

  newUser
    .save()
    .then((result)=>{
      res.redirect('/main-page')
    })
    .catch((err)=>{
      console.log('err :>> ', err);
    })
});

app.get("/manage-item",verifyToken, isAdmin , (req, res) => {
  Item.find().then((result) => {
    res.render("manage-item", { items: result });
  });
});

app.get("/add-item",verifyToken, isAdmin , (req, res) => {
  res.render("add-item");
});

app.get("/update/:itemID",verifyToken, isAdmin , (req, res) => {
  Item.findById(req.params.itemID).then((result) => {
    res.render("update-item-form", { objItem: result });
  });
});

app.get("/delete-item/:itemID",verifyToken, isAdmin , (req, res) => {
  Item.findById(req.params.itemID).then((result) => {
    res.render("confirm-delete", { objItem: result });
  });
});



app.delete('/item/:itemID', verifyToken, isAdmin , function(req, res) {
  Item.findByIdAndDelete(req.params.itemID).then((result)=>{
    res.json({ myLink: "/manage-item" });
  })
});

app.post("/update-item/:itemID",verifyToken, isAdmin , (req, res) => {
  let itemID = req.params.itemID;
  Item.findByIdAndUpdate(itemID, req.body).then((result) => {
    res.redirect("/manage-item");
  });
});

// Create a new item
app.post("/add-items",verifyToken, isAdmin , async (req, res) => {
  try {
    // const name = req.body.name;
    // const price = req.body.price;
    const item = new Item(req.body);
    await item.save();
    console.log("item :>> ", item);
    res.redirect("/manage-item");
  } catch (error) {
    console.log("error :>> ", error);
    res.status(500).json({ error: "Error creating item" });
  }
});

// app.get('/items',  (req, res) => {
//   Item.find().then((items)=>{
//     res.json({items})
//   }).catch((error)=>{
//     console.log('error :>> ', error);
//   })
// });

app.get("/set-receipt",verifyToken,async (req, res) => {
  Item.find().then((item) => {
    res.render("add-receipt", { arritem: item });
  });
});

app.post("/add-receipt",verifyToken, async (req, res) => {
  try {
    const clientName = req.body.clientName;
    const clientPhone = req.body.clientPhone;
    let itemNames = req.body.itemName;
    let itemPrices = req.body.itemPrice; // An array of selected item names
    const totalPrice = req.body.totalPrice;
    const items = []; // An array to store items as objects
    const payType = req.body.payType;

    // Convert itemNames and itemPrices to arrays if they are not already
    if (!Array.isArray(itemNames)) {
      itemNames = [itemNames];
    }
    if (!Array.isArray(itemPrices)) {
      itemPrices = [itemPrices];
    }

    for (let i = 0; i < itemNames.length; i++) {
      const itemName = itemNames[i];
      const itemPrice = itemPrices[i];

      const item = await Item.findOne({ name: itemName });
      //updated code to check the item name when i add one item to the receipt
      console.log("itemName :>> ", itemName);
      console.log("itemNames :>> ", itemNames);
      console.log("item :>> ", item);
      if (item) {
        items.push({
          name: itemName,
          price: parseFloat(itemPrice),
        });
        console.log("item :>> ", item);
        console.log("items :>> ", items);
      } else {
        console.log("Item " + itemName + " not found");
      }
    }

    const newReceipt = {
      clientName,
      clientPhone,
      items,
      totalPrice,
      payType,
    };

    const receipt = new Receipt(newReceipt);
    await receipt.save().then((result) => {
      res.redirect(`/reciept/${result._id}`);
    });
  } catch (error) {
    console.log("error:", error);
    res.status(500).json({ error: "Error creating receipt" });
  }
});

app.get('/delete-reciept/:receiptID', verifyToken, isAdmin , (req, res) => {
  Receipt.findById(req.params.receiptID).then((result)=>{
    res.render('confirm-delete-receipt',{objReceipt: result})
  })
})

app.delete('/receipt/:receiptID', verifyToken , isAdmin , function(req, res) {
  Receipt.findByIdAndDelete(req.params.receiptID).then((result)=>{
    res.json({ myLink: "/main-page" });
  })
});

app.get("/receipt-search",verifyToken,(req, res) => {
  res.render("receipt-search");
});

app.get("/receipt-search-number",verifyToken, (req, res) => {
  const receiptNumber = req.query.receiptNumber;
  console.log("number", receiptNumber);

  Receipt.findOne({
    receiptNumber: receiptNumber,
  })
    .then((result) => {
      console.log("result :>> ", result);
      res.render("receipt-search-number", { numberFoundedReceipts: result });
    })
    .catch((error) => {
      console.log(`error:${error}`);
    });
});

app.get("/daily-report",verifyToken, (req, res) => {
  // Get the date from the query parameter
  const receiptDate = req.query.date;

  // Initialize results as an empty array
  let results = [];

  // Check if a valid date is provided and perform the database search if available
  if (receiptDate) {
    // At this point, the date format is valid, so you can proceed to parse it
    const parsedDate = new Date(receiptDate);

    const selectedDay = parsedDate.getDate();
    const selectedMonth = parsedDate.getMonth();
    const selectedYear = parsedDate.getFullYear();

    const startOfDay = new Date(selectedYear, selectedMonth, selectedDay);
    const endOfDay = new Date(selectedYear, selectedMonth, selectedDay + 1);

    // Use Receipt.find to search the database for data matching the date range
    Receipt.find({
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    })
      .then((searchResults) => {
        results = searchResults;
        renderPage();
      })
      .catch((dateError) => {
        console.log("dateError :>> ", dateError);
        renderPage();
      });
  } else {
    // If no date is provided, render the page without search results
    renderPage();
  }

  // Function to render the page with the results
  function renderPage() {
    res.render("daily-report", { recieptsMatchWithDate: results , user:req.user });
  }
});

app.get("/monthly-report",verifyToken, (req, res) => {
  // Get the date from the query parameter
  const receiptDate = req.query.date;

  // Initialize results as an empty array
  let results = [];

  // Check if a valid date is provided and perform the database search if available
  if (receiptDate) {
    // At this point, the date format is valid, so you can proceed to parse it
    const parsedDate = new Date(receiptDate);

    // const selectedDay = parsedDate.getDate();
    const selectedMonth = parsedDate.getMonth();
    const selectedYear = parsedDate.getFullYear();

    const startOfDay = new Date(selectedYear, selectedMonth);
    const endOfDay = new Date(selectedYear, selectedMonth + 1);

    // Use Receipt.find to search the database for data matching the date range
    Receipt.find({
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    })
      .then((searchResults) => {
        results = searchResults;
        renderPage();
      })
      .catch((dateError) => {
        console.log("dateError :>> ", dateError);
        renderPage();
      });
  } else {
    // If no date is provided, render the page without search results
    renderPage();
  }

  // Function to render the page with the results
  function renderPage() {
    res.render("monthly-report", { recieptsMatchWithDate: results, user:req.user });
  }
});

app.get("/reciept/:receiptID",verifyToken, (req, res) => {
  Receipt.findById(req.params.receiptID).then((receipt) => {
    res.render("receipt-report", { foundedReceipt: receipt });
  });
});
