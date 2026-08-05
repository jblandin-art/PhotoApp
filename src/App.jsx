import React from 'react';
import {
  HashRouter, Route, Switch,
  Redirect
} from 'react-router-dom';
import './styles/main.css';

import axios from 'axios';
import TopBar from './components/topBar/TopBar';
import UserDetail from './components/userDetail/userDetail';
import UserList from './components/userList/userList';
import UserPhotos from './components/userPhotos/userPhotos';
import LoginRegister from './components/LoginRegister/LoginRegister';

class PhotoShare extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedInUser: null,
      checkedLogin: false,
      photoRefreshCounter: 0,
      sidebarOpen: false, // collapsed by default on mobile
    };

    axios.defaults.withCredentials = true;
  }

  componentDidMount() {
    axios.get('/me', { withCredentials: true })
      .then((response) => {
        this.setState({ loggedInUser: response.data, checkedLogin: true });
      })
      .catch(() => {
        this.setState({ loggedInUser: null, checkedLogin: true });
      });
  }

  handleLogin = (user) => {
    this.setState({ loggedInUser: user });
  };

  handleLogout = () => {
    axios.post('/admin/logout')
      .then(() => this.setState({ loggedInUser: null }))
      .catch(() => this.setState({ loggedInUser: null }));
  };

  handlePhotoUploaded = () => {
    this.setState((prevState) => ({
      photoRefreshCounter: prevState.photoRefreshCounter + 1,
    }));
  };

  isLoggedIn = () => !!this.state.loggedInUser;

  toggleSidebar = () => {
    this.setState((prev) => ({ sidebarOpen: !prev.sidebarOpen }));
  };

  render() {
    if (!this.state.checkedLogin) {
      return <p className="ps-loading">Loading…</p>;
    }

    return (
      <HashRouter>
        <div className="ps-app">
          <TopBar
            loggedInUser={this.state.loggedInUser}
            onLogout={this.handleLogout}
            onPhotoUploaded={this.handlePhotoUploaded}
            onToggleSidebar={this.isLoggedIn() ? this.toggleSidebar : undefined}
          />

          <div className="ps-body">
            {this.isLoggedIn() && (
              <aside className={`ps-sidebar ${this.state.sidebarOpen ? 'ps-sidebar--open' : ''}`}>
                <div className="ps-panel">
                  <UserList onNavigate={() => this.setState({ sidebarOpen: false })} />
                </div>
              </aside>
            )}

            <main className="ps-main">
              <div className="ps-panel">
                <Switch>
                  <Route path="/login-register" render={props => (
                    <LoginRegister {...props} isLoggedIn={this.isLoggedIn()} onLogin={this.handleLogin} />
                  )} />

                  <Route exact path="/" render={() => (
                    this.isLoggedIn()
                      ? <Redirect to="/users" />
                      : <Redirect to="/login-register" />
                  )} />

                  <Route path="/users/:userId" render={props => (
                    this.isLoggedIn() ? <UserDetail {...props} /> : <Redirect to="/login-register" />
                  )} />

                  <Route path="/photos/:userId" render={props => (
                    this.isLoggedIn() ? (
                      <UserPhotos
                        key={`${props.location.pathname}-${this.state.photoRefreshCounter}`}
                        {...props}
                      />
                    ) : <Redirect to="/login-register" />
                  )} />

                  <Route path="/users" render={() => (
                    this.isLoggedIn()
                      ? <p>Select a user to view their details.</p>
                      : <Redirect to="/login-register" />
                  )} />
                </Switch>
              </div>
            </main>
          </div>
        </div>
      </HashRouter>
    );
  }
}

export default PhotoShare;