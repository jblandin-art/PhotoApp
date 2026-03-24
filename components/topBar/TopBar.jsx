import React from 'react';
import { AppBar, Toolbar, Typography, Grid } from '@mui/material';
import { withRouter } from 'react-router-dom'; // Added this for Context Awareness
import './TopBar.css';
import fetchModel from '../../lib/fetchModelData';

class TopBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      app_info: undefined,
      contextText: ""
    };
  }

  componentDidMount() {
    this.handleAppInfoChange();
    this.updateContext();
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      this.updateContext();
    }
  }

  handleAppInfoChange() {
    fetchModel("/testinfo")
      .then((response) => {
        this.setState({ app_info: response.data });
      })
      .catch((err) => console.error("Error fetching app info:", err));
  }

  updateContext() {
    const path = this.props.location.pathname;
    if (path.includes("/users/") || path.includes("/photos/")) {
      const userId = path.split("/").pop();
      fetchModel(`/user/${userId}`)
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

  render() {
    return (
      <AppBar className="topbar-appBar" position="absolute">
        <Toolbar>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography variant="h5" color="inherit">
                Abhiram Ankem
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="h5" color="inherit">
                {this.state.contextText}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="subtitle1" color="inherit">
                {this.state.app_info ? `Version: ${this.state.app_info.__v}` : ""}
              </Typography>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
    );
  }
}

export default withRouter(TopBar);