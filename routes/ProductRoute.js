const ProductRoute = require("express").Router();
const Product = require("../models/ProductModel");
const User = require("../models/UserModel");
const verify = require("../middleware/verify");
const authSeller = require("../middleware/authSeller");
const authAdmin = require("../middleware/authAdmin");
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const { query } = require("express");
const fs = require('fs')


class APIfeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filtering() {
    const queryObj = { ...this.queryString }; //queryString = req.query
    const excludedFields = ["page", "sort", "limit"];

    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(
      /\b(gte|gt|lt|lte|regex)\b/g,
      (match) => "$" + match
    );

    this.query.find(JSON.parse(queryStr));

    return this;
  }
  sorting() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }
  paginating() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 9;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
  },
});


const upload = multer({ storage });

ProductRoute.post(
  "/api/create_product",
  verify,
  upload.single('productImage'),
  authSeller,
  asyncHandler(async (req, res) => {
    const {
      productName,
      productDescription,
      productQuantity,
      productAvailability,
      productPrice,
      categor,
    } = req.body;

    if (
      !productName ||
      !productDescription ||
      !productQuantity ||
      !productAvailability ||
      !productPrice ||
      !categor
    ) {
      res.json({ msg: "fields cannot be empty when making a post." });
    }

    
      
    const product = await Product({
      productName,
      productDescription,
      productQuantity,
      productAvailability,
      productPrice,
      productImage: { 
      data: fs.readFileSync("./public/" + req.file.filename),
      contentType: "image/jpg"
      },
        categor,
      createdBy: req.user.id
      
      
    });

   
    
     await product.save(function (error) {
      if (!error) {
        Product.find({})
          .populate("createdBy")
          .exec(function (error, products) {
            JSON.stringify(products, null, "\t")
            
          });
      }
    });

    res.json({msg: 'product has been created'})

  
  })
);

ProductRoute.put('/api/update_product/:id',  verify, authSeller, asyncHandler(async(req, res) => {
  const {id} = req.params

  const product = await Product.findById(id)
  const seller = await User.findById(req.user)


  if ( product.createdBy.toString() !== seller._id.toString()) {
    return res.json({ msg: 'Access is denied.' });
  }

  await Product.findByIdAndUpdate(
    product,
    req.body,
  {new: true}
  )

  res.json({msg: "updated"})



}))

ProductRoute.delete('/api/delete_product/:id', verify,  authSeller, asyncHandler(async(req, res) => {

  const{id} = req.params

  const product = await Product.findById(id)
  const seller = await User.findById(req.user)


  if ( product.createdBy.toString() !== seller._id.toString()) {
    return res.json({ msg: 'Access is denied.' });
  }

  
  await Product.findByIdAndDelete(product)

  res.json({msg: 'deleted'})


}))

ProductRoute.get('/api/seller_products', verify, authSeller, asyncHandler(async(req, res) => {

await Product.find({createdBy: req.user.id}).then(products => res.json({products}))



}))



ProductRoute.get('/api/show_products', asyncHandler(async(req, res) => {

  const features = new APIfeatures(Product.find(), req.query)
        .filtering()
        .sorting()
        .paginating();

      const products = await features.query;

      res.json({
        status: "success",
        result: products.length,
        products: products,
      });

}))

module.exports = ProductRoute;
