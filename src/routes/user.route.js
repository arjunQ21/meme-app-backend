const express = require('express');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const userValidation = require('../validations/user.validation');
const userController = require('../controllers/user.controller');
const { uploadsStorageDir } = require('../config/config');
const catchAsync = require('../utils/catchAsync');
const path = require('path');
const multer = require('multer');
const ApiError = require('../utils/ApiError');


const router = express.Router();


const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsStorageDir + path.sep + 'users' + path.sep);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + "." + file.mimetype.split("/")[1])
    }
  }),
},)



router
  .route('/')
  .post(auth('manageUsers'), validate(userValidation.createUser), userController.createUser)
  .get(auth('getUsers'), validate(userValidation.getUsers), userController.getUsers);

router.route('/me').get(auth(), userController.getMe)
  .put(auth(), upload.single("image"), catchAsync(async function (req, res) {

    if (!req.file) throw new ApiError(400, "File not uploaded");

    if (req.file.mimetype.split("/")[0] != 'image') throw new ApiError(400, "Only images allowed.");

    // let fPath = req.file.path.split(path.sep)
    // while (fPath.length >= (uploadsStorageDir.split(path.sep).length -2 )) {
    //   fPath.shift()
    // }

    // console.log(req.file, {fPath})

    req.user.phone = req.body.phone ;
    req.user.name = req.body.name ;
    req.user.imageURL = ['users', req.file.filename].join(path.sep) ;
    await req.user.save() ;

    console.log(req.user)

    // const meme = await Meme.create({
    //   caption: req.body.caption,
    //   filePath: fPath.join("/"),
    //   uploadedBy: req.user._id,
    // })

    return res.status(201).send({ user: await req.user.formatted(req) });
  }));

router
  .route('/:userId')
  .get(auth('getUsers'), validate(userValidation.getUser), userController.getUser)
  .patch(auth('manageUsers'), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth('manageUsers'), validate(userValidation.deleteUser), userController.deleteUser);

module.exports = router;
