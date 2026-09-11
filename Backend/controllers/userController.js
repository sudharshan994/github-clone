const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
var ObjectId = require("mongodb").ObjectId;

dotenv.config();
const uri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
const publicUserFields = { projection: { password: 0 } };

let client;

async function connectClient() {
    if (!client) {
        client = new MongoClient(uri, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
        });
        await client.connect();
    }
}

async function signup(req, res) {
    const { username, password, email } = req.body;
    try {
        if (typeof username !== "string" || username.trim().length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters." });
        }
        if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: "A valid email is required." });
        }
        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters." });
        }
        await connectClient();
        const db = client.db("gitClone");
        const usersCollection = db.collection("users");

        const user = await usersCollection.findOne({ $or: [{ username }, { email }] });
        if (user) {
            return res.status(409).json({ message: "User already exists!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            username: username.trim(),
            password: hashedPassword,
            email,
            repositories: [],
            followedUsers: [],
            starRepos: [],
        };

        const result = await usersCollection.insertOne(newUser);

        const token = jwt.sign(
            { id: result.insertedId },
            jwtSecret,
            { expiresIn: "1h" }
        );
        res.json({ token, userId: result.insertedId.toString() });
    } catch (err) {
        console.error("Error during signup : ", err.message);
        res.status(500).send("Server error");
    }
}

async function login(req, res) {
    const { email, password } = req.body;
    try {
        if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }
        await connectClient();
        const db = client.db("gitClone");
        const usersCollection = db.collection("users");

        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials!" });
        }

        const token = jwt.sign({ id: user._id }, jwtSecret, {
            expiresIn: "1h",
        });
        res.json({ token, userId: user._id.toString() });
    } catch (err) {
        console.error("Error during login : ", err.message);
        res.status(500).send("Server error!");
    }
}

async function getAllUsers(req, res) {
    try {
        await connectClient();
        const db = client.db("gitClone");
        const usersCollection = db.collection("users");

        const users = await usersCollection.find({}, publicUserFields).toArray();
        res.json(users);
    } catch (err) {
        console.error("Error during fetching : ", err.message);
        res.status(500).send("Server error!");
    }
}

async function getUserProfile(req, res) {
    const currentID = req.params.id;

    try {
        await connectClient();
        const db = client.db("gitClone");
        const usersCollection = db.collection("users");

        if (!ObjectId.isValid(currentID)) return res.status(400).json({ message: "Invalid user id" });
        const user = await usersCollection.findOne({
            _id: new ObjectId(currentID),
        }, publicUserFields);

        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        res.send(user);
    } catch (err) {
        console.error("Error during fetching : ", err.message);
        res.status(500).send("Server error!");
    }
}

async function updateUserProfile(req, res) {
    const currentID = req.params.id;
    const { email, password } = req.body;

    try {
        await connectClient();
        const db = client.db("gitClone");
        const usersCollection = db.collection("users");

        if (!ObjectId.isValid(currentID)) return res.status(400).json({ message: "Invalid user id" });
        const updateFields = {};
        if (email !== undefined) {
            if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ message: "A valid email is required." });
            }
            updateFields.email = email.trim().toLowerCase();
        }
        if (password !== undefined) {
            if (typeof password !== "string" || password.length < 8) {
                return res.status(400).json({ message: "Password must be at least 8 characters." });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateFields.password = hashedPassword;
        }

        if (Object.keys(updateFields).length === 0) return res.status(400).json({ message: "No updates provided" });
        const result = await usersCollection.findOneAndUpdate(
            {
                _id: new ObjectId(currentID),
            },
            { $set: updateFields },
            { returnDocument: "after" }
        );
        if (!result) {
            return res.status(404).json({ message: "User not found!" });
        }

        if (result.password) delete result.password;
        res.json(result);
    } catch (err) {
        console.error("Error during updating : ", err.message);
        res.status(500).send("Server error!");
    }
}

async function deleteUserProfile(req, res) {
    const currentID = req.params.id;

    try {
        await connectClient();
        if (!ObjectId.isValid(currentID)) return res.status(400).json({ message: "Invalid user id" });
        const db = client.db("gitClone");
        const usersCollection = db.collection("users");

        const userId = new ObjectId(currentID);
        const result = await usersCollection.deleteOne({
            _id: userId,
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "User not found!" });
        }

        const repositories = db.collection("repositories");
        const ownedRepositories = await repositories.find({ owner: userId }).project({ _id: 1 }).toArray();
        const repositoryIds = ownedRepositories.map((repository) => repository._id);
        if (repositoryIds.length) {
            await db.collection("issues").deleteMany({ repository: { $in: repositoryIds } });
            await repositories.deleteMany({ _id: { $in: repositoryIds } });
        }

        res.json({ message: "User Profile Deleted!" });
    } catch (err) {
        console.error("Error during updating : ", err.message);
        res.status(500).send("Server error!");
    }
}

async function toggleFollowUser(req, res) {
    const currentID = req.user.id;
    const targetID = req.params.id;
    try {
        if (!ObjectId.isValid(targetID)) return res.status(400).json({ message: "Invalid user id" });
        if (currentID === targetID) return res.status(400).json({ message: "You cannot follow yourself." });
        await connectClient();
        const users = client.db("gitClone").collection("users");
        const target = await users.findOne({ _id: new ObjectId(targetID) }, { projection: { _id: 1 } });
        if (!target) return res.status(404).json({ message: "User not found!" });
        const current = await users.findOne({ _id: new ObjectId(currentID) }, { projection: { followedUsers: 1 } });
        const follows = (current?.followedUsers || []).some((id) => String(id) === targetID);
        const update = follows
            ? { $pull: { followedUsers: new ObjectId(targetID) } }
            : { $addToSet: { followedUsers: new ObjectId(targetID) } };
        await users.updateOne({ _id: new ObjectId(currentID) }, update);
        res.json({ following: !follows });
    } catch (err) {
        console.error("Error toggling follow:", err.message);
        res.status(500).json({ message: "Server error!" });
    }
}

module.exports = {
    getAllUsers,
    signup,
    login,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile,
    toggleFollowUser,
};
