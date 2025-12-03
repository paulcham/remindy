# Remindy - Chrome Extension

A simple reminder system for Chrome that sends desktop notifications based on customizable schedules.

## Features

- Multiple reminders support
- Customizable time ranges (start time to end time)
- Flexible reminder frequencies (every X minutes)
- Day selection (daily, weekdays, weekends, or specific days)
- Simple, clean interface

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the `remindy` folder
5. The extension icon should appear in your Chrome toolbar

## Icon Setup

The extension requires icon files. You can:
- Create simple 16x16, 48x48, and 128x128 pixel PNG icons
- Name them `icon16.png`, `icon48.png`, and `icon128.png`
- Place them in the extension root directory

For now, you can use any simple icon or create placeholder images. The extension will work without icons, but Chrome may show a default icon.

## Usage

1. Click the Remindy icon in your Chrome toolbar
2. Click "+ Add Reminder" to create a new reminder
3. Fill in:
   - **Reminder Name**: What you want to be reminded about
   - **Start Time**: When reminders should begin (e.g., 9:00 AM)
   - **End Time**: When reminders should stop (e.g., 6:00 PM)
   - **Reminder Frequency**: How often (in minutes) to show the reminder
   - **Days**: Which days of the week to show reminders
4. Click "Save"
5. Reminders will appear as desktop notifications at the scheduled times

## Example

- **Reminder**: "Do 10 push-ups"
- **Start Time**: 9:00 AM
- **End Time**: 6:00 PM
- **Frequency**: 60 minutes
- **Days**: Weekdays

This will show a notification every hour between 9 AM and 6 PM on weekdays.

## Permissions

- **notifications**: To show desktop notifications
- **storage**: To save your reminders
- **alarms**: To schedule reminder notifications

