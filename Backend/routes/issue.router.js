const express = require("express");
const issueController = require("../controllers/issueController");
const auth = require("../middleware/authMiddleware");
const { authorizeIssueOwner } = require("../middleware/authorizeMiddleware");

const issueRouter = express.Router();

issueRouter.post("/issue/create", auth, issueController.createIssue);
issueRouter.put("/issue/update/:id", auth, authorizeIssueOwner, issueController.updateIssueById);
issueRouter.delete("/issue/delete/:id", auth, authorizeIssueOwner, issueController.deleteIssueById);
issueRouter.get("/issue/all", issueController.getAllIssues);
issueRouter.get("/issue/:id", issueController.getIssueById);

module.exports = issueRouter;
