import { useMemo, useState, useEffect } from "react";
import "./dashboard.css";
import Navbar from "../Navbar";
import { apiUrl } from "../../api";

const Dashboard = () => {
    const [repositories, setRepositories] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestedRepositories, setSuggestedRepositories] = useState([]);

    useEffect(() => {
        const userId = localStorage.getItem("userId");

        if (!userId) return undefined;
        const controller = new AbortController();
        const fetchRepositories = async () => {
            try {
                const response = await fetch(apiUrl(`/repo/user/${userId}`), { signal: controller.signal });
                if (response.status === 404) return setRepositories([]);
                if (!response.ok) throw new Error("Unable to load repositories");
                const data = await response.json();
                setRepositories(data.repositories ?? []);
            } catch (err) {
                if (err.name !== "AbortError") setRepositories([]);
            }
        };

        const fetchSuggestedRepositories = async () => {
            try {
                const response = await fetch(apiUrl("/repo/all"), { signal: controller.signal });
                if (!response.ok) throw new Error("Unable to load repositories");
                const data = await response.json();
                setSuggestedRepositories(Array.isArray(data) ? data : []);
            } catch (err) {
                if (err.name !== "AbortError") setSuggestedRepositories([]);
            }
        };

        fetchRepositories();
        fetchSuggestedRepositories();
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
                    {suggestedRepositories.map((repo) => {
                        return (
                            <div key={repo._id}>
                                <h4>{repo.name}</h4>
                                <h4>{repo.description}</h4>
                            </div>
                        );
                    })}
                </aside>
                <main>
                    <h2>Your Repositories</h2>
                    <div id="search">
                        <input
                            type="text"
                            value={searchQuery}
                            placeholder="Search..."
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {searchResults.map((repo) => {
                        return (
                            <div key={repo._id}>
                                <h4>{repo.name}</h4>
                                <h4>{repo.description}</h4>
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
