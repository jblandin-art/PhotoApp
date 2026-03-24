import React from 'react';
import {
  Typography
} from '@mui/material';
import './userDetail.css';
import { Link } from 'react-router-dom';
import {Box,Button,TextField} from '@mui/material';
import fetchModel from "../../lib/fetchModelData";

/**
 * Define UserDetail, a React component of project #5
 */
class UserDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state= {user: undefined};
    this.userId = this.props.match.params.userId;
    this._isMounted = false;
  }
  
componentDidMount() {
    const userId = this.props.match.params.userId;
    this._isMounted = true;
    fetchModel(`/user/${userId}`).then((data) => {
      if (this._isMounted) {
        this.setState({ userData: data });
      }
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidUpdate(){
    const userId = this.props.match.params.userId;

      fetchModel(`/user/${userId}`)
      .then((response) => {
        this.setState({user: response.data});
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
      });
  }

  
  render() {
return this.state.user ? (
  <div>
  <Box component ="form" noValidate autoComplete ="off">
    <div>
      <Button variant= "contained" component={Link} to={`/photos/${this.state.user._id}`}>User Photos</Button>
    </div>

    <div>
    <TextField id ="first_name" label = "First name" variant= "outlined" disabled fullWidth
      margin ="normal" 
      value={this.state.user.first_name}/>
    </div>

    <div>
     <TextField id ="last_name" label = "Last name" variant= "outlined" disabled fullWidth
      margin ="normal" 
      value={this.state.user.last_name}/>
    </div>

    <div>
        <TextField id ="location" label = "Location" variant= "outlined" disabled fullWidth
      margin ="normal" 
      value={this.state.user.location}/>
    </div>

    <div>
        <TextField id ="description" label = "Description" variant= "outlined" disabled fullWidth
      margin ="normal" 
      value={this.state.user.description}/>
    </div>

    <div>
        <TextField id ="occupation" label = "Occupation" variant= "outlined" disabled fullWidth
      margin ="normal" 
      value={this.state.user.occupation}/>
    </div>
  </Box>
  </div>
  
) : (
            <div/>
        );
  }
}

export default UserDetail;
