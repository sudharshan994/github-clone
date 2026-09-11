import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import { apiUrl, authHeaders } from "../../api";
import "../dashboard/dashboard.css";

const CreateRepository = () => {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState(true);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            await axios.post(apiUrl("/repo/create"), {
                name: name.trim(),
                description: description.trim(),
                visibility,
                owner: localStorage.getItem("userId"),
            }, { headers: authHeaders() });
            navigate("/");
        } catch (requestError) {
            setError(requestError.response?.data?.error || requestError.response?.data?.message || "Unable to create repository.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <main className="repository-form-page">
                <h1>Create a new repository</h1>
                <p className="repository-form-help">A repository contains your project files and issues.</p>
                <form className="repository-form" onSubmit={handleSubmit}>
                    <label htmlFor="repository-name">Repository name</label>
                    <input id="repository-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} autoFocus />
                    <label htmlFor="repository-description">Description <span>(optional)</span></label>
                    <textarea id="repository-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={4} />
                    <label className="visibility-option">
                        <input type="checkbox" checked={visibility} onChange={(event) => setVisibility(event.target.checked)} />
                        Public repository
                    </label>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <div className="repository-form-actions">
                        <Link to="/">Cancel</Link>
                        <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create repository"}</button>
                    </div>
                </form>
            </main>
        </>
    );
};

export default CreateRepository;
