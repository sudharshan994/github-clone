import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import { apiUrl, authHeaders } from "../../api";
import "./repository.css";

const RepositoryDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [repository, setRepository] = useState(null);
    const [issues, setIssues] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const load = async () => {
        setLoading(true); setError("");
        try {
            const [repoResponse, issueResponse] = await Promise.all([
                axios.get(apiUrl(`/repo/${id}`), { headers: authHeaders() }),
                axios.get(apiUrl(`/issue/all?repository=${id}`), { headers: authHeaders() }),
            ]);
            setRepository(repoResponse.data);
            setIssues(Array.isArray(issueResponse.data) ? issueResponse.data : []);
        } catch (requestError) {
            setError(requestError.response?.data?.error || "Unable to load this repository.");
        } finally { setLoading(false); }
    };

    // Loading is intentionally initiated when the route id changes.
    useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

    const saveIssue = async (event) => {
        event.preventDefault(); setSaving(true); setError("");
        try {
            const payload = { title: title.trim(), description: description.trim(), repository: id };
            if (editing) await axios.put(apiUrl(`/issue/update/${editing._id}`), payload, { headers: authHeaders() });
            else await axios.post(apiUrl("/issue/create"), payload, { headers: authHeaders() });
            setTitle(""); setDescription(""); setEditing(null); await load();
        } catch (requestError) { setError(requestError.response?.data?.error || "Unable to save issue."); }
        finally { setSaving(false); }
    };

    const deleteIssue = async (issueId) => {
        if (!window.confirm("Delete this issue?")) return;
        try { await axios.delete(apiUrl(`/issue/delete/${issueId}`), { headers: authHeaders() }); await load(); }
        catch (requestError) { setError(requestError.response?.data?.error || "Unable to delete issue."); }
    };

    const toggleVisibility = async () => {
        try {
            const response = await axios.patch(apiUrl(`/repo/toggle/${id}`), {}, { headers: authHeaders() });
            setRepository(response.data.repository);
        } catch (requestError) { setError(requestError.response?.data?.error || "Unable to update visibility."); }
    };

    const deleteRepository = async () => {
        if (!window.confirm("Delete this repository and all of its issues?")) return;
        try { await axios.delete(apiUrl(`/repo/delete/${id}`), { headers: authHeaders() }); navigate("/"); }
        catch (requestError) { setError(requestError.response?.data?.error || "Unable to delete repository."); }
    };

    if (loading) return <><Navbar /><main className="repository-detail"><p>Loading repository...</p></main></>;
    if (error && !repository) return <><Navbar /><main className="repository-detail"><p className="form-error" role="alert">{error}</p><Link to="/">Back to dashboard</Link></main></>;

    const owner = typeof repository.owner === "object" ? repository.owner.username : repository.owner;
    return <><Navbar /><main className="repository-detail">
        <Link to="/">← Back to dashboard</Link>
        <header className="repository-header">
            <div><h1>{repository.name} <span className="visibility">{repository.visibility ? "Public" : "Private"}</span></h1>
                <p>{repository.description || "No description provided."}</p><small>Owned by {owner || "unknown"}</small></div>
            <div className="repository-actions"><button onClick={toggleVisibility}>Make {repository.visibility ? "private" : "public"}</button><button className="danger" onClick={deleteRepository}>Delete</button></div>
        </header>
        {error && <p className="form-error" role="alert">{error}</p>}
        <section className="issues-section"><h2>Issues <span>{issues.length}</span></h2>
            <form className="issue-form" onSubmit={saveIssue}>
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Issue title" required maxLength={150} />
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the issue" required rows={3} />
                <button disabled={saving}>{saving ? "Saving..." : editing ? "Update issue" : "Create issue"}</button>
                {editing && <button type="button" onClick={() => { setEditing(null); setTitle(""); setDescription(""); }}>Cancel</button>}
            </form>
            {issues.length === 0 ? <p className="empty-state">No issues yet.</p> : issues.map((issue) => <article className="issue-card" key={issue._id}>
                <div><h3>{issue.title}</h3><p>{issue.description}</p><span className={`issue-status ${issue.status}`}>{issue.status}</span></div>
                <div><button onClick={() => { setEditing(issue); setTitle(issue.title); setDescription(issue.description); }}>Edit</button><button className="danger" onClick={() => deleteIssue(issue._id)}>Delete</button>
                    <button onClick={async () => { await axios.put(apiUrl(`/issue/update/${issue._id}`), { title: issue.title, description: issue.description, status: issue.status === "open" ? "closed" : "open" }, { headers: authHeaders() }); await load(); }}>{issue.status === "open" ? "Close" : "Reopen"}</button></div>
            </article>)}
        </section>
    </main></>;
};

export default RepositoryDetail;
