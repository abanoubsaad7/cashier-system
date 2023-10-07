const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema ({
    fname:String,
    lname:String,
    username: String,
    password:String,
    //to get the right path to current user
    role:String
});
const User = mongoose.model("User",userSchema);

module.exports = User;