const express = require("express");
const repoController = require("../controllers/repoController");
const auth = require("../middleware/authMiddleware");
const { authorizeRepositoryOwner } = require("../middleware/authorizeMiddleware");

const repoRouter = express.Router();

repoRouter.post("/repo/create", auth, repoController.createRepository);
repoRouter.get("/repo/all", repoController.getAllRepositories);
repoRouter.get("/repo/:id", repoController.fetchRepositoryById);
repoRouter.get("/repo/name/:name", repoController.fetchRepositoryByName);
repoRouter.get("/repo/user/:userID", auth, repoController.fetchRepositoriesForCurrentUser);
repoRouter.put("/repo/update/:id", auth, authorizeRepositoryOwner, repoController.updateRepositoryById);
repoRouter.delete("/repo/delete/:id", auth, authorizeRepositoryOwner, repoController.deleteRepositoryById);
repoRouter.patch("/repo/toggle/:id", auth, authorizeRepositoryOwner, repoController.toggleVisibilityById);

module.exports = repoRouter;