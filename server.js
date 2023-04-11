var express = require('express');
var app = express();
var passport = require("passport");
var config = require("./config/database");
require("./config/Passport")(passport);
var http = require('http');
const request = require('request');
//body-parser
var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static("Image"));
app.listen(8000);
//Mongo
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/Database')
  .then(() => console.log('Connected!'));
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'Image/upload')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname)
  }
});
var upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    console.log(file);
    if (file.mimetype == "image/bmp" || file.mimetype == "image/png" ||
      file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" ||
      file.mimetype == "image/gif") {
      cb(null, true)
    } else {
      return cb(new Error('Only image are allowed!'))
    }
  }
}).single("txtanh");
// Models //
var Banh = require("./Schemamodel/model");
app.get("/add", function (req, res) {
  res.render("add");
})
// add dữ liệu
app.post("/add", function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      res.json({ "kq": 0, "erMsg": "A Multer error occurred when uploading." });
    } else if (err) {
      res.json({ "kq": 0, "erMsg": "An unknown error occurred when uploading." + err });
    } else {
      var banh = Banh({
        Masp: req.body.txtmsp,
        Dongia: req.body.txtdg,
        Anh: req.file.filename,
        Loaisp: req.body.txtlsp,
        Makh: req.body.txtmkh,
        Mausac: req.body.txtms,
        Tenkh: req.body.txttkh,
        Tensp: req.body.txttsp
      });
      banh.save(function (err) {
        if (err) {
          res.json({ "kq": 0, "errMsg": err });
        } else {
          res.redirect("./list");
        }
      })
    }
  });
})
// Danh sách
app.get("/list", function (req, res) {
  Banh.find(function (err, data) {
    if (err) {
      res.json({ "kq": 0, "errMsg": err });
    } else {
      res.render("list", { danhsach: data });
    }
  })
});
// Sửa

app.get("/edit/:id", function (req, res) {
  Banh.findById(req.params.id, function (err, char) {
    if (err) {
      res.json({ "kq": 0, "errMsg": err });
    } else {
      console.log(char);
      res.render("edit", { nhanvat: char });
    }
  })
});
app.post("/edit", function (req, res) {
  upload(req, res, function (err) {
    if (!req.file) {
      Banh.updateOne({ _id: req.body.IDChar }, {
        Masp: req.body.txtmsp,
        Dongia: req.body.txtdg,
        Loaisp: req.body.txtlsp,
        Makh: req.body.txtmkh,
        Mausac: req.body.txtms,
        Tenkh: req.body.txttkh,
        Tensp: req.body.txttsp
      }, function (err) {
        if (err) {
          res.json({ "kq": 0, "errMsg": err });
        } else {
          res.redirect("./list");
        }
      });
    } else {
      if (err instanceof multer.MulterError) {
        res.json({ "kq": 0, "erMsg": "A Multer error occurred when uploading." });
      } else if (err) {
        res.json({ "kq": 0, "erMsg": "An unknown error occurred when uploading." + err });
      } else {
        Banh.updateOne({ _id: req.body.IDChar }, {
          Masp: req.body.txtmsp,
          Dongia: req.body.txtdg,
          Anh: req.file.filename,
          Loaisp: req.body.txtlsp,
          Makh: req.body.txtmkh,
          Mausac: req.body.txtms,
          Tenkh: req.body.txttkh,
          Tensp: req.body.txttsp
        }, function (err) {
          if (err) {
            res.json({ "kq": 0, "errMsg": err });
          } else {
            res.redirect("./list");
          }
        });
      }
    }
  }
  );
})
app.get("/delete/:id", function (req, res) {
  Banh.deleteOne({ _id: req.params.id }, function (err) {
    if (err) {
      res.json({ "kq": 0, "errMsg": err });
    } else {
      res.redirect("../list");
    }
  })
})
// hết phần sản phẩm 
// Admin
var admin = require('./Schemamodel/admin');
app.get("/Signup", function (req, res) {
  res.render("Signup");
});
app.get("/Login", function (req, res) {
  res.render("Login");
});
app.post("/Signup", async function (req, res) {
  if (!req.body.username || !req.body.password) {
    res.json({ success: false, msg: 'Please pass username and password.' });
  } else {
    var newUser = new admin({
      username: req.body.username,
      password: req.body.password
    });
    // save the user
    await newUser.save();
    res.redirect('/Login');
    //res.json({ success: true, msg: 'Successful created new user.' });
  }
});
const LoginObj = {
  pageTitle: "Login",
  task: "Login",
  actionTask: "/Login",
  optionsRegister: true,
};
const homeObj = {
  pageTitle: "list",
  task: "list",
  actionTask: "/list",
};
app.post('/Login', async function (req, res) {
  console.log(req.body);
  let user = await admin.findOne({ username: req.body.username });
  console.log(user);
  if (!user) {
    //res.status(401).send({ success: false, msg: 'Authentication failed. User not found.' });
    LoginObj.notify = "Authentication failed. User not found.";
    return res.render("Login", LoginObj);
  } else {
    // check if password matches
    user.comparePassword(req.body.password, function (err, isMatch) {
      if (isMatch && !err) {
        // if user is found and password is right create a token
        var token = jwt.sign(user.toJSON(), config.secret);
        homeObj.token = "JWT " + token;
        homeObj.user = user.toObject(); 
        console.log("homeObj", homeObj);
        // return the information including token as JSON
        //res.json({ success: true, token: 'JWT ' + token });
        request.get('http://localhost:8000/list', {
          headers: {'Authorization': 'JWT ' + token }
        }, function (error, response, body) {
          res.send(body);
        });
      } else {
        //res.status(401).send({ success: false, msg: 'Authentication failed. Wrong password.' });
        LoginObj.notify = "Authentication failed. Wrong password.";
        return res.render("Login", LoginObj);
      }
    });
  }
});