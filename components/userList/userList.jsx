import React from 'react';
import {
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
  ListItemButton
}
from '@mui/material';
import './userList.css';
import { Link, withRouter } from 'react-router-dom';
//import fetchModel from '../../lib/fetchModelData';
import axios from 'axios';

/**
 * Define UserList, a React component of project #5
 */
class UserList extends React.Component {
  constructor(props) {
    super(props);
    const hash = window.location.hash;          // "#/users/123"
    const match = hash.match(/\/users\/(\w+)/); // regex to extract userId
    const userId = match ? match[1] : null;     // "123" or null if not on a user page
    this.state = {
        users: [],
        selectedUserId: userId
    };
  }

  componentDidMount() {
  axios.get('/user/list')
    .then((data) => {
      this.setState({ users: data.data });
    })
    .catch((err) => {
      console.error("Error fetching users:", err);
    });
}

  componentDidUpdate(){
    const hash = window.location.hash;          // "#/users/123"
    const match = hash.match(/\/users\/(\w+)/);
    const userId = match ? match[1] : null;     // "123" or null if not on a user page
    if (userId !== this.state.selectedUserId) {   // <-- important check!
    this.setState({ selectedUserId: userId });
    }
  }

  render() {
    return (
      <div>
        <List component="nav">
          {
            this.state.users.map((user) => {
            return (
              <React.Fragment key={user._id}>
                <ListItem>
                  <ListItemButton 
                  component={Link} 
                  to={`/users/${user._id}`} 
                  selected={this.state.selectedUserId === user._id} 
                  onClick={() => this.setState({ selectedUserId: user._id })}
            >
                    <ListItemText primary={`${user.first_name} ${user.last_name}`} />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </React.Fragment>
            );
            })
            }
        </List>
      </div>
    );
  }
}

export default withRouter(UserList);
