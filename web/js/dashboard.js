// dashboard.js

// --- Global Utilities ---
const alarmAudio = document.getElementById('alarm-sound');

function attachSquashEffect(elements) {
    elements.forEach(el => {
        el.addEventListener('mousedown', () => el.classList.add('squish-active'));
        el.addEventListener('mouseup', () => el.classList.remove('squish-active'));
        el.addEventListener('mouseleave', () => el.classList.remove('squish-active'));
    });
}

// Configure Marked.js for Highlight.js
if (window.marked && window.hljs) {
    marked.setOptions({
        highlight: function (code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        },
        breaks: true
    });
}

function fireConfetti() {
    confetti({
        particleCount: 100, span: 70, origin: { y: 0.6 },
        colors: ['#A1C4FD', '#C2E9FB', '#fed6e3', '#fbc2eb']
    });
}

// --- 1. Date and Time ---
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString(undefined, options);
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('datetime').innerText = `${dateStr} • ${timeStr}`;

    // Check Alarm
    if (window.activeAlarm && timeStr.includes(window.activeAlarm)) {
        triggerAlarm();
    }
}
setInterval(updateDateTime, 1000);
updateDateTime();

const hour = new Date().getHours();
let greeting = "Good Morning";
if (hour >= 12 && hour < 17) greeting = "Good Afternoon";
else if (hour >= 17 && hour < 21) greeting = "Good Evening";
else if (hour >= 21) greeting = "Good Night";

async function updateGreetingUser() {
    const settings = await eel.get_settings()();
    document.getElementById('greeting').innerText = `${greeting}, ${settings.user_name}!`;
}
updateGreetingUser();

// --- 2. Links Portal ---
async function renderLinks() {
    const container = document.getElementById('links-container');
    const links = await eel.get_links()();

    container.innerHTML = '';
    links.forEach(link => {
        const wrapper = document.createElement('div');
        wrapper.className = 'link-bubble squash';

        const a = document.createElement('a');
        a.style.display = 'flex';
        a.style.alignItems = 'center';
        a.style.gap = '10px';
        a.style.flexGrow = '1';
        a.style.textDecoration = 'none';
        a.style.color = 'var(--text-dark)';

        const isApp = link.url.toLowerCase().endsWith('.exe');
        if (!isApp) {
            a.href = link.url;
            a.target = '_blank';
        } else {
            a.href = '#';
            a.addEventListener('click', async (e) => {
                e.preventDefault();
                await eel.launch_app(link.url)();
            });
        }

        if (link.icon_url && link.icon_url.startsWith('http')) {
            a.innerHTML = `<img src="${link.icon_url}" class="link-img-icon" alt="icon"> <span class="title">${link.title}</span>`;
        } else {
            a.innerHTML = `<span class="icon">${link.icon || '🔗'}</span> <span class="title">${link.title}</span>`;
        }

        const delBtn = document.createElement('button');
        delBtn.innerHTML = '✖';
        delBtn.className = 'delete-link-btn squash';
        delBtn.title = 'Remove';
        delBtn.style.marginLeft = 'auto';
        delBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('Remove this link?')) {
                await eel.delete_link(link.url)();
                renderLinks();
            }
        });

        wrapper.appendChild(a);
        wrapper.appendChild(delBtn);
        container.appendChild(wrapper);
    });
    attachSquashEffect(container.querySelectorAll('.squash'));
}

// Link Modal logic
const linkModal = document.getElementById('link-modal');
const browseExeBtn = document.getElementById('browse-exe-btn');
const linkUrlInput = document.getElementById('link-url');

document.getElementById('type-web').addEventListener('change', () => {
    browseExeBtn.classList.add('hidden');
    linkUrlInput.placeholder = "https://...";
});
document.getElementById('type-app').addEventListener('change', () => {
    browseExeBtn.classList.remove('hidden');
    linkUrlInput.placeholder = "C:\\Games\\game.exe";
});

browseExeBtn.addEventListener('click', async () => {
    const filePath = await eel.pick_file()();
    if (filePath) {
        linkUrlInput.value = filePath;
    }
});

document.getElementById('open-link-modal-btn').addEventListener('click', () => {
    linkModal.classList.remove('hidden');
});
document.getElementById('close-modal-btn').addEventListener('click', () => {
    linkModal.classList.add('hidden');
});
document.getElementById('save-link-btn').addEventListener('click', async () => {
    const title = document.getElementById('link-title').value;
    const url = linkUrlInput.value;
    const iconUrl = document.getElementById('link-icon').value;
    if (!title || !url) return alert("Title and Path/URL are required!");

    await eel.save_link(title, url, iconUrl)();
    document.getElementById('link-title').value = '';
    document.getElementById('link-url').value = '';
    document.getElementById('link-icon').value = '';
    linkModal.classList.add('hidden');
    renderLinks();
});

// Settings Modal
const settingsModal = document.getElementById('settings-modal');
document.getElementById('open-settings-btn')?.addEventListener('click', async () => {
    const s = await eel.get_settings()();
    document.getElementById('set-username').value = s.user_name || '';
    document.getElementById('set-ainame').value = s.ai_name || '';
    document.getElementById('set-prompt').value = s.system_prompt || '';
    document.getElementById('set-smtp-email').value = s.smtp_email || '';
    document.getElementById('set-smtp-pass').value = s.smtp_password || '';
    settingsModal.classList.remove('hidden');
});
document.getElementById('close-settings-btn')?.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});
document.getElementById('save-settings-btn')?.addEventListener('click', async () => {
    const changes = {
        user_name: document.getElementById('set-username').value,
        ai_name: document.getElementById('set-ainame').value,
        system_prompt: document.getElementById('set-prompt').value,
        smtp_email: document.getElementById('set-smtp-email').value,
        smtp_password: document.getElementById('set-smtp-pass').value
    };
    await eel.save_settings(changes)();
    settingsModal.classList.add('hidden');
    updateGreetingUser();

    // update chat header
    const h2 = document.querySelector('.ai-card h2');
    if (h2) h2.innerHTML = `Chat with ${changes.ai_name} 🌸`;
});

// Email Modal
const emailModal = document.getElementById('email-modal');
document.getElementById('open-email-btn')?.addEventListener('click', () => {
    emailModal.classList.remove('hidden');
});
document.getElementById('close-email-btn')?.addEventListener('click', () => {
    emailModal.classList.add('hidden');
});

// --- 3. Daily Focus ---
const focusInput = document.getElementById('daily-focus');
if (localStorage.getItem('manvi_focus')) focusInput.value = localStorage.getItem('manvi_focus');
focusInput.addEventListener('input', (e) => localStorage.setItem('manvi_focus', e.target.value));

// --- 4. To-Do List ---
async function renderTodos() {
    const list = document.getElementById('todo-list');
    const todos = await eel.get_todos()();
    list.innerHTML = '';

    todos.forEach(t => {
        const li = document.createElement('li');
        li.className = `todo-item ${t.Status === '1' ? 'todo-done' : ''}`;

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'todo-checkbox';
        cb.checked = t.Status === '1';
        cb.addEventListener('change', async () => {
            await eel.toggle_todo(t.ID)();
            if (cb.checked) fireConfetti();
            renderTodos();
        });

        const span = document.createElement('span');
        span.className = 'todo-text';
        span.innerText = t.Task;

        const delBtn = document.createElement('button');
        delBtn.innerHTML = '✖';
        delBtn.className = 'delete-todo-btn squash';
        delBtn.addEventListener('click', async () => {
            if (confirm('Delete this task?')) {
                await eel.delete_todo(t.ID)();
                renderTodos();
            }
        });

        li.appendChild(cb);
        li.appendChild(span);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}
document.getElementById('add-todo-btn').addEventListener('click', async () => {
    const input = document.getElementById('todo-input');
    if (!input.value.trim()) return;
    await eel.add_todo(input.value)();
    input.value = '';
    renderTodos();
});
document.getElementById('todo-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('add-todo-btn').click();
});


// --- 5. Mood Tracker ---
const moodResponses = {
    '😫': "Oh no! Take a deep breath. You're stronger than you think. 🫂",
    '😔': "I'm sorry you're feeling down. Sending you a big warm hug! 💛",
    '😐': "A neutral day is a calm day. Hope you find a tiny spark of joy soon! ✨",
    '😊': "Yay! Keep that beautiful smile going! 🌸",
    '🥰': "Aww, you're glowing! Keep spreading that amazing energy! 💖"
};

document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const mood = btn.getAttribute('data-mood');

        // Only fire confetti on positive moods
        if (mood === '😊' || mood === '🥰') {
            fireConfetti();
        }

        const responseText = moodResponses[mood] || "Noted your mood.";
        const responseEl = document.getElementById('mood-response');
        if (responseEl) {
            responseEl.style.opacity = 0;
            setTimeout(() => {
                responseEl.innerText = responseText;
                responseEl.style.opacity = 1;
                responseEl.style.transition = "opacity 0.3s ease";
            }, 100);
        }

        await eel.save_mood(mood)();
    });
});

// --- 6. Evelyn AI Chat ---
const chatWindow = document.getElementById('chat-window');
const chatInput = document.getElementById('chat-input');

function appendMessage(sender, text, timeStr) {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '2px';
    wrapper.style.maxWidth = '85%';

    if (sender === 'user') wrapper.style.alignSelf = 'flex-end';
    else wrapper.style.alignSelf = 'flex-start';

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-message`;
    msgDiv.style.maxWidth = '100%';
    msgDiv.style.overflowX = 'auto'; // Prevent pre tag blowout

    // Parse Markdown if marked is loaded
    if (window.marked) {
        msgDiv.innerHTML = marked.parse(text);
    } else {
        msgDiv.innerText = text;
    }

    // Use passed time or generate now()
    let t = timeStr;
    if (!t) {
        const d = new Date();
        t = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }

    const timeDiv = document.createElement('small');
    timeDiv.innerText = t;
    timeDiv.style.fontSize = '0.75rem';
    timeDiv.style.color = 'var(--text-light)';
    timeDiv.style.alignSelf = sender === 'user' ? 'flex-end' : 'flex-start';

    wrapper.appendChild(msgDiv);
    wrapper.appendChild(timeDiv);
    chatWindow.appendChild(wrapper);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function loadInitialChat() {
    const settings = await eel.get_settings()();
    const h2 = document.querySelector('.ai-card h2');
    if (h2) h2.innerHTML = `Chat with ${settings.ai_name} 🌸`;

    const history = await eel.get_initial_chat()();
    if (history.length === 0) {
        appendMessage('ai', `Hi ${settings.user_name}! I'm ${settings.ai_name}, your AI companion. 🌸 How are you today?`);
    } else {
        history.forEach(h => {
            // Trim seconds off the time from CSV for display (HH:MM:SS -> HH:MM)
            const shortTime = h.Time ? h.Time.substring(0, 5) : '';
            appendMessage(h.Speaker === 'user' ? 'user' : 'ai', h.Message, shortTime);
        });
    }
}

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    chatInput.value = '';

    const typingMsg = document.createElement('div');
    typingMsg.className = 'message ai-message';
    typingMsg.id = 'typing-indicator';
    typingMsg.innerHTML = '✨ <em>Thinking...</em>';
    chatWindow.appendChild(typingMsg);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    try {
        const response = await eel.ask_evelyn(text)();
        document.getElementById('typing-indicator')?.remove();
        appendMessage('ai', response.status === 'success' ? response.message : `Error: ${response.message}`);
    } catch (e) {
        document.getElementById('typing-indicator')?.remove();
        appendMessage('ai', 'Oops! Could not reach Ollama.');
    }
}
document.getElementById('send-btn').addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

document.getElementById('clear-chat-btn')?.addEventListener('click', async () => {
    if (confirm("Are you sure you want to clear Evelyn's memory of this conversation?")) {
        await eel.clear_chat()();
        chatWindow.innerHTML = '';
        appendMessage('ai', "Memory wiped! Let's start fresh. ✨");
    }
});


// --- 7. Utilities (Timer & Alarm) ---
// Timer logic
let timerInterval;
document.getElementById('timer-btn').addEventListener('click', () => {
    const mins = parseInt(document.getElementById('timer-input').value) || 0;
    if (mins <= 0) return;

    clearInterval(timerInterval);
    let seconds = mins * 60;

    timerInterval = setInterval(() => {
        seconds--;
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        document.getElementById('timer-display').innerText = `${m}:${s}`;

        if (seconds <= 0) {
            clearInterval(timerInterval);
            document.getElementById('timer-display').innerText = "00:00";
            triggerAlarm();
        }
    }, 1000);
});

// Alarm logic
window.activeAlarm = null;
document.getElementById('alarm-btn').addEventListener('click', () => {
    let timeVal = document.getElementById('alarm-input').value; // HH:MM (24h)
    if (!timeVal) return;

    // convert HH:MM 24h to 12h format simply to match toLocaleTimeString
    const [h, m] = timeVal.split(':');
    let hour12 = parseInt(h) % 12 || 12;
    const ampm = parseInt(h) >= 12 ? 'PM' : 'AM';

    // Simplistic string matching target
    window.activeAlarm = `${hour12.toString().padStart(2, '0')}:${m}`;
    document.getElementById('alarm-display').innerText = `${hour12}:${m} ${ampm}`;
});

document.getElementById('test-alarm-btn')?.addEventListener('click', () => {
    alarmAudio.currentTime = 0;
    alarmAudio.play().catch(e => console.log("Audio play blocked", e));
});

function triggerAlarm() {
    window.activeAlarm = null; // Prevent multi triggers
    document.getElementById('alarm-display').innerText = "Ringing!";
    alarmAudio.currentTime = 0;
    alarmAudio.play().catch(e => console.log("Audio play blocked", e));
    alert("⏰ Time is up! / Alarm ringing!");
}

// --- 8. AI Email Assistant ---
const emailPromptInput = document.getElementById('email-prompt');
const emailToInput = document.getElementById('email-to');
const emailSubjInput = document.getElementById('email-subj');
const emailBodyInput = document.getElementById('email-body');

document.getElementById('email-ai-btn')?.addEventListener('click', async () => {
    const p = emailPromptInput.value.trim();
    if (!p) return alert("Write a prompt for the AI to draft first!");

    emailBodyInput.value = "Generating... ✨";

    const req = `Draft an email with Subject and Body exactly based on this request: "${p}". Format as 'SUBJECT: [subject]\\n\\n[Body]'`;
    try {
        const response = await eel.ask_evelyn(req)();
        if (response.status === 'success') {
            const raw = response.message;
            // Crude parsing for subject vs body if AI played nice
            if (raw.includes("SUBJECT:")) {
                const parts = raw.split("\n\n");
                emailSubjInput.value = parts[0].replace("SUBJECT:", "").trim();
                emailBodyInput.value = parts.slice(1).join("\n\n").trim();
            } else {
                emailBodyInput.value = raw;
            }
        } else {
            emailBodyInput.value = "Failed to generate.";
        }
    } catch (e) {
        emailBodyInput.value = "Error connecting to AI.";
    }
});

document.getElementById('email-send-btn')?.addEventListener('click', async () => {
    const to = emailToInput.value.trim();
    const sub = emailSubjInput.value.trim();
    const body = emailBodyInput.value.trim();

    if (!to || !sub || !body) return alert("Please fill in To, Subject, and Body!");

    const origText = document.getElementById('email-send-btn').innerText;
    document.getElementById('email-send-btn').innerText = "Sending... 🚀";

    try {
        const res = await eel.send_email(to, sub, body)();
        if (res.status === 'success') {
            alert("Email sent successfully!");
            emailSubjInput.value = '';
            emailBodyInput.value = '';
            emailPromptInput.value = '';
        } else {
            alert("Failed to send: " + res.message);
        }
    } catch (e) {
        alert("Error invoking send.");
    }
    document.getElementById('email-send-btn').innerText = origText;
});

// Init Calls
attachSquashEffect(document.querySelectorAll('.squash'));
renderLinks();
renderTodos();
loadInitialChat();
