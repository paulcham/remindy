// Reminder management UI
let reminders = [];
let editingId = null;

// Load reminders from storage
async function loadReminders() {
  const result = await chrome.storage.local.get(['reminders']);
  reminders = result.reminders || [];
  renderReminders();
}

// Save reminders to storage
async function saveReminders() {
  await chrome.storage.local.set({ reminders });
  renderReminders();
  // Notify background script to update alarms
  chrome.runtime.sendMessage({ action: 'updateAlarms', reminders });
}

// Render reminders list
function renderReminders() {
  const list = document.getElementById('remindersList');
  
  if (reminders.length === 0) {
    list.innerHTML = '<div class="empty-state">No reminders yet. Click "Add Reminder" to get started.</div>';
    return;
  }
  
  list.innerHTML = reminders.map(reminder => {
    const daysText = getDaysText(reminder.dateFrequency);
    const frequencyText = reminder.reminderFrequency === 60 
      ? 'Every hour' 
      : `Every ${reminder.reminderFrequency} minutes`;
    
    return `
      <div class="reminder-item">
        <div class="reminder-info">
          <div class="reminder-name">${escapeHtml(reminder.name)}</div>
          <div class="reminder-details">
            ${frequencyText} • ${formatTime(reminder.startTime)} - ${formatTime(reminder.endTime)}<br>
            ${daysText}
          </div>
        </div>
        <div class="reminder-actions">
          <button class="btn-icon edit" data-id="${reminder.id}" title="Edit">✏️</button>
          <button class="btn-icon delete" data-id="${reminder.id}" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
  
  // Attach event listeners
  document.querySelectorAll('.btn-icon.edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('.btn-icon').dataset.id;
      editReminder(id);
    });
  });
  
  document.querySelectorAll('.btn-icon.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('.btn-icon').dataset.id;
      deleteReminder(id);
    });
  });
}

// Get human-readable days text
function getDaysText(dateFrequency) {
  const daysMap = {
    'daily': 'Every day',
    'weekdays': 'Weekdays',
    'weekends': 'Weekends',
    'monday': 'Monday',
    'tuesday': 'Tuesday',
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
    'sunday': 'Sunday'
  };
  return daysMap[dateFrequency] || dateFrequency;
}

// Format time (HH:mm) to 12-hour format
function formatTime(time24) {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Open modal for adding/editing
function openModal(reminder = null) {
  const modal = document.getElementById('reminderModal');
  const form = document.getElementById('reminderForm');
  const title = document.getElementById('modalTitle');
  
  editingId = reminder ? reminder.id : null;
  
  if (reminder) {
    title.textContent = 'Edit Reminder';
    document.getElementById('reminderName').value = reminder.name;
    document.getElementById('startTime').value = reminder.startTime;
    document.getElementById('endTime').value = reminder.endTime;
    document.getElementById('reminderFrequency').value = reminder.reminderFrequency;
    document.getElementById('dateFrequency').value = reminder.dateFrequency;
  } else {
    title.textContent = 'Add Reminder';
    form.reset();
    // Set default values
    document.getElementById('startTime').value = '09:00';
    document.getElementById('endTime').value = '18:00';
    document.getElementById('reminderFrequency').value = '60';
  }
  
  modal.classList.add('active');
}

// Close modal
function closeModal() {
  const modal = document.getElementById('reminderModal');
  modal.classList.remove('active');
  editingId = null;
  document.getElementById('reminderForm').reset();
}

// Edit reminder
function editReminder(id) {
  const reminder = reminders.find(r => r.id === id);
  if (reminder) {
    openModal(reminder);
  }
}

// Delete reminder
async function deleteReminder(id) {
  if (confirm('Are you sure you want to delete this reminder?')) {
    reminders = reminders.filter(r => r.id !== id);
    await saveReminders();
  }
}

// Handle form submission
document.getElementById('reminderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('reminderName').value.trim();
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;
  const reminderFrequency = parseInt(document.getElementById('reminderFrequency').value);
  const dateFrequency = document.getElementById('dateFrequency').value;
  
  if (editingId) {
    // Update existing reminder
    const index = reminders.findIndex(r => r.id === editingId);
    if (index !== -1) {
      reminders[index] = {
        ...reminders[index],
        name,
        startTime,
        endTime,
        reminderFrequency,
        dateFrequency
      };
    }
  } else {
    // Add new reminder
    const newReminder = {
      id: Date.now().toString(),
      name,
      startTime,
      endTime,
      reminderFrequency,
      dateFrequency
    };
    reminders.push(newReminder);
  }
  
  await saveReminders();
  closeModal();
});

// Event listeners
document.getElementById('addReminderBtn').addEventListener('click', () => {
  openModal();
});

document.getElementById('closeModal').addEventListener('click', closeModal);

document.getElementById('cancelBtn').addEventListener('click', closeModal);

// Close modal when clicking outside
document.getElementById('reminderModal').addEventListener('click', (e) => {
  if (e.target.id === 'reminderModal') {
    closeModal();
  }
});

// Initialize
loadReminders();

