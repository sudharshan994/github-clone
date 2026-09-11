const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");

async function createRepository(req, res) {
    const { owner, name, issues = [], content = [], description = "", visibility = true } = req.body;

    try {
        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ error: "Repository name is required!" });
        }

        if (!mongoose.Types.ObjectId.isValid(owner)) {
            return res.status(400).json({ error: "Invalid User ID!" });
        }
        if (!req.user || String(req.user.id) !== String(owner)) {
            return res.status(403).json({ error: "You may only create repositories for yourself." });
        }
        if (!Array.isArray(issues) || !Array.isArray(content)) {
            return res.status(400).json({ error: "Issues and content must be arrays!" });
        }
        if (typeof visibility !== "boolean") {
            return res.status(400).json({ error: "Visibility must be a boolean!" });
        }
        if (!(await User.exists({ _id: owner }))) {
            return res.status(404).json({ error: "Owner not found!" });
        }

        const newRepository = new Repository({
            name: name.trim(),
            description,
            visibility,
            owner,
            content,
            issues,
        });

        const result = await newRepository.save();
        await User.findByIdAndUpdate(owner, { $addToSet: { repositories: result._id } });

        res.status(201).json({
            message: "Repository created!",
            repositoryID: result._id,
        });
    } catch (err) {
        console.error("Error during repository creation : ", err.message);
        res.status(500).send("Server error");
    }
}

async function getAllRepositories(req, res) {
    try {
        const repositories = await Repository.find({})
            .populate("owner", "-password")
            .populate("issues");

        res.json(repositories);
    } catch (err) {
        console.error("Error during fetching repositories : ", err.message);
        res.status(500).send("Server error");
    }
}

async function fetchRepositoryById(req, res) {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid repository ID!" });
        }
        const repository = await Repository.findById(id)
            .populate("owner", "-password")
            .populate("issues");

        if (!repository) return res.status(404).json({ error: "Repository not found!" });
        res.json(repository);
    } catch (err) {
        console.error("Error during fetching repository : ", err.message);
        res.status(500).send("Server error");
    }
}

async function fetchRepositoryByName(req, res) {
    const { name } = req.params;
    try {
        const repository = await Repository.find({ name })
            .populate("owner", "-password")
            .populate("issues");

        res.json(repository);
    } catch (err) {
        console.error("Error during fetching repository : ", err.message);
        res.status(500).send("Server error");
    }
}

async function fetchRepositoriesForCurrentUser(req, res) {
    const { userID } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(userID)) {
            return res.status(400).json({ error: "Invalid user ID!" });
        }
        if (!req.user || String(req.user.id) !== String(userID)) {
            return res.status(403).json({ error: "You are not authorized to access these repositories." });
        }
        const repositories = await Repository.find({ owner: userID }).sort({ createdAt: -1 });

        res.json({ message: "Repositories found!", repositories });
    } catch (err) {
        console.error("Error during fetching user repositories : ", err.message);
        res.status(500).send("Server error");
    }
}

async function updateRepositoryById(req, res) {
    const { id } = req.params;
    const { content, description } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid repository ID!" });
        }
        const repository = await Repository.findById(id);
        if (!repository) {
            return res.status(404).json({ error: "Repository not found!" });
        }

        if (content !== undefined) {
            if (typeof content !== "string" || !content.trim()) {
                return res.status(400).json({ error: "Content must be a non-empty string!" });
            }
            repository.content.push(content.trim());
        }
        if (description !== undefined) {
            if (typeof description !== "string") {
                return res.status(400).json({ error: "Description must be a string!" });
            }
            repository.description = description.trim();
        }

        const updatedRepository = await repository.save();

        res.json({
            message: "Repository updated successfully!",
            repository: updatedRepository,
        });
    } catch (err) {
        console.error("Error during updating repository : ", err.message);
        res.status(500).send("Server error");
    }
}

async function toggleVisibilityById(req, res) {
    const { id } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid repository ID!" });
        }
        const repository = await Repository.findById(id);
        if (!repository) {
            return res.status(404).json({ error: "Repository not found!" });
        }

        repository.visibility = !repository.visibility;

        const updatedRepository = await repository.save();

        res.json({
            message: "Repository visibility toggled successfully!",
            repository: updatedRepository,
        });
    } catch (err) {
        console.error("Error during toggling visibility : ", err.message);
        res.status(500).send("Server error");
    }
}

async function deleteRepositoryById(req, res) {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid repository ID!" });
        }
        const repository = await Repository.findByIdAndDelete(id);
        if (!repository) {
            return res.status(404).json({ error: "Repository not found!" });
        }

        await User.findByIdAndUpdate(repository.owner, { $pull: { repositories: repository._id } });
        await Issue.deleteMany({ repository: repository._id });
        res.json({ message: "Repository deleted successfully!" });
    } catch (err) {
        console.error("Error during deleting repository : ", err.message);
        res.status(500).send("Server error");
    }
}

module.exports = {
    createRepository,
    getAllRepositories,
    fetchRepositoryById,
    fetchRepositoryByName,
    fetchRepositoriesForCurrentUser,
    updateRepositoryById,
    toggleVisibilityById,
    deleteRepositoryById,
};
