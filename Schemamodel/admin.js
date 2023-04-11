// var mongoose = require('mongoose');
// var Adminschema = new mongoose.Schema({
//     email:String,
//     pass:String
// });
// module.exports = mongoose.model("admin", Adminschema);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var UserSchema = new Schema({
    username: {
        type: String,
        minlength:10,
        maxlength:20,
        unique: true,
        required: true
    },
    password: {
        type: String,
        minlength:6,
        required: true
    }
});

UserSchema.pre('save', function (next) {
    var user = this;
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }
            bcrypt.hash(user.password, salt, null, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});

UserSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('admin', UserSchema);
