const express = require("express");
const router = express.Router();

//models
const User = require("../models/userModel");
const Receipt = require("../models/receiptModel");
const Item = require("../models/itemModel");


router.get("/main-page", (req, res) => {
  res.render("main-page");
});



router.get('/register',(req, res) => {
  res.render('register')
})

router.post("/register", function (req, res) {
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

router.get("/manage-item", (req, res) => {
  Item.find().then((result) => {
    res.render("manage-item", { items: result });
  });
});

router.get("/add-item", (req, res) => {
  res.render("add-item");
});

router.get("/update/:itemID", (req, res) => {
  Item.findById(req.params.itemID).then((result) => {
    res.render("update-item-form", { objItem: result });
  });
});

router.get("/delete-item/:itemID", (req, res) => {
  Item.findById(req.params.itemID).then((result) => {
    res.render("confirm-delete", { objItem: result });
  });
});



router.delete('/item/:itemID',  function(req, res) {
  Item.findByIdAndDelete(req.params.itemID).then((result)=>{
    res.json({ myLink: "/manage-item" });
  })
});

router.post("/update-item/:itemID",(req, res) => {
  if(req.body.staffName == null || req.body.staffName == undefined || req.body.staffName == ''){
    
    req.body.staffName = 'Beauty center-staff' ;
  }
  Item.findByIdAndUpdate(req.params.itemID, req.body).then((result) => {
    res.redirect("/manage-item");
  }).catch((err)=>{
    console.log('err :>> ', err);
  })
});

// Create a new item
router.post("/add-items", async (req, res) => {
  try {
    const itemName = req.body.name;
    const price = req.body.price;
    const itemType = req.body.itemType;
    
    // Check if staffName is provided, otherwise use a default value
    const staffName = req.body.staffName || 'Beauty center-staff';
    const item = new Item({
      name: itemName,
      price:price,
      itemType:itemType,
      staffName:staffName
    });
    await item.save();
    console.log("item :>> ", item);
    res.redirect("/manage-item");
  } catch (error) {
    console.log("error :>> ", error);
    res.status(500).json({ error: "Error creating item" });
  }
});

router.get('/delete-reciept/:receiptID', (req, res) => {
  Receipt.findById(req.params.receiptID).then((result)=>{
    res.render('confirm-delete-receipt',{objReceipt: result})
  })
})

router.delete('/receipt/:receiptID', function(req, res) {
  Receipt.findByIdAndDelete(req.params.receiptID).then((result)=>{
    res.json({ myLink: "/main-page" });
  })
});

module.exports = router;
