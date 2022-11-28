const WishListRoute = require("express").Router();
const verify = require("../middleware/verify");
const authAdmin = require('../middleware/authAdmin')
const Wish = require("../models/WishListModel");
const User = require('../models/UserModel')
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
  },
});

const upload = multer({ storage });

WishListRoute.post(
  "/wish/create_wishlist",
  verify,
  upload.single("productImage"),
  asyncHandler(async (req, res) => {
    const { productName, productDescription } = req.body;

    if (!productName || !productDescription)
      res.json({ msg: "fields cannot be empty" });

    const wish = await Wish({
      productName,
      productDescription,
      productImage: {
        data: fs.readFileSync("./public/" + req.file.filename),
        contentType: "image/jpg",
      },
      createdBy: req.user.id,
    });

    await wish.save(function (error) {
      if (!error) {
        Wish.find({})
          .populate("createdBy")
          .exec(function (error, wishes) {
            JSON.stringify(wishes, null, "\t");
          });
      }
    });

    res.json({ msg: "wish has been created!!" });
  })
);

WishListRoute.put(
  "/wish/update_wish/:id",
  verify,
  asyncHandler(async (req, res) => {
  
const {id} = req.params

const wish = await Wish.findById(id)
const wishMaker = await User.findById(req.user)


if ( wish.createdBy.toString() !== wishMaker._id.toString()) {
    return res.json({ msg: 'Access is denied.' });
  }

  await Wish.findByIdAndUpdate(
    wish,
    req.body,
  {new: true}
  )

  res.json({msg: "wish has been updated"})

  })
);


WishListRoute.delete('/wish/delete_wish/:id', verify, asyncHandler(async(req, res) => {
    const{id} = req.params

    const wish = await Wish.findById(id)
   const wishMaker = await User.findById(req.user)

   if ( wish.createdBy.toString() !== wishMaker._id.toString()) {
    return res.json({ msg: 'Access is denied.' });
  }

  await Wish.findByIdAndDelete(wish)

  res.json({msg: "wish has been deleted"})

}))


WishListRoute.get('/wish/user_wishlist', verify, asyncHandler(async(req, res) => {

    await Wish.find({createdBy: req.user.id}).then(
        (wishes) => res.json({wishes})
    )

}))

WishListRoute.get('/wish/all_customer_wishes', verify, authAdmin, asyncHandler(async(req, res) => {
    const wishes = await Wish.find()

    res.json({wishes})
}))


module.exports = WishListRoute;
