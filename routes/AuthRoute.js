const AuthRoute = require("express").Router();
const User = require("../models/UserModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verify = require("../middleware/verify");
const authAdmin = require("../middleware/authAdmin");
const authSeller = require("../middleware/authSeller");
const multer = require("multer");
const path = require('path');
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, '..', 'public'));
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
  },
});


const upload = multer({ storage });



AuthRoute.post(
  "/auth/register",
  upload.single('userImage')
  ,
  asyncHandler(async (req, res) => {
  

  

  let { fullname, username, email, password,location, question } = req.body;

    if (!fullname || !username || !email || !question || !password  || !location ) {
      res.json({ msg: "input box cannot be empty!" });
    }

    const usernameExists = await  User.findOne({ username });

    if (usernameExists) {
      res.json({ msg: "The username you chose exists, please user another" });
    }

    const emailExists = await  User.findOne({ email });

    if (emailExists) {
      res.json({ msg: "The email exists, please user another" });
    }

    
  
  const salt =  await bcrypt.genSalt(10);
  const hashedPassword = await  bcrypt.hash(password, salt);

 await User.create  ({
      fullname,
    username,
    email,
    question,
    password: hashedPassword,
    userImage: { 
      data: fs.readFileSync("./public/" + req.file.filename),
      contentType: "image/jpg"
      },
    
    location,
  });

   const accesstoken = createAccessToken({id: User._id})
    const refreshtoken = createRefreshToken({id: User._id})


    res.cookie('refreshtoken', refreshtoken, {
      httpOnly: true,
      path: '/auth/refresh_token',
      maxAge: 7*24*60*60*1000 // 7d
    })



    res.json({msg: "account created"});
  })
);

AuthRoute.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    
    const { username, password } = req.body;

    const userExists = await User.findOne({ username }).select("+password");

    if (!userExists) {
      res.json({
        msg: "No user associated with this username exists in our system. Please register.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, userExists.password);

    if (passwordMatch) {

      const accesstoken = createAccessToken({id: userExists._id})
      const refreshtoken = createRefreshToken({id: userExists._id})

            


        res.cookie('refreshtoken', refreshtoken, {
        httpOnly: true,
        path: '/auth/refresh_token',
        maxAge: 7*24*60*60*1000 // 7d
      })
  




      const { _id, fullname, username, email, role } = userExists

      res.json({ accesstoken, userExists: { _id, email, fullname, username, role } });
    } else {
      res.json({ msg: "check your password again" });
    }
  

  
  })

);

AuthRoute.get('/auth/refresh_token', asyncHandler(async(req, res) => {
  try{
  const rf_token = req.cookies.refreshtoken;
// console.log(rf_token);

  if(!rf_token) return res.status(400).json({msg: "Please Login or Register"})

  jwt.verify(rf_token, process.env.REFRESH_TOKEN, (err, user) =>{
    if(err) return res.status(400).json({msg: "Please Login or Register"})

    const accesstoken = createAccessToken({id: user.id})
    

    res.json({accesstoken})
}) }
catch(err) {
  return res.status(500).json({msg: err.message})

}

}))

AuthRoute.post(
  "/auth/forgot_password",
  asyncHandler(async (req, res) => {
    const { question, email } = req.body;

    if (!question || !email) {
      res.json({ msg: "fields cannot be empty." });
    }

    const emailFound = await User.findOne({ email });
    const questionFound = await User.findOne({ question });

  


    if (emailFound && questionFound) {
      const accessToken =  createAccessToken( { id: emailFound._id })
      // jwt.sign(
      //   { id: emailFound._id },
      //   process.env.ACCESS_TOKEN,
      //   { expiresIn: "1d" }
      // );

      res.json({ accessToken });
    } else {
      res.json({ msg: "please contact the admin to help you in password reset." });
    }
  })
);

AuthRoute.put(
  "/auth/reset_password",
  verify,
  asyncHandler(async (req, res) => {
    const { password } = req.body;

    if (!password) {
      res.json({ msg: "field cannot be empty." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await User.findOneAndUpdate(
      { _id: req.user.id },
      {
        password: passwordHash,
      }
    );

    res.json({ msg: "succesfully updated" });
  })
);

AuthRoute.get(
  "/auth/logout",
  verify,
  asyncHandler(async (req, res) => {
    res.clearCookie('refreshtoken', {path: '/auth/refresh_token'})
            return res.json({msg: "Logged out"})

    
  })
);

AuthRoute.put('/auth/change_role/:id', verify, authAdmin, asyncHandler(async(req, res) => {

const {id} = req.params

await User.findByIdAndUpdate(
  id,
  req.body,
  {new: true}
  
)

res.json({msg: 'user status succesfully changed..'})

}))


AuthRoute.delete('/auth/delete_user/:id', verify, authAdmin, asyncHandler(async(req, res) => {
const {id} = req.params

await User.findByIdAndDelete(id)

res.json({msg: 'user succesfully deleted...'})


}))


AuthRoute.post('/auth/show_user/:id', verify, authAdmin, asyncHandler(async(req, res) => {

const {id} = req.params

const user = await User.findById(id).select('-password')

res.json({user})

}))


AuthRoute.get('/auth/show_users',  asyncHandler(async(req, res) => {
const users = await User.find().select('-password')

res.json({users})


}))

AuthRoute.get('/auth/show_sellers', verify, authAdmin, asyncHandler(async(req, res) => {

const sellers = await User.aggregate([{
$match: {role: 1}},
])


res.json({sellers})




}) )


AuthRoute.put('/auth/edit_seller/:id',verify, authAdmin, asyncHandler(async(req, res) => {

const {id} = req.params

const upity = await User.findByIdAndUpdate(
  id,
  req.body,
  {new: true}
)

res.json({upity})

}))


AuthRoute.get('/auth/user',verify, asyncHandler(async(req, res) => {
try{
  const user = await User.findById(req.user).select('-password')
  if(!user) return res.status(400).json({msg: "User does not exist."})

  res.json(user)
// console.log(user);

// res.json(req.user)

}
  catch(err) {
    return res.status(500).json({msg: err.message})


  }


}))


AuthRoute.patch("/api/add_cart", verify, asyncHandler(async(req, res) => {

  const user = await User.findById(req.user.id)
            if(!user) return res.json({msg: "User does not exist."})

            await User.findOneAndUpdate({_id: req.user.id}, {
                cart: req.body.cart
            })

            return res.json({msg: "Added to cart"})





}))


const createAccessToken = (user) =>{
  return jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn: '11m'})
}
const createRefreshToken = (user) =>{
  return jwt.sign(user, process.env.REFRESH_TOKEN, {expiresIn: '7d'})
}


module.exports = AuthRoute;
