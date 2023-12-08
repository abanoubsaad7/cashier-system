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
  const token = jwt.sign(payload, secretKey, options);
  return token
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


const adminRoutes = require('./routes/admin')
const receiptRouter = require('./routes/recipt')

app.use(verifyToken,isAdmin,adminRoutes)
app.use(verifyToken,receiptRouter)

app.get("/main-page-moderator", verifyToken, (req, res) => {
  res.render("main-page-moderator");
});


