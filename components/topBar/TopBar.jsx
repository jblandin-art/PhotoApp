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
    };
  }

  componentDidMount(){
    this.handleAppInfoChange();
  }

  handleAppInfoChange(){
    if (this.state.app_info === undefined){
      fetchModel("/testinfo")
      .then.setState({
        app_info: response.data
    }).catch((err) => console.error("Error fetching app info:", err));
  } }

  render() {
    return this.state.app_info ?(
      <AppBar className="topbar-appBar" position="absolute">
        <Toolbar>
          <Grid container justifyContent="space-between" alignItems="center">

          <Grid item>
            <Typography variant="h5" color="inherit">
              [Name]
            </Typography>
          </Grid>

          <Grid item>
            <Typography variant="h5" color="inherit">
            </Typography> 
          </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
    ) : null;
  }
}

export default TopBar;
