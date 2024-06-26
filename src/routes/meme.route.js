const express = require('express');
const catchAsync = require('../utils/catchAsync');
const Meme = require('../models/meme.model');
const auth = require('../middlewares/auth');
const multer = require('multer');
const ApiError = require('../utils/ApiError');
const router = express.Router();
const path = require("path");
const { uploadsStorageDir } = require('../config/config');
const mongoose = require('mongoose');

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsStorageDir + path.sep + 'memes' + path.sep);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + "." + file.mimetype.split("/")[1])
    }
  }),
},)


router.get("/", auth(), catchAsync(async function (req, res) {
  // return res.send(Meme.find({})
  // .then((memes)=>{
  //   return Promise.all(memes.map((m ) => m.formatted(req)))
  // }))
  const memes = await Meme.find({})
  const formatted = await Promise.all(memes.reverse().map(m => m.formatted(req)))
  // console.log(formatted)
  return res.send(formatted)
}))

router.post("/", auth(), upload.single("image"), catchAsync(async function (req, res) {

  if (!req.file) throw new ApiError(400, "File not uploaded");

  if (req.file.mimetype.split("/")[0] != 'image') throw new ApiError(400, "Only images allowed.");



  const meme = await Meme.create({
    caption: req.body.caption,
    filePath: ['memes', req.file.filename].join(path.sep),
    uploadedBy: req.user._id,
  })

  console.log({ meme })

  return res.status(201).send({ meme: await meme.formatted(req) });

}))

// get liked memes of certain user id
router.get("/liked/:userId", auth(), catchAsync(async function (req, res) {

  if (!req.params.userId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new Error("Invaid user id");
  }

  const likedMemes = await Meme.find({ likes: mongoose.Types.ObjectId(req.params.userId) });

  return res.send(
    await Promise.all(likedMemes.reverse().map(e => e.formatted(req)))
  )

}))

// get memes posted by certain user id
router.get("/by/:userId", auth(), catchAsync(async function (req, res) {

  if (!req.params.userId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new Error("Invaid user id");
  }

  const likedMemes = await Meme.find({ uploadedBy: mongoose.Types.ObjectId(req.params.userId) });

  return res.send(
    await Promise.all(likedMemes.reverse().map(e => e.formatted(req)))
  )

}))


const singleMemeRouter = express.Router();

router.use("/:memeId", auth(), catchAsync(async function (req, res, next) {
  req.meme = await Meme.findById(req.params.memeId);
  if (!req.meme) throw new Error("Meme not found by id: " + req.params.memeId);
  return next();
}), singleMemeRouter)

// get single meme
singleMemeRouter.get("/", catchAsync(async function (req, res) {
  return res.status(200).send({ meme: await req.meme.formatted(req) })
},),)

// toggle like/unlike
singleMemeRouter.post("/toggle-like", catchAsync(async function (req, res) {
  const likesNow = req.meme.likes.map(e => e.toString()).some(e => e == req.user._id.toString());
  if (!likesNow) {
    req.meme.likes.push(req.user._id);
  } else {
    req.meme.likes.pull(req.user._id);
  }
  await req.meme.save();
  return res.send({ likes: req.meme.likes })
}))

// update caption
singleMemeRouter.patch("/", catchAsync(async function (req, res) {
  req.meme.caption = req.body.caption ? req.body.caption.toString() : "",
    await req.meme.save();
  return res.send({ meme: await req.meme.formatted(req) })
}))

// update caption
singleMemeRouter.delete("/", catchAsync(async function (req, res) {
  if (req.user._id.toString() == req.meme.uploadedBy.toString()) {
    await req.meme.delete();
    return res.send({ meme: null });
  } else {
    throw new Error("Only creator can delete their meme.");
  }
}))

// get likers
singleMemeRouter.get("/likers", catchAsync(async function(req, res){
  const likers = await Promise.all((await mongoose.model("User").find({_id:  req.meme.likes})).map(e => e.formatted(req))) ;
  return res.send(likers)
}))

module.exports = router;
