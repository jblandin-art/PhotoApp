import React from 'react';
import { AppBar, Toolbar, Typography, Grid, Button } from '@mui/material';
import { withRouter } from 'react-router-dom'; // Added this for Context Awareness
import './TopBar.css';
//import fetchModel from '../../lib/fetchModelData';

import axios from 'axios';

class TopBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      app_info: undefined,
      contextText: ""
    };
  }

  componentDidMount() {
    this.updateContext();
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      this.updateContext();
    }
  }

  updateContext() {
    const path = this.props.location.pathname;
    if (path.includes("/users/") || path.includes("/photos/")) {
      const userId = path.split("/").pop();
      axios.get(`/user/${userId}`)
        .then((response) => {
          const user = response.data;
          const prefix = path.includes("/photos/") ? "Photos of " : "Details of ";
          this.setState({ contextText: `${prefix}${user.first_name} ${user.last_name}` });
        })
        .catch(() => this.setState({ contextText: "" }));
    } else {
      this.setState({ contextText: "" });
    }
  }

  handleLogout = () => {
    if (this.props.onLogout) {
      this.props.onLogout();
    }
  };

  render() {
    const { loggedInUser } = this.props;
    return (
      <AppBar className="topbar-appBar" position="absolute">
        <Toolbar>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography variant="h5" color="inherit">
                Abhi Ankem
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="h5" color="inherit">
                {this.state.contextText}
              </Typography>
            </Grid>
            <Grid item>
              {loggedInUser ? (
                <Grid container alignItems="center" spacing={1}>
                  <Grid item>
                    <Typography variant="subtitle1" color="inherit">
                      Hi {loggedInUser.first_name}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Button color="inherit" onClick={this.handleLogout} size="small" variant="outlined">
                      Logout
                    </Button>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="subtitle1" color="inherit">
                  Please Login
                </Typography>
              )}
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
    );
  }
}
export default withRouter(TopBar);