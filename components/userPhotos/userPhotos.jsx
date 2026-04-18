import React from 'react';
import { Typography, Card, CardContent, Divider, List, ListItem, TextField } from '@mui/material';
import { Link } from 'react-router-dom';
import './userPhotos.css';
import axios from 'axios';
//import fetchModel from '../../lib/fetchModelData';

class UserPhotos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      photos: [],
      newComment: '',
      newComments: {} // Stores new comments for each photo
    };
  }

  componentDidMount() {
    const userId = this.props.match.params.userId;
    // FETCH DATA: Calling the API to get photos for this specific user
    axios.get(`/photosOfUser/${userId}`)
      .then((response) => { 
        // Successfully gets photo and updates the state with the photos data
        this.setState({ photos: response.data });
      })
      .catch((err) => {
        console.error("Error fetching photos:", err);
      });
  }

	handleCommentChange = (photoId) => {
    this.setState((prevState) => ({
      ...prevState,
      newComments: {
        ...prevState.newComments,
        [photoId]: event.target.value
      }
    }));
	};

  handleAddComment = (event) => {
    const commentText = this.state.newComments[photoId];
    if (!commentText) {
      alert("Comment cannot be empty.");
      return;
    }

    axios.post("/commentsOfPhoto/" + {photoId}, { comment: commentText }).then((response) => {
      this.setState((prevState) => {
        const updatedPhotos = prevState.photos.map((photo) => {
          if (photo._id === photoId) {
            return {
              ...photo, comments: [...(photo.comments || []), response.data]};
          }
          return photo;
        });
        return { photos: updatedPhotos, newComments: { ...prevState.newComments, [photoId]: '' } };
      });
    })
    .catch((err) => {
      console.error("Error adding comment:", err);
    });
  };
  
handleUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("uploadedphoto", file);

  axios.post("/photos/new", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    },
    withCredentials: true
  })
  .then(() => {
    //  refresh photos after upload
    const userId = this.props.match.params.userId;

    return axios.get(`/photosOfUser/${userId}`);
  })
  .then((response) => {
    this.setState({ photos: response.data });
  })
  .catch((err) => {
    console.error("Error uploading photo:", err);
  });
};

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
              <div>
                <form onSubmit={this.handleAddComment}>
							    <label for='comment'>Add comment...</label>
                  <input type='text' value={this.state.newComments[photo._id]} onChange = {this.handleCommentChange}/>
                  <input type="submit" value="Submit"></input>
					      </form>
              </div>
            </CardContent>
          </Card>
          
        ))}
      </div>
    );
  }
}

export default UserPhotos;
