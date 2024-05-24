const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const docsRoute = require('./docs.route');
const config = require('../config/config');
const memeRoute = require("./meme.route") ;

const router = express.Router();

router.get("/", function(req, res){
  return res.send("<h2> Memes App Backend. </h2>. <p>This was developed for <a href='https://github.com/arjunQ21/flutter-soch-college'>this flutter class</a> in Soch College.</p>")
})

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: "/memes",
    route: memeRoute,
  }
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
