require('dotenv').config()
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const port  = process.env.PORT || 5500
// const cors = require('cors')
const cookieParser = require('cookie-parser')
const AuthRoute =  require('./routes/AuthRoute')
const ProductRoute = require('./routes/ProductRoute')
// const catRoute = require('./routes/CategoryRoute')
const OrderRoute = require('./routes/OrderRoute')
const WishListRoute = require('./routes/WishListRoute')
const MessageRoute = require('./routes/MessageRoute')
const path = require('path')






mongoose.connect(process.env.MONGOURL)

const db = mongoose.connection

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function(){
    console.log("connected to database");
  });


  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested, Content-Type, Accept Authorization"
    )
    if (req.method === "OPTIONS") {
      res.header(
        "Access-Control-Allow-Methods",
        "POST, PUT, PATCH, GET, DELETE"
      )
      return res.status(200).json({})
    }
    next()
  })
  



  const io = require("socket.io")(3300)

  // app.use(cors())
  app.use("/public", express.static(path.join(__dirname, '/public')));
  // app.use("/products", express.static(path.join(__dirname, '/products')));
  app.use(express.json({limit: '50mb'}))
  app.use(express.urlencoded({extended: true, limit: '50mb'}))
  app.use(cookieParser())


  app.use(function (req, res, next) {
    req.io = io;
    next();
  });
  

  app.use(AuthRoute)
  app.use(ProductRoute)
  // app.use( catRoute )
  app.use(OrderRoute)
  app.use(WishListRoute)
  app.use(MessageRoute)


//   if(process.env.NODE_ENV === 'production'){
//     app.use(express.static('client/build'))
//     app.get('*', (req, res) => {
//         res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'))
//     })
// }

  


  app.listen(port, () => {
    console.log(`Your server is now running on port ${port}`);
})

