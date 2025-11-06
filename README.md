🧠 CodeTrackr — VS Code Activity Tracker
Track your coding time, files, and productivity directly from VS Code — securely linked to your Gmail account and your CodeTrackr dashboard.
🚀 Overview

CodeTrackr is a VS Code extension that automatically tracks your coding activity, such as:

Which files and projects you’re working on

How long you spend coding

How many lines you’ve added or removed

What programming language you’re using

All this data is securely sent to your CodeTrackr backend, where it’s stored and visualized in your personal dashboard — tied to your Gmail login.

⚙️ How It Works

User logs into the CodeTrackr web app using Gmail (Google OAuth).

The website’s backend generates a unique API key linked to that Gmail account.

You paste that API key into VS Code (or it’s set automatically via login).

The VS Code extension tracks your coding activity and sends data securely to your backend using that API key.

The backend stores the data and links it to the correct Gmail account for your dashboard.

🧩 Features

✅ Automatically tracks active coding time
✅ Detects which file and language you’re using
✅ Captures lines added and removed
✅ Groups work by project and file
✅ Syncs data securely with backend via API key
✅ Connects your VS Code activity to your Gmail account
✅ Works offline — uploads when back online

🛠️ Installation
From VS Code

Open VS Code

Press Ctrl+P (Windows) or Cmd+P (Mac)

Type:

ext install codetrackr


or load it manually using development mode:

code --extensionDevelopmentPath="C:\Users\<YourName>\OneDrive\Desktop\CodeTrackr\extension"

🔑 Setup & Authentication

To link your Gmail account with your extension:

Visit your CodeTrackr Dashboard web app (e.g. https://codetrackr.vercel.app)

Log in using your Google (Gmail) account

After login, your backend will generate a personal API key for you

Copy this key

Open VS Code → Ctrl+Shift+P → search for “CodeTrackr Settings” → paste your key in the field:

{
  "codetrackr.apiKey": "your-api-key-here"
}


Now your extension knows who you are (via your Gmail-linked API key).

▶️ Commands
Command	Description
CodeTrackr: Start Tracking	Starts the background activity timer
CodeTrackr: Stop Tracking	Stops tracking your coding activity
CodeTrackr: Flush Now	Immediately uploads your current buffered activity to the backend

Access them via Command Palette (Ctrl+Shift+P) or the status bar.

🧠 Example Log Output

When active, your backend will receive data like:

{
  "timestamp": "2025-11-06T05:46:53.573Z",
  "fileName": "C:\\Users\\Soham\\Desktop\\CodeTrackr\\index.html",
  "fileType": ".html",
  "linesAdded": 12,
  "linesRemoved": 3,
  "projectName": "CodeTrackr",
  "duration": 5.25,
  "language": "html"
}


✅ The backend links this to your Gmail user automatically (through your API key).

🗄️ Backend Integration

Your backend (Node.js + MongoDB) receives and stores data at:

POST /api/user-activity

Example Payload
{
  "userId": "soham@gmail.com",
  "apiKey": "abcd1234",
  "timestamp": "2025-11-06T05:46:53.573Z",
  "fileName": "index.html",
  "fileType": ".html",
  "projectName": "CodeTrackr",
  "language": "html",
  "linesAdded": 5,
  "linesRemoved": 1,
  "duration": 0.75
}

Database Relation

Each record links to the correct Gmail account:

USERS (from Gmail login) <── userId ──> ACTIVITIES (from VS Code)

🧩 Configuration Options

These can be changed in VS Code Settings → Extensions → CodeTrackr:

Setting	Default	Description
codetrackr.apiBase	http://127.0.0.1:5050	Your backend API base URL
codetrackr.userId	Auto (username)	User ID or Gmail account
codetrackr.apiKey	""	Secure API key linked to Gmail account
codetrackr.flushIntervalSeconds	30	How often to send data to backend
codetrackr.minFlushMinutes	0.5	Minimum tracked time before upload
🧩 Folder Structure
CodeTrackr/
│
├── extension/
│   ├── extension.js        # Main extension logic
│   ├── package.json        # Extension metadata & commands
│   └── README.md           # (This file)
│
├── server/
│   └── server.js           # Backend API (Node + Express + MongoDB)
│
└── web/
    └── (Optional frontend dashboard)

🔒 Security Notes

API keys are unique per Gmail user

Activity data is private to each user

API requests use HTTPS (when deployed)

Backend validates every request with the API key before saving

🧰 Developer Setup

For local testing:

# 1️⃣ Start your backend
node server/server.js

# 2️⃣ Run VS Code extension in dev mode
code --extensionDevelopmentPath="C:\Users\<YourName>\Desktop\CodeTrackr\extension"


Now, open a file in VS Code → type → watch activity appear in backend logs.

❤️ Credits

Developed by Soham Budhewar
Built with:

🧩 Node.js + Express

🗄️ MongoDB + Mongoose

💻 VS Code Extension API

🔐 Google OAuth (Gmail Login)

📄 License

This project is licensed under the MIT License.
You are free to use, modify, and distribute it.
