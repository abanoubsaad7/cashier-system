// // const mongoose = require("mongoose");

// // const Schema = mongoose.Schema;
// // const receiptSchema = new Schema ({
// //   clientName:String,
// //   clientPhone:String,
// //   receiptNumber:{
// //     type : String ,
    
// //   },
// //   items:Array,
// //   totalPrice: Number,
// // });
// // const Receipt = mongoose.model("Receipt",receiptSchema);

// // module.exports = Receipt;


const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const counterSchema = new Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 }
});

const Counter = mongoose.model("Counter", counterSchema);

const receiptSchema = new Schema({
  clientName: String,
  clientPhone: String,
  payType:String,
  receiptNumber: {
    type: Number,
    unique: true
  },
  items: Array,
  totalPrice: Number,
  date:{
    type:Date,
    default: Date.now()
  }
});

receiptSchema.pre("save", async function (next) {
  const doc = this;
  if (doc.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: "receiptNumber" },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      doc.receiptNumber = counter.sequence_value;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const Receipt = mongoose.model("Receipt", receiptSchema);


module.exports = Receipt;