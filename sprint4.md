# Photo App Sprint 4: @Mentions in Comments

In this project, you will extend the Photo App so users can @mention existing users in photo comments and then see all photos that mention a given user. This work is full stack: you will need to update the React app, the Node web server, and the MongoDB data model.

The work naturally breaks into three major areas, but for a 5-person team it is reasonable to split the sprint into five smaller stories by separating backend data handling, mention entry UI, mention display UI, comment rendering, and integration/testing.

## Setup

Before you begin, make sure your database and web server are running. If you need to reset the data, run:

```bash
node loadDatabase.js
```

You should continue from the same project repository and keep the existing app structure intact. The feature should be added to the current photo-sharing app, not built as a separate prototype.

## Sprint Goal

The user should be able to @mention users in photo comments, and the app should show all photos that @mention a particular user in that user’s detail view.

## User Stories

### Josiah Blanding - Backend mentions and storage
**Story points: 2**

As a developer, I want the database and server API to store @mentions tied to a specific photo so that the app can reliably validate mentions and later query photos that mention a user.

Acceptance notes:
- Add the schema or model changes needed to store mention data with a photo.
- Add or update API behavior so a comment submission can persist mention references safely.
- Reject invalid mentions without crashing the app.
- Support an endpoint or query path for retrieving photos that mention a given user.

### Josh Jaico - Intelligent mention entry
**Story points: 1**

As a user, I want an intelligent way to select users while typing a comment so that I can add valid @mentions without needing to remember exact usernames.

Acceptance notes:
- Provide a mention-aware input experience in the comment box.
- Make it easy to select from existing users.
- Keep the typed comment readable and usable after a mention is selected.

### Natalia Dudley - Mentioned photos in user detail
**Story points: 1**

As a user, I want the user detail view to show the photos that @mention that user so that I can quickly find where I was mentioned.

Acceptance notes:
- Add a mention list to the user detail page.
- Show a reasonable empty state when there are no mentions.
- Each item should include a small photo thumbnail.
- Clicking the thumbnail should open the photo at its location on the user’s photo page.
- Clicking the owner name should open the owner’s user detail page.

### Larry Whitworth - Comment display and mention rendering
**Story points: 1**

As a user, I want comments on photos to display correctly even when they include @mentions so that the photo page remains readable and the mention text does not break normal commenting.

Acceptance notes:
- Keep regular comments working on photo pages.
- Render mention-aware comments safely.
- Make sure comment display does not crash if a mention is invalid or missing.

### Abhi Ankhem - Integration and validation
**Story points: 1**

As a team member, I want the mention feature to work end-to-end with the existing routes, state updates, and tests so that the app behaves correctly after comments are submitted.

Acceptance notes:
- Wire the front-end and back-end changes together.
- Make sure the UI refreshes after a comment with mentions is submitted.
- Validate error handling for empty or invalid mentions.
- Verify the new flow does not break existing photo, user, or comment behavior.

## Notes

- The backend should never allow a non-existent user to be stored as a valid mention.
- The mention data should be associated with a photo, not treated as a standalone object.
- The user detail view should show something reasonable if the user has no @mentions.
- The total estimated story points for the sprint are 6.

## Recommended Order

1. Josiah sets up the data model and API shape.
2. Josh implements the mention selection UI.
3. Larry updates comment rendering so mention-aware comments display cleanly.
4. Natalia adds the mentioned-photo list to user detail.
5. Abhi ties the flow together and checks the end-to-end behavior.
