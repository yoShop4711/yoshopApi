const MessageRoute = require("express").Router();
const Message = require("../models/MessageModel");
const Conversation = require("../models/ConversationModel");
const asyncHandler = require("express-async-handler");
const verify = require("../middleware/verify");
const mongoose = require("mongoose");

MessageRoute.post(
  "/message/send",
  verify,
  asyncHandler(async (req, res) => {
    let from = mongoose.Types.ObjectId(req.user.id);
    let to = mongoose.Types.ObjectId(req.body.to);

    Conversation.findOneAndUpdate(
      {
        recipients: {
          $all: [{ $elemMatch: { $eq: from } }, { $elemMatch: { $eq: to } }],
        },
      },
      {
        recipients: [req.user.id, req.body.to],
        lastMessage: req.body.body,
        date: Date.now(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
      function (err, conversation) {
        if (err) {
          console.log(err);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ message: "Failure" }));
          res.sendStatus(500);
        } else {
          let message = new Message({
            conversation: conversation._id,
            to: req.body.to,
            from: req.user.id,
            body: req.body.body,
          });

          req.io.sockets.emit("messages", req.body.body);

          message.save((err) => {
            if (err) {
              console.log(err);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ message: "Failure" }));
              res.sendStatus(500);
            } else {
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  message: "Success",
                  conversationId: conversation._id,
                })
              );
            }
          });
        }
      }
    );
  })
);

MessageRoute.get(
  "/message/coversation/query",
  verify,
  asyncHandler(async (req, res) => {
    let user1 = mongoose.Types.ObjectId(req.user.id);
    let user2 = mongoose.Types.ObjectId(req.query.userId);

    Message.aggregate([
        {
            $lookup: {
                from: 'User',
                localField: 'to',
                foreignField: '_id',
                as: 'toObj',
            },
        },
        {
            $lookup: {
                from: 'User',
                localField: 'from',
                foreignField: '_id',
                as: 'fromObj',
            },
        },
    ])
        .match({
            $or: [
                { $and: [{ to: user1 }, { from: user2 }] },
                { $and: [{ to: user2 }, { from: user1 }] },
            ],
        })
        .project({
            'toObj.password': 0,
            'toObj.__v': 0,
            'toObj.date': 0,
            'fromObj.password': 0,
            'fromObj.__v': 0,
            'fromObj.date': 0,
        })
        .exec((err, messages) => {
            if (err) {
                console.log(err);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ message: 'Failure' }));
                res.sendStatus(500);
            } else {
                res.send(messages);
            }
        });
  })
);

module.exports = MessageRoute;
