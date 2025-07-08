// Remindy Background Service Worker
class ReminderManager {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for alarm events
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });

    // Listen for extension installation
    chrome.runtime.onInstalled.addListener(() => {
      this.initializeExtension();
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });
  }

  async initializeExtension() {
    // Initialize default settings if needed
    const { reminders = [] } = await chrome.storage.local.get(['reminders']);
    if (reminders.length === 0) {
      await chrome.storage.local.set({ reminders: [] });
    }
  }

  async handleAlarm(alarm) {
    try {
      const reminders = await this.getReminders();
      let reminder;
      // Check if this is a snooze alarm
      if (alarm.name.endsWith('_snooze')) {
        const originalId = alarm.name.replace('_snooze', '');
        reminder = reminders.find(r => r.id === originalId);
      } else {
        reminder = reminders.find(r => r.id === alarm.name);
      }
      if (reminder) {
        // Show notification
        await this.showNotification(reminder);
        // Schedule next occurrence if it's a recurring reminder and not a snooze
        if (!alarm.name.endsWith('_snooze') && reminder.repeat && reminder.repeat.enabled) {
          await this.scheduleNextOccurrence(reminder);
        }
      }
    } catch (error) {
      console.error('Error handling alarm:', error);
    }
  }

  async showNotification(reminder) {
    const options = {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: reminder.title,
      message: reminder.description ? this.stripMarkdown(reminder.description) : 'Reminder',
      priority: 2,
      requireInteraction: true,
      buttons: [
        { title: 'Done' },
        { title: 'Snooze 5 min' }
      ]
    };
    await chrome.notifications.create(reminder.id, options);
  }

  stripMarkdown(text) {
    // Simple markdown stripping for notifications
    return text
      .replace(/[*_`~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/#+\s*/g, '')
      .substring(0, 200);
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'getReminders':
          const reminders = await this.getReminders();
          sendResponse({ success: true, data: reminders });
          break;
        case 'addReminder':
          const newReminder = await this.addReminder(request.reminder);
          sendResponse({ success: true, data: newReminder });
          break;
        case 'updateReminder':
          const updatedReminder = await this.updateReminder(request.reminder);
          sendResponse({ success: true, data: updatedReminder });
          break;
        case 'deleteReminder':
          await this.deleteReminder(request.id);
          sendResponse({ success: true });
          break;
        case 'toggleReminder':
          const toggledReminder = await this.toggleReminder(request.id);
          sendResponse({ success: true, data: toggledReminder });
          break;
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async getReminders() {
    const { reminders = [] } = await chrome.storage.local.get(['reminders']);
    return reminders;
  }

  async addReminder(reminderData) {
    const reminders = await this.getReminders();
    const newReminder = {
      id: this.generateId(),
      title: reminderData.title,
      description: reminderData.description || '',
      enabled: true,
      repeat: reminderData.repeat || { enabled: false },
      createdAt: new Date().toISOString(),
      ...reminderData
    };
    reminders.push(newReminder);
    await chrome.storage.local.set({ reminders });
    if (newReminder.enabled) {
      await this.scheduleReminder(newReminder);
    }
    return newReminder;
  }

  async updateReminder(reminderData) {
    const reminders = await this.getReminders();
    const index = reminders.findIndex(r => r.id === reminderData.id);
    if (index !== -1) {
      // Clear existing alarm
      await chrome.alarms.clear(reminderData.id);
      // Update reminder
      reminders[index] = { ...reminders[index], ...reminderData };
      await chrome.storage.local.set({ reminders });
      // Reschedule if enabled
      if (reminders[index].enabled) {
        await this.scheduleReminder(reminders[index]);
      }
      return reminders[index];
    }
    throw new Error('Reminder not found');
  }

  async deleteReminder(id) {
    const reminders = await this.getReminders();
    const filteredReminders = reminders.filter(r => r.id !== id);
    await chrome.storage.local.set({ reminders: filteredReminders });
    await chrome.alarms.clear(id);
  }

  async toggleReminder(id) {
    const reminders = await this.getReminders();
    const reminder = reminders.find(r => r.id === id);
    if (reminder) {
      reminder.enabled = !reminder.enabled;
      await chrome.storage.local.set({ reminders });
      if (reminder.enabled) {
        await this.scheduleReminder(reminder);
      } else {
        await chrome.alarms.clear(id);
      }
      return reminder;
    }
    throw new Error('Reminder not found');
  }

  async scheduleReminder(reminder) {
    // For recurring reminders
    if (reminder.repeat && reminder.repeat.enabled) {
      const nextTime = this.calculateNextOccurrence(reminder);
      if (nextTime) {
        try {
          await chrome.alarms.create(reminder.id, {
            when: nextTime
          });
        } catch (error) {
          console.error('Error creating alarm:', error);
        }
      }
    }
    // For one-time reminders, schedule for immediate notification (for testing)
    // In a real app, you might want to add a specific time field for one-time reminders
    else if (!reminder.repeat || !reminder.repeat.enabled) {
      const oneTimeAlarm = Date.now() + 60000; // 1 minute from now
      try {
        await chrome.alarms.create(reminder.id, {
          when: oneTimeAlarm
        });
      } catch (error) {
        console.error('Error creating one-time alarm:', error);
      }
    }
  }

  async scheduleNextOccurrence(reminder) {
    const nextTime = this.calculateNextOccurrence(reminder);
    if (nextTime) {
      await chrome.alarms.create(reminder.id, {
        when: nextTime
      });
    }
  }

  calculateNextOccurrence(reminder) {
    const now = new Date();
    const { repeat } = reminder;
    if (!repeat || !repeat.enabled) {
      return null;
    }
    const { intervalMinutes, startTime, endTime, days } = repeat;
    // Parse start and end times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    // Function to check if a day is allowed
    const isDayAllowed = (date) => {
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      if (days.type === 'specific') {
        return days.selected.includes(dayOfWeek);
      } else if (days.type === 'weekdays') {
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      } else if (days.type === 'weekends') {
        return dayOfWeek === 0 || dayOfWeek === 6;
      }
      return false;
    };
    // Function to check if time is within allowed hours
    const isTimeAllowed = (date) => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const totalMinutes = hours * 60 + minutes;
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      return totalMinutes >= startTotalMinutes && totalMinutes <= endTotalMinutes;
    };
    // Calculate the next occurrence based on proper intervals
    let nextTime = new Date(now);
    // If current time is before start time on a valid day, schedule for start time
    if (isDayAllowed(nextTime)) {
      const currentMinutes = nextTime.getHours() * 60 + nextTime.getMinutes();
      const startTotalMinutes = startHour * 60 + startMinute;
      if (currentMinutes < startTotalMinutes) {
        nextTime.setHours(startHour, startMinute, 0, 0);
        return nextTime.getTime();
      }
    }
    // Find the next valid occurrence by calculating proper intervals
    let attempts = 0;
    const maxAttempts = 10080; // 7 days in minutes
    while (attempts < maxAttempts) {
      // If we're on a valid day and within active hours, calculate the next interval
      if (isDayAllowed(nextTime) && isTimeAllowed(nextTime)) {
        // Calculate how many intervals have passed since start time
        const currentMinutes = nextTime.getHours() * 60 + nextTime.getMinutes();
        const startTotalMinutes = startHour * 60 + startMinute;
        const minutesSinceStart = currentMinutes - startTotalMinutes;
        // Calculate the next interval
        const intervalsPassed = Math.floor(minutesSinceStart / intervalMinutes);
        const nextIntervalStart = startTotalMinutes + (intervalsPassed + 1) * intervalMinutes;
        // Check if the next interval is still within active hours
        if (nextIntervalStart <= endHour * 60 + endMinute) {
          const nextTimeDate = new Date(nextTime);
          nextTimeDate.setHours(Math.floor(nextIntervalStart / 60), nextIntervalStart % 60, 0, 0);
          return nextTimeDate.getTime();
        }
      }
      // Move to the next day's start time
      nextTime.setDate(nextTime.getDate() + 1);
      nextTime.setHours(startHour, startMinute, 0, 0);
      // If we're not on a valid day, keep moving forward
      while (!isDayAllowed(nextTime)) {
        nextTime.setDate(nextTime.getDate() + 1);
      }
      attempts++;
    }
    return null; // No valid time found
  }

  generateId() {
    return 'reminder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Initialize the reminder manager
const reminderManager = new ReminderManager();

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // Done button - just clear the notification
    chrome.notifications.clear(notificationId);
  } else if (buttonIndex === 1) {
    // Snooze button - schedule another notification in 5 minutes
    chrome.notifications.clear(notificationId);
    chrome.alarms.create(notificationId + '_snooze', {
      when: Date.now() + 5 * 60 * 1000 // 5 minutes from now
    });
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.notifications.clear(notificationId);
}); 