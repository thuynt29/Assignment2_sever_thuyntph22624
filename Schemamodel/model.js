var mongoose = require('mongoose');
var schemaBanh = new mongoose.Schema({
    Masp:String,
    Dongia:Number,
    Anh:String,
    Loaisp:String,
    Makh:String,
    Mausac:String,
    Tenkh:String,
    Tensp:String
});
module.exports = mongoose.model("user", schemaBanh);