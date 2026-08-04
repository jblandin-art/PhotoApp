import React from 'react';
import {
  HashRouter, Route, Switch,
 Redirect } from 'react-router-dom';
import {
  Grid, Typography, Paper
} from '@mui/material';
import './styles/main.css';

// import necessary components

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
      photoRefreshCounter: 0
    };
  }

  componentDidMount() {
    // Check if user is already logged in (session) using /me endpoint
    axios.get('/me')
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
      .then(() => {
        this.setState({ loggedInUser: null });
      })
      .catch(() => {
        this.setState({ loggedInUser: null });
      });
  };

  handlePhotoUploaded = () => {
    this.setState((prevState) => ({
      photoRefreshCounter: prevState.photoRefreshCounter + 1,
    }));
  };

  isLoggedIn = () => {
    return !!this.state.loggedInUser;
  };


  render() {
    // Wait for login check before rendering routes
    if (!this.state.checkedLogin) {
    return <Typography variant="body1" style={{ padding: 24 }}>Loading...</Typography>;
      }
    return (
      <HashRouter>
        <div>
          <Grid container spacing={8}>
            <Grid item xs={12}>
              <TopBar
                loggedInUser={this.state.loggedInUser}
                onLogout={this.handleLogout}
                onPhotoUploaded={this.handlePhotoUploaded}
              />
            </Grid>
            <div className="main-topbar-buffer" />
            {this.isLoggedIn() && (
              <Grid item sm={3}>
                <Paper className="main-grid-item">
                  <UserList />
                </Paper>
              </Grid>
            )}
            <Grid item sm={this.isLoggedIn() ? 9 : 12}>
              <Paper className="main-grid-item">
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
                        ? <Typography variant="body1">
                            Select a user to view their details.
                          </Typography>
                        : <Redirect to="/login-register" />
                    )} />
                </Switch>
              </Paper>
            </Grid>
          </Grid>
        </div>
      </HashRouter>
    );
  }
}

export default PhotoShare;