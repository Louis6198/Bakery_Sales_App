function AuthSection({
    currentUser,
    authMode,
    setAuthMode,
    authName,
    setAuthName,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authMessage,
    setAuthMessage,
    login,
    register,
    logout,
    authLoading
}) {
    return (
        <section className="auth-section">

            {currentUser ? (
                <div className="logged-in">

                    <div>
                        <strong>
                            Welcome, {currentUser.name}
                        </strong>

                        <p>
                            Role: {currentUser.role}
                        </p>
                    </div>

                    <button onClick={logout}>
                        Logout
                    </button>

                </div>
            ) : (
                <div className="auth-box">

                    <h2>
                        {authMode === "login"
                            ? "Login"
                            : "Create Account"}
                    </h2>

                    {authMode === "register" && (
                        <input
                            type="text"
                            placeholder="Your name"
                            value={authName}
                            onChange={(event) =>
                                setAuthName(event.target.value)
                            }
                        />
                    )}

                    <input
                        type="email"
                        placeholder="Email"
                        value={authEmail}
                        onChange={(event) =>
                            setAuthEmail(event.target.value)
                        }
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={authPassword}
                        onChange={(event) =>
                            setAuthPassword(event.target.value)
                        }
                    />

                    <button
                        onClick={
                            authMode === "login"
                                ? login
                                : register
                        }
                        disabled={authLoading}
                    >
                        {authLoading
                            ? authMode === "login"
                                ? "Logging in..."
                                : "Creating account..."
                            : authMode === "login"
                                ? "Login"
                                : "Register"}
                    </button>

                    <button
                        className="switch-auth-button"
                        onClick={() => {
                            setAuthMode(
                                authMode === "login"
                                    ? "register"
                                    : "login"
                            )

                            setAuthMessage("")
                        }}
                    >
                        {authMode === "login"
                            ? "Create an account"
                            : "Already have an account? Login"}
                    </button>

                    {authMessage && (
                        <p className="auth-message">
                            {authMessage}
                        </p>
                    )}

                </div>
            )}

        </section>
    )
}

export default AuthSection