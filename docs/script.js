const startButton = document.getElementById('start-button');
const endButton = document.getElementById('end-button');
const timerDisplay = document.getElementById('timer-display');
const durationInput = document.getElementById('duration-input');
const timerEndMessage = document.getElementById('timer-end-message');
const settings = document.getElementById('settings');
const statisticsButton = document.getElementById('statistics-button');
const MAX_DURATION = 4 * 60;
const MIN_USER_SESSIONS = 1;
const MIN_SESSION_TIME = 0;

// Add event handler for statistics button
const statisticsOverlay = document.getElementById('statistics-overlay');

// Request permission on page load
if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
}

statisticsOverlay.addEventListener('click', function(e) {
    if (e.target === statisticsOverlay) {
        statisticsOverlay.style.display = 'none';
    }
});

statisticsButton.addEventListener('click', () => {
    statisticsOverlay.style.display = 'flex';
});

// Optional: Add a close button handler
const closeStatsButton = document.getElementById('close-stats-button');
if (closeStatsButton) {
    closeStatsButton.addEventListener('click', () => {
        statisticsOverlay.style.display = 'none';
    });
}
let timerRunning = false;
let intervalId = null;
let duration = 0;
let remaining = 0;

clearUserSessions();

startButton.addEventListener('click', () => {

    console.log('Start button clicked');

    if (timerRunning) {
        console.log('Timer is already running');
        return; // Exit if the timer is already running
    }

    // Convert input to number
    duration = Number(durationInput.value);
    console.log('Duration input value:', duration);

    // validate input
    if (!durationIsValid(duration)) {
        console.log('Invalid duration');
        return; // Stop the timer if duration is invalid
    }
    console.log('Valid duration:', duration);

    updateUIonStart();


    timerRunning = true; // Set the timer running state to true

    startTimer(duration);


});

function updateUIonStart() {
    // On Start, the state will be like this: the start button is clicked, 
    // and needs to be hidden, while the end button needs to be displayed.
    startButton.style.display = 'none';
    endButton.style.display = 'block';
    settings.style.display = 'none';

    timerEndMessage.style.display = 'none';

    // the timer display should be visible
    timerDisplay.style.display = 'block';

    
    durationInput.disabled = true;
    document.body.classList.add('dimmed');
}


function durationIsValid(duration) {

    // expect duration in seconds, hence convert seconds into minutes 
    // so it matches our constant

    // Check if duration is a positive number

    if (isNaN(duration)) {
        console.log('Duration is not a number');
        return false;
    }

    if (!Number.isInteger(duration)) {
        console.log('Duration is not an integer');
        return false;
    }

    if (duration <= 0 || (duration) > MAX_DURATION) {
        console.log('Duration is out of valid range');
        return false;
    }

    console.log('Duration is valid:', duration);
    return true;

}

function startTimer(duration) {
    console.log('Starting timer for duration:', duration);

    // convert to seconds
    remaining = duration * 60;
    updateTimerUI(remaining);

    intervalId = setInterval(() => {
        remaining--;
        updateTimerUI(remaining);

        if (remaining <= 0) {
            clearInterval(intervalId);
            timerRunning = false;
            durationInput.disabled = false;
            updateEndTimerUI("Time's up!");
            storeUserSession();

                        // Send browser notification
            if (Notification.permission === 'granted') {
                console.log('Sending notification');
                new Notification('Deep Work Session Complete!', {
                    body: 'Take a break and recharge!',
                });
            }
        }
    }, 1000);
}

endButton.addEventListener('click', () => {
    console.log('End button clicked');

    if (timerRunning) {

        storeUserSession();
        clearInterval(intervalId);
        timerRunning = false;
        durationInput.disabled = false;
        updateEndTimerUI("User ended the session!");
    } else {
        console.log("No active timer to end");
    }

});

function formatTime(duration) {

    // We expect Minutes, and want to display in HH:MM:SS format
    var hours = Math.floor(duration / 3600);
    var minutes = Math.floor((duration % 3600) / 60);
    var seconds = duration % 60;
    // Pad the minutes and seconds with leading zeros, if required
    hours = String(hours).padStart(2, '0');
    minutes = String(minutes).padStart(2, '0');
    seconds = String(seconds).padStart(2, '0');

    return hours + ':' + minutes + ':' + seconds;

}

function updateTimerUI(remaining) {
    timerDisplay.innerHTML = formatTime(remaining);
}

function updateEndTimerUI(endMessage) {
    timerEndMessage.innerText = endMessage;
    settings.style.display = '';
    endButton.style.display = 'none';
    startButton.style.display = 'block';
    timerDisplay.style.display = 'none';

    if (getNumOfUserSessions() > MIN_USER_SESSIONS) {
        statisticsButton.style.display = 'block';
    }
}

function storeUserSession() {
    // 1. We map the current date with the time the user took with the deep session, 
    // to generate statistics later. We will store this in local storage for now.

    if (duration <= 0) {
        console.log('Invalid duration. Session not stored.');
        return;
    }

    if ((duration*60) - remaining <= MIN_SESSION_TIME) {
        console.log('Invalid remaining time. Session not stored.');
        return;
    }


    
    const sessionData = {
        date: new Date().toISOString(),
        duration: (duration*60 - remaining)
    };

    console.log('Storing session data:', sessionData);

    // Get existing sessions from local storage
    const sessions = JSON.parse(localStorage.getItem('userSessions')) || [];
    sessions.push(sessionData);

    // Store updated sessions back to local storage
    localStorage.setItem('userSessions', JSON.stringify(sessions));
}


function printUserSessions() {
    // This function is for debugging purposes, to print the user sessions stored in local storage
    const sessions = JSON.parse(localStorage.getItem('userSessions')) || [];
    console.log('User Sessions:', sessions);
}

function aggregateUserDeepWork() {
    const sessions = JSON.parse(localStorage.getItem('userSessions')) || [];

}

function getNumOfUserSessions() {
    const sessions = JSON.parse(localStorage.getItem('userSessions')) || [];
    return sessions.length;
}

function clearUserSessions() {
    localStorage.removeItem('userSessions');
    console.log('User sessions cleared');
}

// --- Date Picker Logic ---
function getSessionDates() {
    const sessions = JSON.parse(localStorage.getItem('userSessions')) || [];
    // Map: { 'YYYY-MM': Set of days }
    const months = {};
    sessions.forEach(session => {
        const dateObj = new Date(session.date);
        const yearMonth = dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = dateObj.getDate();
        if (!months[yearMonth]) months[yearMonth] = new Set();
        months[yearMonth].add(day);
    });
    return months;
}

function getMonthStats(yearMonth) {
    const sessions = JSON.parse(localStorage.getItem('userSessions')) || [];
    // Map: { day: [session, ...] }
    const days = {};
    sessions.forEach(session => {
        const dateObj = new Date(session.date);
        const ym = dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0');
        if (ym === yearMonth) {
            const day = dateObj.getDate();
            if (!days[day]) days[day] = [];
            days[day].push(session);
        }
    });
    return days;
}

function getEarliestMonth(months) {
    return Object.keys(months).sort()[0];
}
function getLatestMonth(months) {
    return Object.keys(months).sort().slice(-1)[0];
}

function renderDatePicker(currentMonth) {
    const months = getSessionDates();
    const days = getMonthStats(currentMonth);
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthNum = today.getMonth() + 1;
    const currentDay = today.getDate();
    const [year, month] = currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const datePicker = document.getElementById('date-picker');
    datePicker.innerHTML = '';

    // Month navigation
    const navDiv = document.createElement('div');
    navDiv.className = 'month-nav';
    const monthsList = Object.keys(months).sort();
    const earliestMonth = getEarliestMonth(months);
    const latestMonth = getLatestMonth(months);
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '<';
    prevBtn.disabled = currentMonth === earliestMonth;
    prevBtn.onclick = () => renderDatePicker(monthsList[monthsList.indexOf(currentMonth)-1]);
    navDiv.appendChild(prevBtn);
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '>';
    nextBtn.disabled = currentMonth === latestMonth;
    nextBtn.onclick = () => renderDatePicker(monthsList[monthsList.indexOf(currentMonth)+1]);
    navDiv.appendChild(nextBtn);
    const monthLabel = document.createElement('span');
    monthLabel.textContent = `${year}-${String(month).padStart(2,'0')}`;
    navDiv.appendChild(monthLabel);
    datePicker.appendChild(navDiv);

    // Days grid
    const grid = document.createElement('div');
    grid.className = 'days-grid';
    for (let d = 1; d <= daysInMonth; d++) {
        const dayBtn = document.createElement('button');
        dayBtn.textContent = d;
        if (days[d]) {
            // Calculate total time for blue hue
            const totalTime = days[d].reduce((sum, s) => sum + s.duration, 0);
            const maxTime = 4*60*60; // 4 hours in seconds
            const blueIntensity = Math.min(1, totalTime / maxTime);
            dayBtn.style.background = `rgba(93, 173, 226, ${0.3 + 0.7*blueIntensity})`;
            dayBtn.className = 'day-enabled';
            dayBtn.onclick = () => renderStatsForDay(year, month, d);
            if (year === currentYear && month === currentMonthNum && d === currentDay) {
                dayBtn.classList.add('selected-day');
            }
        } else {
            dayBtn.className = 'day-disabled';
            dayBtn.disabled = true;
        }
        grid.appendChild(dayBtn);
    }
    datePicker.appendChild(grid);
}

function renderStatsForDay(year, month, day) {
    const sessions = JSON.parse(localStorage.getItem('userSessions')) || [];
    const statsDiv = document.getElementById('sessions-summary');
    const cardList = document.getElementById('session-card-list');
    statsDiv.innerHTML = '';
    cardList.innerHTML = '';
    // Filter sessions for this day
    const daySessions = sessions.filter(s => {
        const d = new Date(s.date);
        return d.getFullYear() === year && (d.getMonth()+1) === month && d.getDate() === day;
    });
    if (daySessions.length === 0) {
        statsDiv.textContent = 'No sessions for this day.';
        return;
    }
    // Total time
    const totalTime = daySessions.reduce((sum, s) => sum + s.duration, 0);
    statsDiv.textContent = `Total Deep Work: ${formatTime(totalTime)}`;
    // List sessions
    daySessions.forEach((s, i) => {
        const card = document.createElement('div');
        card.className = 'session-card';
        const start = new Date(s.date);
        card.innerHTML = `<strong>Session ${i+1}</strong>: ${start.toLocaleTimeString()} - ${formatTime(s.duration)}`;
        cardList.appendChild(card);
    });
}

// Initial render on statistics overlay open
statisticsButton.addEventListener('click', () => {
    statisticsOverlay.style.display = 'flex';
    const months = getSessionDates();
    const latestMonth = getLatestMonth(months);
    renderDatePicker(latestMonth);
    // Default to today
    const today = new Date();
    renderStatsForDay(today.getFullYear(), today.getMonth()+1, today.getDate());
});