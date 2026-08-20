import React from 'react';
import { Typography, Card, CardContent, Divider, List, ListItem } from '@mui/material';
import Link from "next/link";
import './userPhotos.css';
import axios from 'axios';

/**
 * Parses comment text and renders @mentions as clickable profile links.
 * Falls back to plain text for any @token that isn't in the mentions array.
 *
 * @param {string} text - The raw comment string.
 * @param {Array}  mentions - Array of populated mention user objects
 *                            { _id, login_name, first_name, last_name }.
 */
function renderCommentWithMentions(text, mentions) {
  if (text === null || text === undefined) return null;

  const commentText = String(text);
  if (commentText.length === 0) return null;

  // Build a quick lookup: login_name (lowercase) -> user object
  const mentionMap = new Map();
  if (Array.isArray(mentions)) {
    mentions.forEach((u) => {
      if (u && u.login_name) {
        mentionMap.set(String(u.login_name).toLowerCase(), u);
      }
    });
  }

  const mentionPattern = /(^|[^A-Za-z0-9_])@([A-Za-z0-9_]+)/g;
  const nodes = [];
  let lastIndex = 0;
  let match = mentionPattern.exec(commentText);

  while (match) {
    const token = match[2];
    const mentionStart = match.index + match[1].length;
    const mentionEnd = mentionPattern.lastIndex;

    if (mentionStart > lastIndex) {
      nodes.push(commentText.slice(lastIndex, mentionStart));
    }

    const user = mentionMap.get(token.toLowerCase());
    if (user && user._id) {
      nodes.push(
        <Link key={`${mentionStart}-${token}`} href={`/users/${user._id}`} className="mention-highlight">
          @{token}
        </Link>
      );
    } else {
      nodes.push(commentText.slice(mentionStart, mentionEnd));
    }

    lastIndex = mentionEnd;
    match = mentionPattern.exec(commentText);
  }

  if (lastIndex < commentText.length) {
    nodes.push(commentText.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : commentText;
}


class UserPhotos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      photos: [],
      // Per-photo comment text
      newComments: {},
      // Per-photo mention suggestion dropdown
      mentionSuggestions: {},
      // Per-photo: the @-query currently being typed (null = dropdown closed)
      mentionQuery: {},
      // Per-photo: array of { id, login_name } that were selected via dropdown
      selectedMentions: {},
    };
  }

  componentDidMount() {
    const userId = this.props.userId;
    axios.get(`/api/photosOfUser/${userId}`)
      .then((response) => {
        this.setState({ photos: response.data });
      })
      .catch((err) => {
        console.error("Error fetching photos:", err);
      });
  }

  // ─── Mention autocomplete helpers ────────────────────────────────────────────

  /**
   * Detects if the caret is right after an @-triggered word and returns
   * the query text, or null if not in a mention context.
   */
  static getMentionQueryFromText(text) {
    // Look for the last @ that is at the start of a word
    const match = text.match(/(^|[\s])@([A-Za-z0-9_]*)$/);
    return match ? match[2] : null;
  }

  handleCommentChange = (photoId, event) => {
    const value = event.target.value;

    this.setState((prevState) => ({
      newComments: { ...prevState.newComments, [photoId]: value },
    }));

    const query = UserPhotos.getMentionQueryFromText(value);
    if (query !== null) {
      // User is typing a mention — update the active query
      this.setState((prevState) => ({
        mentionQuery: { ...prevState.mentionQuery, [photoId]: query },
      }));

      if (query.length >= 1) {
        axios.get(`/api/users/mentionSearch?search=${encodeURIComponent(query)}`)
          .then((response) => {
            this.setState((prevState) => ({
              mentionSuggestions: { ...prevState.mentionSuggestions, [photoId]: response.data },
            }));
          })
          .catch(() => {
            this.setState((prevState) => ({
              mentionSuggestions: { ...prevState.mentionSuggestions, [photoId]: [] },
            }));
          });
      } else {
        // Show no suggestions until at least 1 char is typed after @
        this.setState((prevState) => ({
          mentionSuggestions: { ...prevState.mentionSuggestions, [photoId]: [] },
        }));
      }
    } else {
      // Caret moved away from @ context — close dropdown
      this.setState((prevState) => ({
        mentionQuery: { ...prevState.mentionQuery, [photoId]: null },
        mentionSuggestions: { ...prevState.mentionSuggestions, [photoId]: [] },
      }));
    }
  };

  handleSelectMention = (photoId, suggestion) => {
    // suggestion: { id, display }  — display = "First Last (login_name)"
    // Extract login_name from display string "First Last (login_name)"
    const loginMatch = suggestion.display.match(/\(([^)]+)\)$/);
    const loginName = loginMatch ? loginMatch[1] : suggestion.id;

    this.setState((prevState) => {
      // Replace the trailing @<partial-query> in the text with @login_name + space
      const currentText = prevState.newComments[photoId] || '';
      const newText = currentText.replace(/(^|[\s])@([A-Za-z0-9_]*)$/, `$1@${loginName} `);

      const existing = prevState.selectedMentions[photoId] || [];
      // Avoid duplicates
      const already = existing.find((m) => m.id === String(suggestion.id));
      const updated = already ? existing : [...existing, { id: String(suggestion.id), loginName }];

      return {
        newComments: { ...prevState.newComments, [photoId]: newText },
        mentionQuery: { ...prevState.mentionQuery, [photoId]: null },
        mentionSuggestions: { ...prevState.mentionSuggestions, [photoId]: [] },
        selectedMentions: { ...prevState.selectedMentions, [photoId]: updated },
      };
    });
  };

  handleCloseSuggestions = (photoId) => {
    this.setState((prevState) => ({
      mentionQuery: { ...prevState.mentionQuery, [photoId]: null },
      mentionSuggestions: { ...prevState.mentionSuggestions, [photoId]: [] },
    }));
  };

  // ─── Comment submission ───────────────────────────────────────────────────────

  handleAddComment = (photoId, event) => {
    event.preventDefault();
    const commentText = this.state.newComments[photoId];
    if (!commentText || !commentText.trim()) {
      console.error("Comment cannot be empty.");
      return;
    }

    // Collect selected mention IDs
    const mentionIds = (this.state.selectedMentions[photoId] || []).map((m) => m.id);

    axios.post(`/api/commentsOfPhoto/${photoId}`, { comment: commentText, mentions: mentionIds })
      .then((response) => {
        this.setState((prevState) => {
          const updatedPhotos = prevState.photos.map((photo) => {
            if (photo._id === photoId) {
              return { ...photo, comments: [...(photo.comments || []), response.data] };
            }
            return photo;
          });
          return {
            photos: updatedPhotos,
            newComments: { ...prevState.newComments, [photoId]: '' },
            selectedMentions: { ...prevState.selectedMentions, [photoId]: [] },
            mentionSuggestions: { ...prevState.mentionSuggestions, [photoId]: [] },
            mentionQuery: { ...prevState.mentionQuery, [photoId]: null },
          };
        });
      })
      .catch((err) => {
        const msg = err.response && err.response.data ? err.response.data : err.message;
        console.error("Error adding comment:", msg);
        // eslint-disable-next-line no-alert
        alert(`Could not post comment: ${msg}`);
      });
  };

  // ─── Photo upload ─────────────────────────────────────────────────────────────

  handleUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("uploadedphoto", file);

    axios.post("/api/photos/new", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    })
      .then(() => {
        const userId = this.props.userId;
        return axios.get(`/api/photosOfUser/${userId}`);
      })
      .then((response) => {
        this.setState({ photos: response.data });
      })
      .catch((err) => {
        console.error("Error uploading photo:", err);
      });
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  render() {
    return (
      
      <div className="user-photos-container">
        {this.state.photos.length === 0 && (
          <Typography variant="body1" style={{ marginTop: '20px' }}>
            No photos to display.
          </Typography>
        )}
        {this.state.photos.map((photo) => {
          const suggestions = this.state.mentionSuggestions[photo._id] || [];
          const commentText = this.state.newComments[photo._id] || '';

          return (
            <Card key={photo._id} variant="outlined" style={{ marginBottom: '20px' }}>
              <CardContent>
                <div id={photo._id} />
                <Typography variant="subtitle2" color="textSecondary">
                  Posted on: {photo.date_time}
                </Typography>
                <img
                  src={photo.file_name && photo.file_name.startsWith('http') ? photo.file_name : `/images/${photo.file_name}`}
                  alt={photo.file_name}
                  style={{
                  width: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain', 
                  marginTop: '10px',
                }}
                />

                <Divider style={{ margin: '15px 0' }} />
                {/* Comments list */}
                <Typography variant="h6">Comments</Typography>
                <List>
                  {photo.comments && photo.comments.length > 0
                    ? photo.comments.map((comment) => (
                        <ListItem
                          key={comment._id}
                          alignItems="flex-start"
                          style={{ flexDirection: 'column' }}
                        >
                          <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                            <Link href={`/users/${comment.user ? comment.user._id : comment.user_id}`}>
                              {comment.user
                                ? `${comment.user.first_name} ${comment.user.last_name}`
                                : 'Unknown User'}
                            </Link>
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {comment.date_time}
                          </Typography>
                          <Typography variant="body1" style={{ marginTop: '5px' }}>
                            {renderCommentWithMentions(comment.comment, comment.mentions)}
                          </Typography>
                          <Divider variant="inset" style={{ width: '100%', margin: '10px 0' }} />
                        </ListItem>
                      ))
                    : <Typography variant="body2">No comments yet.</Typography>}
                </List>

                {/* Comment input with @mention autocomplete */}
                <div className="comment-form-shell" style={{ position: 'relative' }}>
                  <form
                    className="comment-form"
                    onSubmit={(event) => this.handleAddComment(photo._id, event)}
                  >
                    <label className="comment-form-label" htmlFor={`comment-${photo._id}`}>
                      Add comment...
                    </label>
                    <input
                      id={`comment-${photo._id}`}
                      className="comment-form-input"
                      type="text"
                      value={commentText}
                      onChange={(event) => this.handleCommentChange(photo._id, event)}
                      onBlur={() => setTimeout(() => this.handleCloseSuggestions(photo._id), 150)}
                      autoComplete="off"
                      placeholder="Type a comment… use @ to mention someone"
                    />
                    <input className="comment-form-button" type="submit" value="Submit" />
                  </form>

                  {/* Autocomplete dropdown */}
                  {suggestions.length > 0 && (
                    <ul className="mention-dropdown">
                      {suggestions.map((s) => (
                        <li
                          key={s.id}
                          className="mention-dropdown-item"
                          onMouseDown={() => this.handleSelectMention(photo._id, s)}
                        >
                          {s.display}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }
}

export default UserPhotos;
