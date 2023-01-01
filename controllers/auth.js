const User = require("../models/user");
const { validationResult } = require("express-validator");
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');


exports.signup = (req, res) => {

  const errors = validationResult(req);

  const errorArray = []
  errors.errors.forEach((error)=>{
     errorArray.push({
         errors: error.msg,
         field: error.param
     })
  })

  if(!errors.isEmpty()){
    //  return res.status(422).json({
    //      errors: errors.array()[0].msg,
    //      field: errors.array()[0].param
    //     })
    return res.status(422).json(errorArray);

  }
  const user = new User(req.body);
  user.save((err, user) => {
    if (err) {
      return res.status(400).json({
        err: "NOT able to save user in DB",
      });
    }

    res.json({
      name: user.name,
      email: user.email,
      id: user._id,
    });
  });
};

exports.signin = (req, res) => {
  const {email,password} = req.body;

  const errors = validationResult(req);

  const errorArray = []
  errors.errors.forEach((error)=>{
     errorArray.push({
         errors: error.msg,
         field: error.param
     })
  })

  if(!errors.isEmpty()){
    return res.status(422).json(errorArray);
  }

  //check username and password exist or not

  //finds the first match data
  User.findOne({email},(err,user)=>{

    if (err){
      return res.status(400).json({
        error:"Error occurred"
      })
    }
    else if (!user){
      return res.status(400).json({
        error:"USER email does not exist"
      })
    }

    if(!user.authenticate(password)){
      return res.status(401).json({
        error:"Email or password is incorrect"
      })
    }

    //creation of token 
    //in this jwt.sign we will pass key-value pair using which the token will be generated
    var token = jwt.sign({ _id: user._id }, process.env.SECRET);

    //put token in cookie
    res.cookie("token", token, {expire:new Date()+9999})

    //send response to front end
    const {_id, name, email, role} = user;
    return res.json({ token,user: {_id, name, email, role} });

  })
};


exports.signout = (req, res) => {

  res.clearCookie("token");
  res.json({
    message: "User signout successfully",
  });
};


//protected routes
//expressJwt function has inbuilt next() method so after completion
// it moves to next function in controller
exports.isSignedIn = expressJwt({
  secret: process.env.SECRET,
  userProperty: "auth"
});

//custom middlewares
//profile - this will generate by front end
//auth by the function of express-jwt
exports.isAuthenticated = (req, res, next) => {
  let checker = req.profile && req.auth && req.profile._id == req.auth._id;
  if(!checker){
    res.status(403).json({
      error:"ACCESS DENIED"
    })
  }
  next();
}

exports.isAdmin = (req, res, next) => {

  if(req.profile.role === 0){
    return res.status(403).json({
      error: "You are not ADMIN, Access denied"
    })
  }
  next();
}