import React from 'react';
import './userDetail.css';
import { Link } from 'react-router-dom';
import {Box,Button,TextField} from '@mui/material';
//import fetchModel from "../../lib/fetchModelData";
import axios from 'axios';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';

/**
 * Define UserDetail, a React component of project #5
 */
class UserDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state= {
      user: undefined,
      mentioned : []
    };
    this.userId = this.props.match.params.userId;
    this._isMounted = false;
  }
  
componentDidMount() {
    this._isMounted = true;
    const userId = this.props.match.params.userId;

    axios.get(`/user/${userId}`)
        .then((response) => {
          this.setState({user: response.data});
        })
        .catch((err) => {
          console.error("Error fetching user:", err);
        });
    axios.get(`/photosWithMentions/${userId}`)
        .then((response)=> {
          this.setState({mentioned: response.data.photos});
        })
        .catch((err) => {
          console.error("Error fetching mentioned:", err);
        });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidUpdate(prevProps) {
    const userId = this.props.match.params.userId;
    const prevUserId = prevProps.match.params.userId;
    if (userId === prevUserId) return; // only re-fetch when the user route actually changes

    axios.get(`/user/${userId}`)
      .then((response) => {
        this.setState({ user: response.data });
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
      });

    axios.get(`/photosWithMentions/${userId}`)
      .then((response) => {
        this.setState({ mentioned: response.data.photos });
      })
      .catch((err) => {
        console.error("Error fetching mentioned:", err);
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
    <div>
    <ImageList sx={{ width: 500, height: 450 }} cols={3} rowHeight={200}>
      {this.state.mentioned.map((photo) => (
        <ImageListItem key={photo._id} component={Link} to={`/photos/${photo.owner._id}`}>
          <img
            src={`/images/${photo.file_name}?w=248&fit=crop&auto=format`}
            alt={photo.file_name}
            loading="lazy"
            style = {{
              aspectRatio: '1/1'
            }}
          />
          <ImageListItemBar
            title= {<Link to={`/users/${photo.owner._id}`}>{photo.owner._id}</Link>}
            position="below"
          />
        </ImageListItem>
      ))}
    </ImageList>
    </div>
  </Box>
  </div>
  
) : (
            <div/>
        );
  }
}

export default UserDetail;
