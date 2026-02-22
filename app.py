import eel
import json
import os
import csv
import requests
from datetime import datetime
import tkinter as tk
from tkinter import filedialog

# Initialize Eel with the 'web' folder
eel.init('web')

DATA_DIR = 'data'
LINKS_FILE = os.path.join(DATA_DIR, 'links.json')
HISTORY_FILE = os.path.join(DATA_DIR, 'history.json')
TODO_FILE = os.path.join(DATA_DIR, 'todo.csv')
CHAT_HISTORY_FILE = os.path.join(DATA_DIR, 'chat_history.csv')

SETTINGS_FILE = os.path.join(DATA_DIR, 'settings.json')

# Default Settings
CURRENT_SETTINGS = {
    "user_name": "Cassius",
    "ai_name": "Evelyn",
    "system_prompt": "You are a cheerful API AI companion named Evelyn. Keep responses warm, encouraging, short (max 2 sentences), and cute.",
    "smtp_email": "",
    "smtp_password": ""
}

# Session history for Ollama context
chat_session = []

# --- Helper Functions ---

def load_json(filepath, default_value):
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return default_value
    return default_value

def save_json(filepath, data):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

def ensure_csv(filepath, headers):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    if not os.path.exists(filepath):
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(headers)

def append_csv(filepath, row):
    with open(filepath, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(row)

def read_csv(filepath):
    if not os.path.exists(filepath): return []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)

def overwrite_csv(filepath, headers, rows_dict):
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows_dict)

# --- Expose Functions ---

@eel.expose
def get_links():
    return load_json(LINKS_FILE, [])

@eel.expose
def save_link(title, url, icon_url):
    links = load_json(LINKS_FILE, [])
    links.append({
        "title": title,
        "url": url,
        "icon_url": icon_url
    })
    save_json(LINKS_FILE, links)
    return {"status": "success"}

@eel.expose
def save_mood(mood):
    history = load_json(HISTORY_FILE, [])
    history.append({
        "timestamp": datetime.now().isoformat(),
        "mood": mood
    })
    save_json(HISTORY_FILE, history)
    return {"status": "success"}

# TODO LOGIC
@eel.expose
def get_todos():
    return read_csv(TODO_FILE)

@eel.expose
def add_todo(task):
    if not task.strip(): return {"status": "error"}
    todos = read_csv(TODO_FILE)
    new_id = str(len(todos) + 1)
    append_csv(TODO_FILE, [new_id, task, "0"]) # 0 for incomplete, 1 for complete
    return {"status": "success"}

@eel.expose
def toggle_todo(todo_id):
    todos = read_csv(TODO_FILE)
    for t in todos:
        if t['ID'] == str(todo_id):
            t['Status'] = "1" if t['Status'] == "0" else "0"
            break
    overwrite_csv(TODO_FILE, ['ID', 'Task', 'Status'], todos)
    return {"status": "success"}

@eel.expose
def delete_todo(todo_id):
    todos = read_csv(TODO_FILE)
    todos = [t for t in todos if t['ID'] != str(todo_id)]
    overwrite_csv(TODO_FILE, ['ID', 'Task', 'Status'], todos)
    return {"status": "success"}

@eel.expose
def delete_link(url_to_delete):
    links = load_json(LINKS_FILE, [])
    links = [l for l in links if l.get('url') != url_to_delete]
    save_json(LINKS_FILE, links)
    return {"status": "success"}

@eel.expose
def clear_chat():
    global chat_session
    chat_session = [
        {
            "role": "system",
            "content": "You are a cheerful API AI companion named Evelyn. Keep responses warm, encouraging, short (max 2 sentences), and cute."
        }
    ]
    overwrite_csv(CHAT_HISTORY_FILE, ['Date', 'Time', 'Speaker', 'Message'], [])
    return {"status": "success"}

@eel.expose
def pick_file():
    root = tk.Tk()
    root.attributes("-topmost", True)
    root.withdraw()
    file_path = filedialog.askopenfilename(
        title="Select Executable",
        filetypes=(("Executables", "*.exe"), ("All files", "*.*"))
    )
    root.destroy()
    return file_path

# EVELYN AI LOGIC
def init_chat_session():
    """Initialises chat session with current settings"""
    global chat_session
    chat_session = [
        {
            "role": "system",
            "content": CURRENT_SETTINGS["system_prompt"]
        }
    ]

def load_chat_history():
    """Initialises chat session from existing CSV"""
    init_chat_session()
    history = read_csv(CHAT_HISTORY_FILE)
    for row in history[-20:]: # load last 20 messages for context bounds
        if row['Speaker'] == 'user':
            chat_session.append({"role": "user", "content": row['Message']})
        elif row['Speaker'] == CURRENT_SETTINGS['ai_name'] or row['Speaker'] == 'Evelyn':
            chat_session.append({"role": "assistant", "content": row['Message']})

@eel.expose
def get_settings():
    return CURRENT_SETTINGS

@eel.expose
def save_settings(new_settings):
    global CURRENT_SETTINGS
    CURRENT_SETTINGS.update(new_settings)
    save_json(SETTINGS_FILE, CURRENT_SETTINGS)
    init_chat_session() # Reapply system prompt
    return {"status": "success"}

@eel.expose
def launch_app(filepath):
    try:
        if os.path.exists(filepath):
            os.startfile(filepath)
            return {"status": "success"}
        return {"status": "error", "message": "File not found."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@eel.expose
def send_email(to_email, subject, body):
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    sender = CURRENT_SETTINGS.get("smtp_email")
    password = CURRENT_SETTINGS.get("smtp_password")
    
    if not sender or not password:
        return {"status": "error", "message": "SMTP credentials missing in Settings."}
    
    try:
        msg = MIMEMultipart()
        msg['From'] = sender
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        # Using Gmail SMTP as default assumption for personal use. 
        # App Passwords must be used for Gmail.
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender, password)
        server.send_message(msg)
        server.quit()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@eel.expose
def ask_evelyn(prompt):
    global chat_session
    
    # Save User message to CSV
    now = datetime.now()
    append_csv(CHAT_HISTORY_FILE, [now.strftime("%Y-%m-%d"), now.strftime("%H:%M:%S"), "user", prompt])
    
    chat_session.append({"role": "user", "content": prompt})
    
    url = "http://localhost:11434/api/chat"
    payload = {
        "model": "gemma3:4b",
        "messages": chat_session,
        "stream": False
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        ai_message = data.get("message", {"role": "assistant", "content": "I'm having trouble thinking right now!"})
        
        chat_session.append(ai_message)
        
        # Save AI message to CSV
        now2 = datetime.now()
        ai_name = CURRENT_SETTINGS['ai_name']
        append_csv(CHAT_HISTORY_FILE, [now2.strftime("%Y-%m-%d"), now2.strftime("%H:%M:%S"), ai_name, ai_message["content"]])
        
        return {"status": "success", "message": ai_message["content"]}
        
    except Exception as e:
        print(f"Error calling ollama: {e}")
        chat_session.pop() # Remove user msg on fail so it doesn't break future context
        return {"status": "error", "message": "Oops! Is Ollama open with gemma3:4b running? ✨"}

@eel.expose
def get_initial_chat():
    # Return last 5 chat messages so UI loads them
    history = read_csv(CHAT_HISTORY_FILE)
    return history[-5:]

def main():
    # Initialize files
    global CURRENT_SETTINGS
    os.makedirs(DATA_DIR, exist_ok=True)
    CURRENT_SETTINGS = load_json(SETTINGS_FILE, CURRENT_SETTINGS)
    save_json(SETTINGS_FILE, CURRENT_SETTINGS) # ensures file exists if it didn't
    
    if not os.path.exists(HISTORY_FILE): save_json(HISTORY_FILE, [])
    if not os.path.exists(LINKS_FILE): save_json(LINKS_FILE, [])
    ensure_csv(TODO_FILE, ['ID', 'Task', 'Status'])
    ensure_csv(CHAT_HISTORY_FILE, ['Date', 'Time', 'Speaker', 'Message'])

    load_chat_history()
    
    try:
        eel.start('index.html', size=(1200, 850), mode='chrome')
    except Exception as e:
        print("Chrome error, checking edge...")
        eel.start('index.html', size=(1200, 850), mode='edge')

if __name__ == '__main__':
    main()
