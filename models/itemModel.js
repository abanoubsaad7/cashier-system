const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const itemSchema = new Schema ({
  name: String,
  price: Number,
  itemType:{
    type:String,
    enum: ['main', 'assist']
  },
  staffName: {
    type: String,
    default: 'Beauty Center-Staff'
  }
});
const Item = mongoose.model("Item",itemSchema);


module.exports = Item;