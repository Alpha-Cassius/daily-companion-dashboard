# Evelyn Extension: Your Personal AI Dashboard ✨

**Evelyn Extension** is a lightweight, local-first desktop application built with Python and Eel. It serves as a personal assistant and productivity hub, featuring a custom AI companion, task management, and quick-launch capabilities—all while keeping your data stored locally.

## 🚀 Features

* **Evelyn AI Companion**: Chat with a customizable AI (powered by Ollama and `gemma3:4b`).
* **Smart Bookmarks**: Save and manage your favorite web links or application shortcuts with custom icons.
* **Task Manager (To-Do)**: A persistent CSV-based task list to keep you on track.
* **Mood Tracking**: Log your daily mood to visualize your history.
* **System Integration**: You Try to integrate it.
* **App Launcher**: Select and launch `.exe` files directly from the dashboard.
* **Email Integration**: Send quick emails via SMTP (Gmail supported).


* **Local-First Storage**: Your chat history, tasks, and settings are saved as JSON and CSV files in the `/data` folder.

---

## 🛠️ Tech Stack

* **Frontend**: HTML/JS/CSS (served via **Eel**)
* **Backend**: **Python**
* **AI Engine**: **Ollama** (Running `gemma3:4b` or any compatible model)
* **Data Persistence**: JSON and CSV

---

## 📋 Prerequisites

Before running the application, ensure you have the following installed:

1. **Python 3.x**
2. **Ollama**: [Download Ollama here](https://ollama.com/).
* After installing, pull the required model:
```bash
ollama pull gemma3:4b

```




3. **Chrome or Edge**: The UI runs in app-mode using your installed browser.

---

## ⚙️ Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/evelyn-dashboard.git
cd evelyn-dashboard

```


2. **Install Python dependencies:**
```bash
pip install eel requests

```


3. **Project Structure:**
Ensure your directory looks like this:
```text
.
├── main.py            # The Python script provided
├── web/               # Folder for your HTML/CSS/JS files
│   └── index.html     # Main UI entry point
└── data/              # Automatically generated storage folder

```



---

## 🚀 Usage

1. Start the Ollama server (usually runs automatically in the background).
2. Run the application:
```bash
python main.py

```


3. **Settings**: Click on the settings icon in the UI to configure your **User Name**, **AI Persona**, and **SMTP credentials** for email functionality.

---

## 📁 Data Management

All data is stored in the `/data` directory:

* `links.json`: Your saved bookmarks.
* `history.json`: Logged mood entries.
* `todo.csv`: Your task list.
* `chat_history.csv`: Every interaction with Evelyn, timestamped and saved.
* `settings.json`: Your personalized configuration.

---

## ⚠️ Important Notes

* **Email Security**: To use the email feature with Gmail, you must use an **App Password**, as standard password login is blocked by Google for third-party apps.
* **Local API**: The AI features rely on the Ollama API running at `http://localhost:11434`.

---

MADE WITH LOVE AND COFFEE 
