const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const Issue = require("../models/issueModel");

function sameId(left, right) {
    return left && right && String(left) === String(right);
}

function authorizeUser(req, res, next) {
    if (!req.user || !sameId(req.user.id, req.params.id)) {
        return res.status(403).json({ error: "You are not authorized to access this user." });
    }
    next();
}

async function authorizeRepositoryOwner(req, res, next) {
    try {
        if (!req.user) return res.status(401).json({ error: "Authentication required." });
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid repository ID." });
        }
        const repository = await Repository.findById(id).select("owner");
        if (!repository) return res.status(404).json({ error: "Repository not found." });
        if (!sameId(repository.owner, req.user.id)) {
            return res.status(403).json({ error: "Only the repository owner may perform this action." });
        }
        req.repository = repository;
        next();
    } catch (err) {
        next(err);
    }
}

async function authorizeIssueOwner(req, res, next) {
    try {
        if (!req.user) return res.status(401).json({ error: "Authentication required." });
        const id = req.params.id || req.body.issue;
        if (id && !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid issue ID." });
        }
        const issue = req.params.id
            ? await Issue.findById(req.params.id).select("repository")
            : await Issue.findOne({ _id: req.body.issue }).select("repository");
        if (!issue) return res.status(404).json({ error: "Issue not found." });
        const repository = await Repository.findById(issue.repository).select("owner");
        if (!repository) return res.status(404).json({ error: "Repository not found." });
        if (!sameId(repository.owner, req.user.id)) {
            return res.status(403).json({ error: "Only the repository owner may perform this action." });
        }
        req.issue = issue;
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = {
    authorizeUser,
    authorizeRepositoryOwner,
    authorizeIssueOwner,
    authorizeOwner: authorizeRepositoryOwner,
};