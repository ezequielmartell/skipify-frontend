import React, { useState, useEffect } from "react";
import Cookies from "universal-cookie"
import './index.css'
var crypto = require('crypto');
var querystring = require('querystring');

const url = process.env.REACT_APP_URL

const generateRandomString = (length) => {
    return crypto
        .randomBytes(60)
        .toString('hex')
        .slice(0, length);
}

const cookies = new Cookies();

function spotifyAuth() {
    var state = generateRandomString(16);
    // res.cookie(stateKey, state);
    // your application requests authorization
    var client_id = process.env.REACT_APP_CLIENT_ID;
    var scope = process.env.REACT_APP_SCOPE;
    var redirect_uri = 'https://skipify.ezdoes.xyz/callback';
    var result = 'https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        });
    return result;
};


export default function Skippy() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [boycottState, setBoycottState] = useState(false);
    const [badArtistsArray, setBadArtistsArray] = useState(['dale']);
    const [newArtist, setNewArtists] = useState('');

    function handleUserName(e) {
        setUsername(e.target.value);
    }

    function handlePassword(e) {
        setPassword(e.target.value);
    }

    function handleEmail(e) {
        setEmail(e.target.value);
    }

    function handleNewArtist(e) {
        setNewArtists(e.target.value);
    }

    function handleBoycott(e, toggle) {
        fetch(`${url}/api/boycott/`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": cookies.get("csrftoken"),
            },
            credentials: "same-origin",
            body: JSON.stringify({ boycott: toggle }),
        })
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                if (data.boycott) {
                    setBoycottState(true);
                } else {
                    setBoycottState(false);
                }
            });
    }

    function getSession() {
        fetch(`${url}/api/session/`, {
            credentials: "same-origin",
        })
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                if (data.isAuthenticated) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            });
    }

    async function getBoycottState() {
        await fetch(`${url}/api/boycott/`, {
            credentials: "same-origin",
        })
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                if (data.boycott) {
                    setBoycottState(true);
                } else {
                    setBoycottState(false);
                }
            });
    }

    // function isResponseOk(response) {
    //     let responseJson = response.json()
    //     console.log("isResponseOk")
    //     console.log(response)
    //     console.log(responseJson)
    //     if (response.status >= 200 && response.status <= 299) {
    //         return responseJson;
    //     } else {
    //         console.log("response not ok")
    //         throw Error(responseJson);
    //     }
    // }

    function isResponseOk(response) {
        console.log(response)
        if (response.status >= 200 && response.status <= 299) {
            return response.json();
        } else {
            console.log("response not ok")
            return response.json().then((errorData) => {
                console.log(errorData)
                const error = new Error(errorData.message || "An error occurred");
                // error.response = response;
                // Promise.reject(error);
                // error.data = errorData;
                return Promise.reject(error);
                // return Promise.reject(errorData);
                // throw errorData;
            });
        }
    }

    function signup(e) {
        e.preventDefault();
        fetch(`${url}/api/signup/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": cookies.get("csrftoken"),
            },
            //credentials: "same-origin",
            body: JSON.stringify({ username: username, email: email, password: password }),
        })
            .then(isResponseOk)
            .then((data) => {
                console.log(data);
                setIsAuthenticated(true)
                setUsername('')
                setEmail('')
                setPassword('')
                setError('')
                return (
                    <button onClick={window.open("/", '_self')}>loading home...</button>
                )
            })
            .catch((err) => {
                setError(err.toString());
                console.log(err);
            })
    }


    function login(e) {
        e.preventDefault();
        fetch(`${url}/api/login/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": cookies.get("csrftoken"),
            },
            credentials: "same-origin",
            body: JSON.stringify({ username: username, password: password }),
        })
            // .then((res) => res.json())
            .then(isResponseOk)
            .then((data) => {
                console.log(data);
                setIsAuthenticated(true)
                setUsername('')
                setPassword('')
                setError('')
            })
            .catch((err) => {
                setError(err.toString());
                console.log(err);
            })
    }
    // fetch().then((data) => data.json()).catch((error) => console.log(error))

    function logout() {
        fetch(`${url}/api/logout`, {
            credentials: "same-origin",
        })
            .then(isResponseOk)
            .then((data) => {
                console.log(data);
                setIsAuthenticated(false)
            })
            .catch((err) => {
                console.log(err);
            });
    };

    async function fetchArtists() {
        await fetch(`${url}/api/artists/`, {
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": cookies.get("csrftoken"),
            },
            credentials: "same-origin"
        })
            .then((res) => res.json())
            .then((data) => {
                console.log(data)
                let array = data.artists
                if (array) {
                    array.sort()
                    setBadArtistsArray(array)
                }
            })
    }
    async function removeArtist(e, item) {
        e.preventDefault();
        await fetch(`${url}/api/artists/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": cookies.get("csrftoken"),
            },
            credentials: "same-origin",
            body: JSON.stringify({ remove: item }),
        })
            .then((res) => res.json(),
                fetchArtists())
    }

    function appendArtist(e) {
        e.preventDefault();
        if (!badArtistsArray.includes(newArtist)) {
            fetch(`${url}/api/artists/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": cookies.get("csrftoken"),
                },
                credentials: "same-origin",
                body: JSON.stringify({ append: newArtist }),
            })
                .then((res) => res.json())
            fetchArtists()
        }
    }

    function codeAuth(code) {
        fetch(`${url}/api/callback/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": cookies.get("csrftoken"),
            },
            credentials: "same-origin",
            body: JSON.stringify({ code: code }),
        }).then(isResponseOk)
            .then((data) => {
                console.log(data);
            });
    }

    useEffect(() => { getSession() }, [])
    useEffect(() => { getBoycottState() }, [boycottState])
    useEffect(() => { fetchArtists() }, badArtistsArray)
    if (!isAuthenticated) {
        if (window.location.pathname === "/signup/") {
            return (
                <div className="container">
                    <h1>Spotify Artist Boycotting Service </h1>
                    <h2>New User Registration</h2>
                    <div className="form-group">
                        <form onSubmit={signup}>
                            <div>
                                <label htmlFor="username">Username:&nbsp;</label>
                                <input type="text" className="form-control" id="username" name="username" value={username} onChange={handleUserName} />
                            </div>
                            <div>
                                <label htmlFor="email">Email:&nbsp;</label>
                                <input type="text" className="form-control" id="email" name="email" value={email} onChange={handleEmail} />
                            </div>
                            <div>
                                <label htmlFor="username">Password:&nbsp;&nbsp;</label>
                                <input type="password" className="form-control" id="password" name="password" value={password} onChange={handlePassword} />
                                {error &&
                                    <div>
                                        <small className="text-danger">
                                            {error}
                                        </small>
                                    </div>
                                }
                            </div>
                            <button type="submit" className="btn btn-primary">Sign Up!</button>
                        </form>
                    </div>
                </div>
            )
        }
        return (
            <div className="container">
                <h1>Spotify Artist Boycotting Service </h1>
                <h2>Login</h2>
                <div className="form-group">
                    <form onSubmit={login}>
                        <div>
                            <label htmlFor="username">Username:&nbsp;</label>
                            <input type="text" className="form-control" id="username" name="username" value={username} onChange={handleUserName} />
                        </div>
                        <div>
                            <label htmlFor="username">Password:&nbsp;&nbsp;</label>
                            <input type="password" className="form-control" id="password" name="password" value={password} onChange={handlePassword} />
                            {error &&
                                <div>
                                    <small className="text-danger">
                                        {error}
                                    </small>
                                </div>
                            }
                        </div>
                        <button type="submit" className="btn btn-primary">Login</button>
                        <button className="btn btn-danger" onClick={() => window.open("/signup/", '_self')}>Register</button>
                    </form>
                </div>
            </div>
        );
    }
    if (window.location.pathname === "/callback/") {
        const queryParameters = new URLSearchParams(window.location.search)
        const code = queryParameters.get("code")
        // this.codeAuth(code).then(null)
        // (async()=>{ await this.codeAuth(code)})()
        codeAuth(code)
        window.history.replaceState("", "", "/home/");
    }
    if (isAuthenticated && window.location.pathname === "/") {
        return (
            <div className="container">
                <h1>Spotify Artist Boycotting Service</h1>
                <button className="btn btn-danger" onClick={() => window.open(spotifyAuth(), '_self')}>Authorize Spotify</button>
                <button className="btn btn-danger" onClick={logout}>Log out</button>
                <button className="btn btn-danger" onClick={() => window.open("/home", '_self')}>Home</button>
            </div>
        )
    }
    if (isAuthenticated && window.location.pathname === "/home/") {
        const badArtistsList = badArtistsArray.map(artist => <li>{artist} <button className="btn btn-danger" onClick={(e) => removeArtist(e, artist)}>remove</button></li>);
        return (
            <div className="container">
                <h1>Spotify Artist Boycotting Service</h1>
                <label>
                    Service Enabled: {String(boycottState)}&nbsp;
                    <button className="btn btn-danger" onClick={(e) => handleBoycott(e, !boycottState)}>Toggle</button>
                </label>
                <button className="btn btn-danger" onClick={logout}>Log out</button>
                <div className="row">
                    <div className="column-left">
                        <form onSubmit={appendArtist}>
                            <div className="form-group-right">
                                <label htmlFor="username">Start Skipping another artist? </label>
                                <input type="text" className="form-control" id="username" onChange={handleNewArtist} />
                                <button type="submit" className="btn btn-primary">Submit</button>
                            </div>
                        </form>
                    </div>
                    <div className="column-right">
                        <p>Artists we're boycotting: </p>
                        <ul>{badArtistsList}</ul>
                    </div>
                </div>
            </div>
        )
    }
}


// npm run build && docker compose -f ../django-aws-backend/docker-compose.yml up -d --build skipify