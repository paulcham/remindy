// Popup JavaScript for Remindy Extension
class ReminderPopup {
    constructor() {
        this.currentEditingId = null;
        this.reminders = [];
        this.initializeElements();
        this.setupEventListeners();
        this.loadReminders();
    }

    initializeElements() {
        // Main elements
        this.addReminderBtn = document.getElementById('addReminderBtn');
        this.reminderList = document.getElementById('reminderList');
        this.reminderForm = document.getElementById('reminderForm');
        this.reminderFormElement = document.getElementById('reminderFormElement');
        this.emptyState = document.getElementById('emptyState');
        this.formTitle = document.getElementById('formTitle');
        this.closeFormBtn = document.getElementById('closeFormBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.saveBtn = document.getElementById('saveBtn');

        // Form inputs
        this.reminderTitle = document.getElementById('reminderTitle');
        this.reminderDescription = document.getElementById('reminderDescription');
        this.repeatSettings = document.getElementById('repeatSettings');
        this.intervalMinutes = document.getElementById('intervalMinutes');
        this.startTime = document.getElementById('startTime');
        this.endTime = document.getElementById('endTime');
        this.specificDays = document.getElementById('specificDays');

        // Day selector elements
        this.dayTabs = document.querySelectorAll('.day-tab');
        this.dayButtons = document.querySelectorAll('.day-btn');

        // Template
        this.reminderTemplate = document.getElementById('reminderItemTemplate');
    }

    setupEventListeners() {
        // Main buttons
        this.addReminderBtn.addEventListener('click', () => this.showAddForm());
        this.closeFormBtn.addEventListener('click', () => this.hideForm());
        this.cancelBtn.addEventListener('click', () => this.hideForm());
        
        // Form submission
        this.reminderFormElement.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Day type tabs
        this.dayTabs.forEach(tab => {
            tab.addEventListener('click', () => this.selectDayType(tab.dataset.type));
        });
        
        // Day buttons
        this.dayButtons.forEach(button => {
            button.addEventListener('click', () => this.toggleDay(button));
        });
    }

    async loadReminders() {
        try {
            const response = await this.sendMessage({ action: 'getReminders' });
            if (response.success) {
                this.reminders = response.data;
                this.renderReminders();
            }
        } catch (error) {
            console.error('Error loading reminders:', error);
        }
    }

    renderReminders() {
        // Clear existing reminders
        this.reminderList.innerHTML = '';

        if (this.reminders.length === 0) {
            this.reminderList.appendChild(this.emptyState);
            return;
        }

        // Render each reminder
        this.reminders.forEach(reminder => {
            const reminderElement = this.createReminderElement(reminder);
            this.reminderList.appendChild(reminderElement);
        });
    }

    createReminderElement(reminder) {
        const template = this.reminderTemplate.content.cloneNode(true);
        const reminderItem = template.querySelector('.reminder-item');
        
        // Set data attributes
        reminderItem.dataset.id = reminder.id;
        
        // Set title
        const titleElement = template.querySelector('.reminder-title');
        titleElement.textContent = reminder.title;
        
        // Set description
        const descriptionElement = template.querySelector('.reminder-description');
        if (reminder.description) {
            descriptionElement.innerHTML = this.renderMarkdown(reminder.description);
        } else {
            descriptionElement.style.display = 'none';
        }
        
        // Set toggle
        const toggleElement = template.querySelector('.reminder-toggle');
        toggleElement.checked = reminder.enabled;
        toggleElement.addEventListener('change', () => this.toggleReminder(reminder.id));
        
        // Set schedule info
        const scheduleElement = template.querySelector('.schedule-info');
        if (reminder.repeat && reminder.repeat.enabled) {
            scheduleElement.textContent = this.formatSchedule(reminder.repeat);
        } else {
            scheduleElement.textContent = 'One-time reminder';
        }
        
        // Set status badge
        const statusElement = template.querySelector('.status-badge');
        statusElement.textContent = reminder.enabled ? 'Active' : 'Inactive';
        statusElement.className = `status-badge ${reminder.enabled ? 'active' : 'inactive'}`;
        
        // Set up action buttons
        const editBtn = template.querySelector('.edit-btn');
        const deleteBtn = template.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', () => this.editReminder(reminder));
        deleteBtn.addEventListener('click', () => this.deleteReminder(reminder.id));
        
        return template;
    }

    renderMarkdown(text) {
        // First, escape HTML entities to prevent XSS
        const escapeHtml = (unsafe) => {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };
        
        // Escape the input text first
        const safeText = escapeHtml(text);
        
        // Simple markdown rendering on the escaped text
        return safeText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/^# (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h4>$1</h4>')
            .replace(/\n/g, '<br>');
    }

    formatSchedule(repeat) {
        const { intervalMinutes, startTime, endTime, days } = repeat;
        const interval = intervalMinutes < 60 ? `${intervalMinutes}m` : `${Math.floor(intervalMinutes/60)}h`;
        
        let dayText = '';
        if (days.type === 'weekdays') {
            dayText = 'weekdays';
        } else if (days.type === 'weekends') {
            dayText = 'weekends';
        } else if (days.type === 'specific') {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dayText = days.selected.map(d => dayNames[d]).join(', ');
        }
        
        return `Every ${interval} on ${dayText}, ${startTime}-${endTime}`;
    }

    showAddForm() {
        this.currentEditingId = null;
        this.formTitle.textContent = 'Add New Reminder';
        this.resetForm();
        this.reminderForm.classList.remove('hidden');
    }

    showEditForm(reminder) {
        this.currentEditingId = reminder.id;
        this.formTitle.textContent = 'Edit Reminder';
        this.populateForm(reminder);
        this.reminderForm.classList.remove('hidden');
    }

    hideForm() {
        this.reminderForm.classList.add('hidden');
        this.currentEditingId = null;
        this.resetForm();
    }

    resetForm() {
        this.reminderFormElement.reset();
        this.intervalMinutes.value = 60;
        this.startTime.value = '09:00';
        this.endTime.value = '18:00';
        this.selectDayType('weekdays');
        this.clearSelectedDays();
    }

    populateForm(reminder) {
        this.reminderTitle.value = reminder.title;
        this.reminderDescription.value = reminder.description || '';
        if (reminder.repeat && reminder.repeat.enabled) {
            this.intervalMinutes.value = reminder.repeat.intervalMinutes;
            this.startTime.value = reminder.repeat.startTime;
            this.endTime.value = reminder.repeat.endTime;
            this.selectDayType(reminder.repeat.days.type);
            if (reminder.repeat.days.type === 'specific') {
                this.setSelectedDays(reminder.repeat.days.selected);
            }
        }
    }

    selectDayType(type) {
        // Update tabs
        this.dayTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === type);
        });
        
        // Show/hide specific days
        if (type === 'specific') {
            this.specificDays.classList.remove('hidden');
        } else {
            this.specificDays.classList.add('hidden');
            this.clearSelectedDays();
        }
    }

    toggleDay(button) {
        button.classList.toggle('active');
    }

    clearSelectedDays() {
        this.dayButtons.forEach(button => {
            button.classList.remove('active');
        });
    }

    setSelectedDays(selectedDays) {
        this.clearSelectedDays();
        selectedDays.forEach(day => {
            const button = document.querySelector(`[data-day="${day}"]`);
            if (button) {
                button.classList.add('active');
            }
        });
    }

    getSelectedDays() {
        const selected = [];
        this.dayButtons.forEach(button => {
            if (button.classList.contains('active')) {
                selected.push(parseInt(button.dataset.day));
            }
        });
        return selected;
    }

    getSelectedDayType() {
        const activeTab = document.querySelector('.day-tab.active');
        return activeTab ? activeTab.dataset.type : 'weekdays';
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        const reminderData = this.getFormData();
        
        try {
            let response;
            if (this.currentEditingId) {
                response = await this.sendMessage({
                    action: 'updateReminder',
                    reminder: { ...reminderData, id: this.currentEditingId }
                });
            } else {
                response = await this.sendMessage({
                    action: 'addReminder',
                    reminder: reminderData
                });
            }

            if (response.success) {
                this.hideForm();
                this.loadReminders();
            } else {
                alert('Error saving reminder: ' + response.error);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error saving reminder. Please try again.');
        }
    }

    validateForm() {
        const title = this.reminderTitle.value.trim();
        if (!title) {
            alert('Please enter a title for the reminder.');
            this.reminderTitle.focus();
            return false;
        }
        const interval = parseInt(this.intervalMinutes.value);
        if (!interval || interval < 1 || interval > 1440) {
            alert('Please enter a valid interval (1-1440 minutes).');
            this.intervalMinutes.focus();
            return false;
        }
        const startTime = this.startTime.value;
        const endTime = this.endTime.value;
        if (!startTime || !endTime) {
            alert('Please select start and end times.');
            return false;
        }
        if (startTime >= endTime) {
            alert('End time must be after start time.');
            this.endTime.focus();
            return false;
        }
        const dayType = this.getSelectedDayType();
        if (dayType === 'specific') {
            const selectedDays = this.getSelectedDays();
            if (selectedDays.length === 0) {
                alert('Please select at least one day for specific day scheduling.');
                return false;
            }
        }
        // Additional validation: check if interval makes sense with time window
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const timeWindowMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        if (interval > timeWindowMinutes) {
            alert(`Interval (${interval} minutes) is longer than the active time window (${timeWindowMinutes} minutes). Please adjust either the interval or the active hours.`);
            return false;
        }
        return true;
    }

    getFormData() {
        const dayType = this.getSelectedDayType();
        const selectedDays = dayType === 'specific' ? this.getSelectedDays() : [];
        return {
            title: this.reminderTitle.value.trim(),
            description: this.reminderDescription.value.trim(),
            repeat: {
                enabled: true,
                intervalMinutes: parseInt(this.intervalMinutes.value),
                startTime: this.startTime.value,
                endTime: this.endTime.value,
                days: {
                    type: dayType,
                    selected: selectedDays
                }
            }
        };
    }

    async toggleReminder(id) {
        try {
            const response = await this.sendMessage({
                action: 'toggleReminder',
                id: id
            });

            if (response.success) {
                this.loadReminders();
            } else {
                alert('Error toggling reminder: ' + response.error);
            }
        } catch (error) {
            console.error('Error toggling reminder:', error);
            alert('Error toggling reminder. Please try again.');
        }
    }

    editReminder(reminder) {
        this.showEditForm(reminder);
    }

    async deleteReminder(id) {
        if (!confirm('Are you sure you want to delete this reminder?')) {
            return;
        }

        try {
            const response = await this.sendMessage({
                action: 'deleteReminder',
                id: id
            });

            if (response.success) {
                this.loadReminders();
            } else {
                alert('Error deleting reminder: ' + response.error);
            }
        } catch (error) {
            console.error('Error deleting reminder:', error);
            alert('Error deleting reminder. Please try again.');
        }
    }

    sendMessage(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });
    }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ReminderPopup();
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const form = document.getElementById('reminderForm');
        if (!form.classList.contains('hidden')) {
            form.classList.add('hidden');
        }
    }
}); 