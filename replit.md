# AutomatedBot-V3.0

## Overview
This is a Node.js automated bot application with an Express web server frontend. The bot uses the ws3-fca library for Facebook Chat API integration and provides a web interface for managing bot sessions.

## Project Structure
- `vern.js` - Entry point that spawns the main process with auto-restart capability
- `auto.js` - Main application file containing Express server and bot logic
- `public/` - Static web files (HTML, CSS, JS) for the web interface
- `script/` - Bot command scripts
- `data/` - Configuration and session data storage
- `dev.json` - Developer user IDs configuration

## Running the Application
- Start command: `npm run start`
- The Express server runs on port 5000
- Web interface provides routes for:
  - `/` - Main index page
  - `/step_by_step_guide` - Setup guide
  - `/online_user` - Online users view
  - `/info` - API endpoint for account info
  - `/commands` - API endpoint for available commands
  - `/login` - POST endpoint for user authentication

## Dependencies
The project uses Express for the web server, ws3-fca for Facebook Chat API, and various utility packages like chalk, cheerio, axios, etc.

## Configuration
- `data/config.json` - Main bot configuration (auto-created if not exists)
- `data/history.json` - User session history
- `data/database.json` - Thread admin database
- `data/session/` - User session files
