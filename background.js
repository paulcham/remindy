// Background service worker for managing notifications and alarms

// Initialize alarms when extension is installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  await updateAllAlarms();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateAlarms') {
    updateAllAlarms(message.reminders);
    sendResponse({ success: true });
  }
  return true;
});

// Update all alarms based on stored reminders
async function updateAllAlarms(remindersFromMessage = null) {
  // Clear all existing alarms except the reschedule check
  const alarms = await chrome.alarms.getAll();
  for (const alarm of alarms) {
    if (alarm.name !== 'rescheduleCheck') {
      chrome.alarms.clear(alarm.name);
    }
  }
  
  // Get reminders from storage or use provided ones
  let reminders;
  if (remindersFromMessage) {
    reminders = remindersFromMessage;
  } else {
    const result = await chrome.storage.local.get(['reminders']);
    reminders = result.reminders || [];
  }
  
  if (reminders.length === 0) {
    return;
  }
  
  // Schedule alarms for each reminder
  for (const reminder of reminders) {
    scheduleReminderAlarms(reminder);
  }
}

// Schedule alarms for a single reminder
function scheduleReminderAlarms(reminder) {
  const now = new Date();
  
  // Calculate all alarm times for the next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    checkDate.setHours(0, 0, 0, 0); // Reset to start of day
    
    // Check if this day matches the date frequency
    if (!isDayMatch(checkDate, reminder.dateFrequency)) {
      continue;
    }
    
    // Generate alarm times for this day
    const alarmTimes = generateAlarmTimes(checkDate, reminder.startTime, reminder.endTime, reminder.reminderFrequency);
    
    // Schedule each alarm
    for (const alarmTime of alarmTimes) {
      // Only schedule if the alarm time is in the future
      if (alarmTime > now) {
        const alarmName = `${reminder.id}_${alarmTime.getTime()}`;
        chrome.alarms.create(alarmName, {
          when: alarmTime.getTime()
        });
      }
    }
  }
}

// Check if a date matches the date frequency
function isDayMatch(date, dateFrequency) {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  switch (dateFrequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'monday':
      return dayOfWeek === 1;
    case 'tuesday':
      return dayOfWeek === 2;
    case 'wednesday':
      return dayOfWeek === 3;
    case 'thursday':
      return dayOfWeek === 4;
    case 'friday':
      return dayOfWeek === 5;
    case 'saturday':
      return dayOfWeek === 6;
    case 'sunday':
      return dayOfWeek === 0;
    default:
      return false;
  }
}

// Generate alarm times for a given day
function generateAlarmTimes(dayDate, startTime, endTime, frequencyMinutes) {
  const alarmTimes = [];
  const start = new Date(dayDate);
  const [startHour, startMinute] = startTime.split(':').map(Number);
  start.setHours(startHour, startMinute, 0, 0);
  
  const end = new Date(dayDate);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  end.setHours(endHour, endMinute, 0, 0);
  
  let current = new Date(start);
  
  while (current <= end) {
    alarmTimes.push(new Date(current));
    current = new Date(current.getTime() + frequencyMinutes * 60 * 1000);
  }
  
  return alarmTimes;
}

// Periodic check to reschedule alarms (every hour)
// Only create if it doesn't exist
chrome.alarms.get('rescheduleCheck', (alarm) => {
  if (!alarm) {
    chrome.alarms.create('rescheduleCheck', { periodInMinutes: 60 });
  }
});

// Handle alarm triggers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  // Handle periodic reschedule check
  if (alarm.name === 'rescheduleCheck') {
    await updateAllAlarms();
    return;
  }
  
  // Handle reminder alarms
  // Extract reminder ID from alarm name
  const reminderId = alarm.name.split('_')[0];
  
  // Get the reminder from storage
  const result = await chrome.storage.local.get(['reminders']);
  const reminders = result.reminders || [];
  const reminder = reminders.find(r => r.id === reminderId);
  
  if (reminder) {
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'img/remindy_48x48.png',
      title: 'Reminder',
      message: reminder.name
    });
    
    // Reschedule alarms (to ensure we have alarms for future days)
    await updateAllAlarms();
  }
});

