# Notion Calendar Automa

This project provides a service to automatically synchronize events between a Notion database and Google Calendar.

## Overview

The application runs as a backend service that periodically scans a specified Notion database for event updates. It uses the Notion API to fetch events and the Google Calendar API to add or update corresponding events in a user's Google Calendar. Authentication is handled via Google OAuth2.

## Key Features

* **Notion to Google Calendar Sync**: Automatically fetches events from a Notion database and creates/updates them in Google Calendar.
* **Google OAuth2 Authentication**: Securely authenticates users using Google OAuth2 to access their calendar data.
* **Background Scanning**: Runs a periodic background task to check for changes in the Notion database.
* **Database Integration**: Uses MongoDB (via Mongoose) to store user information, calendar details, and event mappings.
* **API Endpoints**: Provides API endpoints for user authentication, adding Notion/Google Calendar connections, and controlling the scanning process.
* **Event State Management**: Tracks the state of events (e.g., PENDING, PUBLISHING, PUBLISHED) during the synchronization process.

## Project Structure

* **`index.js`**: The main entry point for the application. Initializes the server, database connection, and starts the background scanning process.
* **`Database/`**: Contains modules for database connectivity (`database.js`) and data access operations for users (`user.db.js`) and calendars/events (`calendar.db.js`).
* **`core/`**: Holds the core logic for interacting with external services:
    * `auth.js`: Handles Google OAuth2 authentication flow.
    * `calendar.js`: Manages interactions with the Google Calendar API (adding/updating events).
    * `notion.js`: Handles interactions with the Notion API (fetching/processing events).
* **`Models/`**: Defines the data structures (Mongoose Schemas and Classes) used in the application:
    * `User.js`: User data model.
    * `Calendar.js`: Calendar data model.
    * `Event.js`: Event data model, including state and color definitions.
* **`Routes/`**: Contains Express router definitions for API endpoints:
    * `auth.routes.js`: Handles authentication routes and user/calendar info retrieval.
    * `notion.routes.js`: Handles routes related to Notion integration (adding calendars, controlling scans).
* **`.env` (Required)**: Configuration file storing environment variables like API keys, database URL, redirect URI, etc. (Note: This file is not present in the uploaded code but is required based on `require("dotenv").config();` calls and usage of `process.env`).

## Basic Setup & Usage (Conceptual)

1.  **Environment Variables**: Set up a `.env` file with necessary credentials and configuration (e.g., `GOOGLE_CLIENT_ID`, `GOOGLE_SECRET_ID`, `REDIRECT_URI`, `NOTION_API_KEY`, `DATABASE_URL`, `PORT`, `SCAN_INTERVAL`).
2.  **Dependencies**: Install Node.js dependencies using `npm install` (assuming npm is used).
3.  **Run**: Start the application using `node index.js`.
4.  **Authentication & Setup**: Follow the steps below.
5.  **Start Scan**: Users enable the synchronization process via the `/notion/scan` endpoint.

The service will then periodically check the specified Notion database and sync changes to the linked Google Calendar.

## Configuration

1.  **Authorize Google Calendar Access**: Navigate to the root endpoint (`/`) in your browser. This will redirect you to Google's OAuth consent screen to grant the application permission to access your email and calendar. After authorization, Google redirects back to the `/redirect` endpoint, which saves the user's authentication tokens.
2.  **Add Database ID**: Make a POST request to the `/notion/add_calendar` endpoint, providing your email, the Notion Database ID you want to sync, and the target Google Calendar ID (use "primary" for the main calendar). This links the Notion database and Google Calendar to your user profile in the application's database.