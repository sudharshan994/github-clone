import { Link } from "react-router-dom";
import "./navbar.css";

const Navbar = () => {
    return (
        <nav>
            <Link to="/">
                <div>
                    <img
                        src="https://www.github.com/images/modules/logos_page/GitHub-Mark.png"
                        alt="GitHub Logo"
                    />
                    <h3>GitHub</h3>
                </div>
            </Link>
            <div>
                <p title="Repository creation is not implemented in this client yet">Create a Repository</p>
                <Link to="/profile">
                    <p>Profile</p>
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
