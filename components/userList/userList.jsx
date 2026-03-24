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
import { UseParams, Link } from 'react-router-dom';
import { withRouter } from 'react-router-dom';

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
        users: window.models.userListModel(),
        selectedUserId: userId
    }
  }

  render() {
    return (
      <div>
        <Typography variant="body1">
          This is the user list, which takes up 3/12 of the window.
          You might choose to use <a href="https://mui.com/components/lists/">Lists</a> and <a href="https://mui.com/components/dividers/">Dividers</a> to
          display your users like so:
        </Typography>
        <List component="nav">
          {
            this.state.users.map((user) => {
            return (
              <div key={user._id}>
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
              </div>
            )
            })
            }
        </List>
        <Typography variant="body1">
          The model comes in from window.models.userListModel()
        </Typography>
      </div>
    );
  }
}

export default withRouter(UserList);
