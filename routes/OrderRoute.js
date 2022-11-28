const OrderRoute = require("express").Router();
const verify = require("../middleware/verify");
const authAdmin = require("../middleware/authAdmin");
const { Order, CartItem } = require("../models/order");
const Item = require("../models/MerchantOrderModel");
const { errorHandler } = require("./errorHandler");
const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");
// const sgMail = require("@sendgrid/mail");
const authSeller = require("../middleware/authSeller");

// sgMail.setApiKey(process.env.SG_MAIL);

OrderRoute.post(
  "/cart/create_order",
  verify,
  asyncHandler(async (req, res) => {
    const { products, amount } = req.body;
    const order = new Order({
      products,
      amount,
      user: req.user.id,
    });
    await order.save((error, data) => {
      if (error) {
        return res.status(400).json({
          error: errorHandler(error),
        });
      }
    });

    res.json({ msg: "order succesfully created.. please check your email" });
  })
);

OrderRoute.get(
  "/cart/show_carts",
  verify,
  asyncHandler(async (req, res) => {
    const result = await Order.find();

    res.json({ result });
  })
);

OrderRoute.get(
  "/cart/show_not_processed",
  verify,
  authAdmin,
  asyncHandler(async (req, res) => {
    const not_processed = await Order.find({ status: "Not processed" });

    res.json({ not_processed });
  })
);

OrderRoute.get(
  "/cart/show_processing",
  verify,
  authAdmin,
  asyncHandler(async (req, res) => {
    const processing = await Order.find({ status: "Processing" });

    res.json({ processing });
  })
);

OrderRoute.get(
  "/cart/show_delivered",
  verify,
  authAdmin,
  asyncHandler(async (req, res) => {
    const delivered = await Order.find({ status: "Delivered" });

    res.json({ delivered });
  })
);

OrderRoute.get(
  "/cart/show_cancelled",
  verify,
  authAdmin,
  asyncHandler(async (req, res) => {
    const cancelled = await Order.find({ status: "Cancelled" });

    res.json({ cancelled });
  })
);

OrderRoute.get(
  "/cart/show_user_carts",
  verify,
  asyncHandler(async (req, res) => {
    await Order.find({ user: req.user.id }).then((orders) =>
      res.json({ orders })
    );
  })
);

OrderRoute.get(
  "/cart/show_user_not_processed_carts",
  verify,
  asyncHandler(async (req, res) => {
    await Order.find({ user: req.user.id, status: "Not processed" }).then(
      (orders) => res.json({ orders })
    );
  })
);

OrderRoute.get(
  "/cart/show_user_processing_carts",
  verify,
  asyncHandler(async (req, res) => {
    await Order.find({ user: req.user.id, status: "Processing" }).then(
      (orders) => res.json({ orders })
    );
  })
);

OrderRoute.get(
  "/cart/show_user_delivered_carts",
  verify,
  asyncHandler(async (req, res) => {
    await Order.find({ user: req.user.id, status: "Delivered" }).then(
      (orders) => res.json({ orders })
    );
  })
);

OrderRoute.get(
  "/cart/show_user_cancelled_carts",
  verify,
  asyncHandler(async (req, res) => {
    await Order.find({ user: req.user.id, status: "Cancelled" }).then(
      (orders) => res.json({ orders })
    );
  })
);

OrderRoute.put(
  "/cart/update_status/:id",
  verify,
  asyncHandler(async (req, res) => {
    await Order.updateOne(
      {
        _id: req.params.id,
      },
      { $set: { status: req.body.status } },
      { upsert: true },
      (err, order) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        }
        res.json(order);
      }
    ).clone();
  })
);

OrderRoute.get(
  "/cart/show_status",
  verify,
  asyncHandler(async (req, res) => {
    res.json(Order.schema.path("status").enumValues);
  })
);

OrderRoute.post(
  "/cart/send_to_merchant/:id",
  verify,
  authAdmin,

  asyncHandler(async (req, res) => {
    const item = await Item({
      orderId: req.params.id,
    });

    await item.save(function (error) {
      if (!error) {
        Item.find({})
          .populate("orderId")
          .exec(function (error, items) {
            JSON.stringify(items, null, "\t");
          });
      }
    });

    res.json({ msg: "order has been sent to merchant" });
  })
);

OrderRoute.get(
  "/cart/show_order_to_merchant",
  verify,
  authSeller,
  asyncHandler(async (req, res) => {
    const item = await Item.find();

    res.json(item);
  })
);




module.exports = OrderRoute;
