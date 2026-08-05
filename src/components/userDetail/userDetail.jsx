import React from 'react';
import './userDetail.css';
import { Link } from 'react-router-dom';
import {Box,Button,TextField,Typography} from '@mui/material';
//import fetchModel from "../../lib/fetchModelData";
import axios from 'axios';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import { HashLink } from 'react-router-hash-link';

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
          console.log("photosWithMentions response:", response.data);
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
     value={this.state.user.location ?? ""}/>
    </div>

    <div>
        <TextField id ="description" label = "Description" variant= "outlined" disabled fullWidth
      margin ="normal" 
      value={this.state.user.description ?? ""}/>
    </div>

    <div>
        <TextField id ="occupation" label = "Occupation" variant= "outlined" disabled fullWidth
      margin ="normal" 
      value={this.state.user.occupation ?? ""}/>
    </div>
    <div>
      <Typography variant="subtitle2" color="textSecondary">
        Comments that mention {this.state.user.first_name}:
      </Typography>
    </div>
    <div>
    {this.state.mentioned && this.state.mentioned.length > 0 ? (
      <ImageList sx={{ width: 750, height: 450 }} cols={3} rowHeight={300}>
        {this.state.mentioned.map((photo) => {
          const imageSrc = photo.file_name && photo.file_name.startsWith('http')
            ? photo.file_name
            : `/images/${photo.file_name}`;

          return (
            <ImageListItem key={photo._id} component={HashLink} smooth to={`/photos/${photo.owner._id}#${photo._id}`}>
              <img
                src={`${imageSrc}?w=248&fit=crop&auto=format`}
                alt={photo.file_name}
                loading="lazy"
                style = {{
                  aspectRatio: '1/1'
                }}
              />
              <ImageListItemBar
                title= {<Link to={`/users/${photo.owner._id}`}>{photo.owner.first_name} {photo.owner.last_name}</Link>}
                position="below"
              />
            </ImageListItem>
          );
        })}
      </ImageList>
    ) : (
      <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
        <Typography variant="body1" color="textSecondary">
          {this.state.user.first_name} hasn&apos;t been mentioned in any photos yet.
        </Typography>
      </Box>
    )}
    </div>
  </Box>
  </div>
  
) : (
            <div/>
        );
  }
}

export default UserDetail;
