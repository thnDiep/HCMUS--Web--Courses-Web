export default function (app) {
<<<<<<< HEAD
  // app.use(async function (req, res, next) {
  //   if (typeof req.session.isAuthenticated === "undefined") {
  //     req.session.isAuthenticated = false;
  //   }

  //   res.locals.lcIsAuthenticated = req.session.isAuthenticated;
  //   res.locals.lcAuthUser = req.session.authUser;
  //   res.locals.lcAuthTeacher = req.session.authTeacher;
  //   res.locals.lcAuthAdmin = req.session.authAdmin;

  //   next();
  // });
  app.use(function (req, res, next) {
    res.render("404", { layout: false });
  });

  // app.use(async function (req, res, next) {
  //   res.locals.searchOptions = [
  //     { value: 0, name: "Search by Name" },
  //     { value: 1, name: "Search by Category" },
  //   ];
  //   next();
  // });

  // app.use(async function (req, res, next) {
  //   res.locals.lcCategories = await categoryService.findAllWithDetails();
  //   next();
  // });
=======
  app.use(function (req, res, next) {
    res.render("404", { layout: false });
  });
>>>>>>> ab7c901a8fe0a137b4c1b076f10f875fa53ee308
}
