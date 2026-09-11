import { useEffect, useState } from "react";
import axios from "axios";
import "./profile.css";
import Navbar from "../Navbar";
import { UnderlineNav } from "@primer/react";
import { BookIcon, RepoIcon } from "@primer/octicons-react";
import HeatMapProfile from "./HeatMap";
import { useAuth } from "../../authContext";
import { apiUrl } from "../../api";
import { authHeaders } from "../../api";
import { Link } from "react-router-dom";

const Profile = () => {
    const [userDetails, setUserDetails] = useState({ username: "username" });
    const { setCurrentUser } = useAuth();
    const [repositories, setRepositories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [following, setFollowing] = useState(false);

    useEffect(() => {
        const fetchUserDetails = async () => {
            const userId = localStorage.getItem("userId");

            if (userId) {
                try {
                    const response = await axios.get(apiUrl(`/userProfile/${userId}`), { headers: authHeaders() });
                    setUserDetails(response.data);
                    const repos = await axios.get(apiUrl(`/repo/user/${userId}`), { headers: authHeaders() });
                    setRepositories(repos.data.repositories || []);
                    setFollowing((response.data.followedUsers || []).includes(userId));
                } catch {
                    setError("Unable to load your profile.");
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchUserDetails();
    }, []);

    return (
        <>
            <Navbar />
            <UnderlineNav aria-label="Repository">
                <UnderlineNav.Item
                    aria-current="page"
                    icon={BookIcon}
                    sx={{
                        backgroundColor: "transparent",
                        color: "white",
                        "&:hover": {
                            textDecoration: "underline",
                            color: "white",
                        },
                    }}
                >
                    Overview
                </UnderlineNav.Item>

                <UnderlineNav.Item
                    icon={RepoIcon}
                    sx={{
                        backgroundColor: "transparent",
                        color: "whitesmoke",
                        "&:hover": {
                            textDecoration: "underline",
                            color: "white",
                        },
                    }}
                >
                    Starred Repositories
                </UnderlineNav.Item>
            </UnderlineNav>

            <button
                onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("userId");
                    setCurrentUser(null);

                    window.location.href = "/auth";
                }}
                style={{ position: "fixed", bottom: "50px", right: "50px" }}
                id="logout"
            >
                Logout
            </button>

            <div className="profile-page-wrapper">
                <div className="user-profile-section">
                    <div className="profile-image"></div>

                    <div className="name">
                        <h3>{userDetails.username}</h3>
                    </div>

                    {userDetails._id !== localStorage.getItem("userId") && <button className="follow-btn" aria-pressed={following} onClick={async () => {
                        try {
                            const response = await axios.patch(apiUrl(`/userProfile/${userDetails._id}/follow`), {}, { headers: authHeaders() });
                            setFollowing(response.data.following);
                        } catch {
                            setError("Unable to update follow status.");
                        }
                    }}>
                        {following ? "Following" : "Follow"}
                    </button>}

                    <div className="follower">
                        <p>10 Follower</p>
                        <p>3 Following</p>
                    </div>
                </div>

                <div className="heat-map-section">
                    <HeatMapProfile />
                    <section className="profile-repositories">
                        <h2>Repositories</h2>
                        {loading && <p className="empty-state">Loading repositories...</p>}
                        {error && <p className="form-error" role="alert">{error}</p>}
                        {!loading && repositories.length === 0 && !error && <p className="empty-state">No repositories yet.</p>}
                        <div className="repo-card-wrapper">
                            {repositories.map((repo) => (
                                <article className="repo" key={repo._id}>
                                    <Link className="repo-name" to={`/repo/${repo._id}`}>{repo.name}</Link>
                                    <p className="description">{repo.description || "No description provided."}</p>
                                    <small>{repo.visibility ? "Public" : "Private"}</small>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
};

export default Profile;
