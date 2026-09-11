const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");

async function createIssue(req, res) {
    const { title, description, repository } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(repository)) return res.status(400).json({ error: "Invalid repository ID." });
        if (typeof title !== "string" || !title.trim() || typeof description !== "string" || !description.trim()) {
            return res.status(400).json({ error: "Title and description are required." });
        }
        const repo = await Repository.findById(repository).select("owner");
        if (!repo) return res.status(404).json({ error: "Repository not found." });
        if (String(repo.owner) !== String(req.user.id)) return res.status(403).json({ error: "Only the repository owner may create issues." });
        const issue = new Issue({
            title: title.trim(),
            description: description.trim(),
            repository,
        });

        await issue.save();
        await Repository.findByIdAndUpdate(repository, { $addToSet: { issues: issue._id } });

        res.status(201).json(issue);
    } catch (err) {
        console.error("Error during issue creation : ", err.message);
        res.status(500).json({ error: "Server error." });
    }
}

async function updateIssueById(req, res) {
    const { id } = req.params;
    const { title, description, status } = req.body;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid issue ID." });
        const issue = await Issue.findById(id);

        if (!issue) {
            return res.status(404).json({ error: "Issue not found!" });
        }

        if (title !== undefined) {
            if (typeof title !== "string" || !title.trim()) return res.status(400).json({ error: "Title must be a non-empty string." });
            issue.title = title.trim();
        }
        if (description !== undefined) {
            if (typeof description !== "string" || !description.trim()) return res.status(400).json({ error: "Description must be a non-empty string." });
            issue.description = description.trim();
        }
        if (status !== undefined) {
            if (!["open", "closed"].includes(status)) return res.status(400).json({ error: "Status must be open or closed." });
            issue.status = status;
        }
        if (title === undefined && description === undefined && status === undefined) {
            return res.status(400).json({ error: "No updates provided." });
        }

        await issue.save();

        res.json({ message: "Issue updated", issue });
    } catch (err) {
        console.error("Error during issue updation : ", err.message);
        res.status(500).json({ error: "Server error." });
    }
}

async function deleteIssueById(req, res) {
    const { id } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid issue ID." });
        const issue = await Issue.findByIdAndDelete(id);

        if (!issue) {
            return res.status(404).json({ error: "Issue not found!" });
        }
        await Repository.findByIdAndUpdate(issue.repository, { $pull: { issues: issue._id } });
        res.json({ message: "Issue deleted" });
    } catch (err) {
        console.error("Error during issue deletion : ", err.message);
        res.status(500).json({ error: "Server error." });
    }
}

async function getAllIssues(req, res) {
    try {
        const { repository } = req.query;
        if (repository && !mongoose.Types.ObjectId.isValid(repository)) return res.status(400).json({ error: "Invalid repository ID." });
        const issues = await Issue.find(repository ? { repository } : {});
        res.status(200).json(issues);
    } catch (err) {
        console.error("Error during issue fetching : ", err.message);
        res.status(500).json({ error: "Server error." });
    }
}

async function getIssueById(req, res) {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid issue ID." });
        const issue = await Issue.findById(id);

        if (!issue) {
            return res.status(404).json({ error: "Issue not found!" });
        }

        res.json(issue);
    } catch (err) {
        console.error("Error during issue updation : ", err.message);
        res.status(500).json({ error: "Server error." });
    }
}

module.exports = {
    createIssue,
    updateIssueById,
    deleteIssueById,
    getAllIssues,
    getIssueById,
};
