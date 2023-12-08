const express = require("express");
const router = express.Router();

//models
const User = require("../models/userModel");
const Receipt = require("../models/receiptModel");
const Item = require("../models/itemModel");


router.get("/set-receipt",async (req, res) => {
  Item.find().then((item) => {
    res.render("add-receipt", { arritem: item });
  });
});

router.post("/add-receipt",  async (req, res) => {
  try {
    const clientName = req.body.clientName;
    const clientPhone = req.body.clientPhone;
    let itemNames = req.body.itemName;
    let itemPrices = req.body.itemPrice; // An array of selected item names
    let staffNames = req.body.staffName;
    const totalPrice = req.body.totalPrice;
    const items = []; // An array to store items as objects
    const payType = req.body.payType;
    const branch = req.body.branch;

    // Convert itemNames and itemPrices to arrays if they are not already
    if (!Array.isArray(itemNames)) {
      itemNames = [itemNames];
    }
    if (!Array.isArray(itemPrices)) {
      itemPrices = [itemPrices];
    }
    if (!Array.isArray(staffNames)) {
      staffNames = [staffNames];
    }

    for (let i = 0; i < itemNames.length; i++) {
      const itemName = itemNames[i];
      const itemPrice = itemPrices[i];
      const staffName = staffNames[i];
      const item = await Item.findOne({ name: itemName });
      //updated code to check the item name when i add one item to the receipt
      console.log("itemName :>> ", itemName);
      console.log("itemNames :>> ", itemNames);
      console.log("item :>> ", item);
      if (item) {
        items.push({
          name: itemName,
          staffName: staffName,
          price: parseFloat(itemPrice),
        });
        console.log("item :>> ", item);
        console.log("items :>> ", items);
      } else {
        console.log("Item " + itemName + " not found");
      }
    }

    const newReceipt = {
      workerName: `${req.user.fname + ' ' + req.user.lname}` ,
      clientName,
      clientPhone,
      items,
      totalPrice,
      payType,
      branch
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

router.get("/receipt-search-number",  (req, res) => {
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

router.get("/daily-report",  (req, res) => {
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

router.get("/monthly-report",  (req, res) => {
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

router.get("/reciept/:receiptID",  (req, res) => {
  Receipt.findById(req.params.receiptID).then((receipt) => {
    // Convert the date property to a Date object
    const date = new Date(receipt.date);

    // Format the date as dd/mm/yyyy
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString();

    const formattedDate = `${year}/${month}/${day}`;

    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

    const formattedDateTime = `${formattedDate}   ${formattedTime}`;
    res.render("receipt-report", { foundedReceipt: receipt , RecieptDate: formattedDateTime });
  });
});

module.exports = router;
