# Remindy - Smart Reminder Chrome Extension

A powerful Chrome extension that helps you stay on track with customizable reminders that can be scheduled to repeat on specific days, weekdays, or weekends, with flexible time intervals.

## Features

- **Flexible Scheduling**: Set reminders to repeat every XX minutes between specific hours
- **Day Selection**: Choose individual days, weekdays, or weekends
- **Markdown Support**: Rich text descriptions with markdown formatting
- **Smart Notifications**: Native Chrome notifications with snooze functionality
- **Toggle Control**: Enable/disable reminders instantly
- **Modern UI**: Clean, responsive interface with smooth animations

## Installation

1. **Clone or download** this repository to your local machine
2. **Generate Icons** (required):
   - Open `generate_icons.html` in your browser
   - Download all four icon files (16x16, 32x32, 48x48, 128x128)
   - Save them in the `icons/` folder with the correct names:
     - `icon16.png`
     - `icon32.png`
     - `icon48.png`
     - `icon128.png`
3. **Load the extension** in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top right)
   - Click "Load unpacked" and select the extension folder
   - The Remindy icon should appear in your browser toolbar

## Usage

### Creating a Reminder

1. Click the Remindy icon in your browser toolbar
2. Click "Add Reminder"
3. Fill in the details:
   - **Title**: A clear name for your reminder (e.g., "Exercise Break")
   - **Description**: Optional details with markdown support
   - **Enable recurring**: Check this for repeating reminders

### Configuring Repeat Settings

When recurring reminders are enabled, you can set:

- **Interval**: How often the reminder should repeat (in minutes)
- **Active Hours**: The time range when reminders should be active
- **Days**: Choose from:
  - **Weekdays**: Monday through Friday
  - **Weekends**: Saturday and Sunday
  - **Specific**: Select individual days of the week

### Managing Reminders

- **Toggle**: Use the switch to enable/disable reminders
- **Edit**: Click the edit icon to modify reminder settings
- **Delete**: Click the trash icon to remove a reminder

### Notifications

When a reminder triggers:
- A native Chrome notification appears
- Click "Done" to dismiss
- Click "Snooze 5 min" to be reminded again in 5 minutes

## Example Use Cases

### Exercise Reminder
- **Title**: "Stretch Break"
- **Description**: "Time to stretch! **Remember to**:\n- Stand up and walk around\n- Do neck and shoulder rolls\n- Drink some water"
- **Repeat**: Every 60 minutes
- **Hours**: 9:00 AM to 6:00 PM
- **Days**: Weekdays

### Hydration Reminder
- **Title**: "Drink Water"
- **Description**: "Stay hydrated! 💧"
- **Repeat**: Every 30 minutes
- **Hours**: 8:00 AM to 8:00 PM
- **Days**: All days

### Meeting Preparation
- **Title**: "Daily Standup Prep"
- **Description**: "Review your tasks for standup meeting"
- **Repeat**: Every 24 hours (1440 minutes)
- **Hours**: 9:00 AM to 9:05 AM
- **Days**: Weekdays

## File Structure

```
remindy/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for alarms and notifications
├── popup.html            # Main popup interface
├── popup.css             # Styling for the popup
├── popup.js              # Popup functionality
├── generate_icons.html   # Icon generation utility
├── icons/                # Extension icons (you need to generate these)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Technical Details

### Architecture

- **Manifest V3**: Uses the latest Chrome extension API
- **Service Worker**: Handles background processes and alarm scheduling
- **Chrome APIs Used**:
  - `chrome.alarms` - For scheduling reminders
  - `chrome.notifications` - For displaying notifications
  - `chrome.storage.local` - For saving reminder data

### Permissions

- **storage**: Save reminder configurations
- **alarms**: Schedule recurring notifications
- **notifications**: Display system notifications

### Scheduling Logic

The extension uses smart scheduling that:
- Calculates the next valid occurrence based on day and time constraints
- Handles edge cases like crossing midnight or weekend boundaries
- Automatically reschedules after each notification

## Troubleshooting

### Extension Not Loading
- Ensure all files are in the correct location
- Check that icon files are generated and placed in the `icons/` folder
- Verify Chrome Developer mode is enabled

### Notifications Not Appearing
- Check Chrome notification permissions
- Ensure the reminder is enabled (toggle switch)
- Verify the current time is within the active hours

### Reminders Not Recurring
- Confirm "Enable recurring reminders" is checked
- Verify the schedule settings are correct
- Check that at least one day is selected for specific day mode

## Development

### Modifying the Code

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Remindy extension
4. Test your changes

### Adding Features

The codebase is modular and well-commented:
- `background.js` - Add new alarm logic or notification features
- `popup.js` - Add new UI functionality
- `popup.css` - Modify styling and layout

## Contributing

Feel free to contribute improvements:
1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

If you encounter issues or have feature requests, please check the troubleshooting section above or create an issue in the repository.