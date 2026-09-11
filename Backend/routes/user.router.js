const express = require("express");
const userController = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");
const { authorizeUser } = require("../middleware/authorizeMiddleware");

const userRouter = express.Router();

userRouter.get("/allUsers", userController.getAllUsers);
userRouter.post("/signup", userController.signup);
userRouter.post("/login", userController.login);
userRouter.get("/userProfile/:id", userController.getUserProfile);
userRouter.put("/updateProfile/:id", auth, authorizeUser, userController.updateUserProfile);
userRouter.delete("/deleteProfile/:id", auth, authorizeUser, userController.deleteUserProfile);
userRouter.patch("/userProfile/:id/follow", auth, userController.toggleFollowUser);

module.exports = userRouter;