import { useMemo, useState, useEffect } from "react";
import "./dashboard.css";
import Navbar from "../Navbar";
import { apiUrl, authHeaders } from "../../api";
import { Link } from "react-router-dom";

const Dashboard = () => {
    const [repositories, setRepositories] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestedRepositories, setSuggestedRepositories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const userId = localStorage.getItem("userId");

        if (!userId) return undefined;
        const controller = new AbortController();
        const fetchRepositories = async () => {
            try {
                const response = await fetch(apiUrl(`/repo/user/${userId}`), { signal: controller.signal, headers: authHeaders() });
                if (response.status === 404) return setRepositories([]);
                if (!response.ok) throw new Error("Unable to load repositories");
                const data = await response.json();
                setRepositories(data.repositories ?? []);
            } catch (err) {
                if (err.name !== "AbortError") { setRepositories([]); setError(err.message); }
            }
        };

        const fetchSuggestedRepositories = async () => {
            try {
                const response = await fetch(apiUrl("/repo/all"), { signal: controller.signal, headers: authHeaders() });
                if (!response.ok) throw new Error("Unable to load repositories");
                const data = await response.json();
                setSuggestedRepositories(Array.isArray(data) ? data : []);
            } catch (err) {
                if (err.name !== "AbortError") setSuggestedRepositories([]);
            }
        };

        Promise.all([fetchRepositories(), fetchSuggestedRepositories()]).finally(() => setLoading(false));
        return () => controller.abort();
    }, []);

    const searchResults = useMemo(() => repositories.filter((repo) =>
        repo.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    ), [searchQuery, repositories]);

    return (
        <>
            <Navbar />
            <section id="dashboard">
                <aside>
                    <h3>Suggested Repositories</h3>
                    {loading && <p className="empty-state">Loading repositories...</p>}
                    {suggestedRepositories.map((repo) => {
                        return (
                            <div key={repo._id} className="repository-card">
                                <Link to={`/repo/${repo._id}`}><h4>{repo.name}</h4></Link>
                                <p>{repo.description || "No description provided."}</p>
                                <small>{repo.visibility ? "Public" : "Private"}</small>
                            </div>
                        );
                    })}
                </aside>
                <main>
                    <div className="dashboard-heading">
                        <h2>Your Repositories</h2>
                        <Link className="create-repository-link" to="/repo/new">New repository</Link>
                    </div>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <div id="search">
                        <input
                            type="text"
                            value={searchQuery}
                            placeholder="Search..."
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {searchResults.length === 0 && <p className="empty-state">No repositories found.</p>}
                    {searchResults.map((repo) => {
                        return (
                            <div key={repo._id} className="repository-card">
                                <Link to={`/repo/${repo._id}`}><h4>{repo.name}</h4></Link>
                                <p>{repo.description || "No description provided."}</p>
                                <small>{repo.visibility ? "Public" : "Private"}</small>
                            </div>
                        );
                    })}
                </main>
                <aside>
                    <h3>Upcoming Events</h3>
                    <ul>
                        <li>
                            <p>Tech Conference - Dec 15</p>
                        </li>
                        <li>
                            <p>Developer Meetup - Dec 25</p>
                        </li>
                        <li>
                            <p>React Summit - Jan 5</p>
                        </li>
                    </ul>
                </aside>
            </section>
        </>
    );
};

export default Dashboard;
