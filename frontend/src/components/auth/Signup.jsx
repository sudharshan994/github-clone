import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../authContext";

import { Button, PageHeader } from "@primer/react";
import "./auth.css";

import logo from "../../assets/github-mark-white.svg";
import { Link } from "react-router-dom";
import { apiUrl } from "../../api";

const Signup = () => {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { setCurrentUser } = useAuth();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");

        try {
            setLoading(true);
            const res = await axios.post(apiUrl("/signup"), {
                email: email,
                password: password,
                username: username,
            });

            localStorage.setItem("token", res.data.token);
            localStorage.setItem("userId", res.data.userId);

            setCurrentUser(res.data.userId);
            window.location.href = "/";
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to create your account. Check the backend connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-logo-container">
                <img className="logo-login" src={logo} alt="Logo" />
            </div>

            <div className="login-box-wrapper">
                <div className="login-heading">
                    <div>
                        <PageHeader>
                            <PageHeader.TitleArea variant="large">
                                <PageHeader.Title>Sign Up</PageHeader.Title>
                            </PageHeader.TitleArea>
                        </PageHeader>
                    </div>
                </div>

                <form className="login-box" onSubmit={handleSignup}>
                    <div>
                        <label className="label">Username</label>
                        <input
                            autoComplete="off"
                            name="Username"
                            id="Username"
                            className="input"
                            type="text"
                            minLength={3}
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="label">Email address</label>
                        <input
                            autoComplete="off"
                            name="Email"
                            id="Email"
                            className="input"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="div">
                        <label className="label">Password</label>
                        <input
                            autoComplete="off"
                            name="Password"
                            id="Password"
                            className="input"
                            type="password"
                            minLength={8}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="primary"
                        className="login-btn"
                        disabled={loading}
                        type="submit"
                    >
                        {loading ? "Loading..." : "Signup"}
                    </Button>
                    {error && <p className="form-error" role="alert">{error}</p>}
                </form>

                <div className="pass-box">
                    <p>
                        Already have an account? <Link to="/auth">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
