import React from 'react';
import {
  AppBar, Toolbar, Typography
} from '@mui/material';
import './TopBar.css';

/**
 * Define TopBar, a React componment of project #5
 */
class TopBar extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      app_info: undefined
    }
  }

  render() {
    return this.state.app_info ?(
      <AppBar className="topbar-appBar" position="absolute">
        <Toolbar>
          <Grid container justifyContent="space-between alignItems="center">

          <Grid item>
            <Typography variant="h5" color="inherit">
              [Name]
            </Typography>
          </Grid>

          <Grid item>
            <Typography variant="h5" color="inherit">
            </Typography> 
          </Grid>
        </Toolbar>
      </AppBar>
    );
  }
}

export default TopBar;
