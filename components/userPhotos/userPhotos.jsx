import React from 'react';
import { Typography, Card, CardContent, Divider, List, ListItem } from '@mui/material';
import { Link } from 'react-router-dom';
import './userPhotos.css';
import axios from 'axios';
//import fetchModel from '../../lib/fetchModelData';

class UserPhotos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      photos: []
    };
  }

  componentDidMount() {
    const userId = this.props.match.params.userId;
    // FETCH DATA: Calling the API to get photos for this specific user
    axios.get(`/photosOfUser/${userId}`)
      .then((response) => {
        this.setState({ photos: response.data });
      })
      .catch((err) => {
        console.error("Error fetching photos:", err);
      });
  }

  render() {
    return (
      <div className="user-photos-container">
        {this.state.photos.map((photo) => (
          <Card key={photo._id} variant="outlined" style={{ marginBottom: '20px' }}>
            <CardContent>
              {/* ISSUE #4: Display Photo and Creation Date */}
              <Typography variant="subtitle2" color="textSecondary">
                Posted on: {photo.date_time}
              </Typography>
              <img 
                src={`/images/${photo.file_name}`} 
                alt={photo.file_name} 
                style={{ width: '100%', marginTop: '10px' }} 
              />

              <Divider style={{ margin: '15px 0' }} />

              {/* ISSUE #5: Display Comments */}
              <Typography variant="h6">Comments</Typography>
              <List>
                {photo.comments ? photo.comments.map((comment) => (
                  <ListItem key={comment._id} alignItems="flex-start" style={{ flexDirection: 'column' }}>
                    <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                      {/* Link commenter name to their profile */}
                      <Link to={`/users/${comment.user._id}`}>
                        {comment.user.first_name} {comment.user.last_name}
                      </Link>
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {comment.date_time}
                    </Typography>
                    <Typography variant="body1" style={{ marginTop: '5px' }}>
                      {comment.comment}
                    </Typography>
                    <Divider variant="inset" style={{ width: '100%', margin: '10px 0' }} />
                  </ListItem>
                )) : <Typography variant="body2">No comments yet.</Typography>}
              </List>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
}

export default UserPhotos;
