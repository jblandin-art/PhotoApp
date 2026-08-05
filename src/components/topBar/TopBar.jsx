import React from 'react';
import { withRouter } from 'react-router-dom';
import './TopBar.css';

import axios from 'axios';

class TopBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contextText: ""
    };
    this.fileInputRef = React.createRef();
  }

  componentDidMount() {
    this.updateContext();
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      this.updateContext();
    }
  }

  updateContext() {
    const path = this.props.location.pathname;
    if (path.includes("/users/") || path.includes("/photos/")) {
      const userId = path.split("/").pop();
      axios.get(`/user/${userId}`)
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

  handleLogout = () => {
    if (this.props.onLogout) {
      this.props.onLogout();
    }
  };

  handleAddPhotoClick = () => {
    if (this.fileInputRef.current) {
      this.fileInputRef.current.click();
    }
  };

  handlePhotoSelected = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("uploadedphoto", file);

    axios.post("/photos/new", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
      withCredentials: true
    })
      .then(() => {
        if (this.props.onPhotoUploaded) {
          this.props.onPhotoUploaded();
        }
        if (this.props.loggedInUser) {
          this.props.history.push(`/photos/${this.props.loggedInUser._id}`);
        }
      })
      .catch((err) => {
        console.error("Error uploading photo:", err);
      })
      .finally(() => {
        event.target.value = "";
      });
  };

  render() {
    const { loggedInUser, onToggleSidebar } = this.props;
    const { contextText } = this.state;

    return (
      <header className="ps-topbar">
        <div className="ps-topbar-left">
          {onToggleSidebar && (
            <button
              type="button"
              className="ps-hamburger"
              aria-label="Toggle user list"
              onClick={onToggleSidebar}
            >
              <span />
              <span />
              <span />
            </button>
          )}
          <span className="ps-topbar-title">PhotoApp</span>
        </div>

        {contextText && (
          <div className="ps-topbar-context">{contextText}</div>
        )}

        <div className="ps-topbar-right">
          {loggedInUser ? (
            <>
              <span className="ps-topbar-greeting">Hi {loggedInUser.first_name}</span>
              <input
                ref={this.fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={this.handlePhotoSelected}
              />
              <button type="button" className="ps-btn" onClick={this.handleAddPhotoClick}>
                Add Photo
              </button>
              <button type="button" className="ps-btn" onClick={this.handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <span className="ps-topbar-greeting">Please Login</span>
          )}
        </div>
      </header>
    );
  }
}
export default withRouter(TopBar);