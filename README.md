# FlashLearn Hub

A smart, mobile-ready flashcard and quiz study app with login, custom subjects,
interactive type-answer mode, focus timer, progress tracking, and 5 themes.

---

## YOUR VS CODE FOLDER STRUCTURE

After extracting the ZIP, your project must look exactly like this:

```
flashlearn-hub/
│
├── index.html              ← Main app — open this in browser
├── README.md               ← This guide
├── .gitignore              ← Git ignore rules
│
├── assets/
│   └── logo.jpg            ← App logo (navbar)
│
├── css/
│   └── style.css           ← All styles, themes, responsive rules
│
└── js/
    ├── data.js             ← 415+ flashcard Q&A across 7 subjects
    └── app.js              ← All app logic
```

IMPORTANT: Do NOT rename any file or folder.
index.html links to them by exact name and path.

---

## STEP 1 — INSTALL VS CODE

1. Go to: https://code.visualstudio.com
2. Download for your OS (Windows / Mac / Linux)
3. Install and open VS Code

---

## STEP 2 — OPEN THE PROJECT IN VS CODE

1. Extract the ZIP file you downloaded
2. Open VS Code
3. Click: File → Open Folder
4. Select the flashlearn-hub folder
5. All files appear in the left Explorer panel

---

## STEP 3 — INSTALL LIVE SERVER EXTENSION

Required to view the app properly (logo and files load correctly).

1. Click the Extensions icon on the left sidebar (4 squares)
2. Search: Live Server
3. Click Install on "Live Server" by Ritwick Dey
4. Wait for installation

---

## STEP 4 — RUN THE APP

Option A — Live Server (recommended):
1. Right-click index.html in the Explorer panel
2. Click "Open with Live Server"
3. Browser opens at: http://127.0.0.1:5500

Option B — Direct open (logo may not show):
Double-click index.html in File Explorer

---

## STEP 5 — INSTALL GIT

1. Go to: https://git-scm.com/downloads
2. Download and install for your OS
3. Open a terminal and verify:

        git --version

   You should see: git version 2.x.x

---

## STEP 6 — CONFIGURE GIT (one time only)

Open Terminal in VS Code (Terminal menu → New Terminal) and run:

        git config --global user.name "Your Full Name"
        git config --global user.email "your@email.com"

Press Enter after each line.

---

## STEP 7 — CREATE A GITHUB REPOSITORY

1. Go to: https://github.com and sign in
2. Click the + button (top right) → New repository
3. Fill in:
   - Repository name: flashlearn-hub
   - Description: Smart flashcard study app
   - Visibility: Public (or Private)
   - Do NOT check "Add a README file"
4. Click Create repository
5. Keep the page open — you will need the URL

---

## STEP 8 — PUSH YOUR CODE TO GITHUB

In the VS Code terminal, type these commands ONE BY ONE.
Press Enter after each:

        git init

        git add .

        git commit -m "Initial commit: FlashLearn Hub"

        git branch -M main

        git remote add origin https://github.com/YOUR_USERNAME/flashlearn-hub.git

        git push -u origin main

REPLACE YOUR_USERNAME with your actual GitHub username.

---

## STEP 9 — AUTHENTICATE WITH GITHUB

When Git asks for a password, use a Personal Access Token:

1. Go to GitHub → click your profile photo (top right)
2. Click Settings
3. Scroll to bottom → click Developer settings
4. Click Personal access tokens → Tokens (classic)
5. Click Generate new token (classic)
6. Set:
   - Note: VS Code
   - Expiration: 90 days
   - Scopes: check repo
7. Click Generate token
8. COPY IT IMMEDIATELY (you will not see it again)
9. Paste it when Git asks for your password

---

## STEP 10 — VERIFY YOUR UPLOAD

Go to: https://github.com/YOUR_USERNAME/flashlearn-hub

You should see all your files listed.

---

## STEP 11 — DEPLOY AS A FREE LIVE WEBSITE (GitHub Pages)

1. Go to your repository on GitHub
2. Click Settings tab
3. Click Pages in the left sidebar
4. Under Source:
   - Branch: main
   - Folder: / (root)
5. Click Save
6. Wait 1-2 minutes, then refresh
7. Your app is live at:

        https://YOUR_USERNAME.github.io/flashlearn-hub/

---

## STEP 12 — UPDATE YOUR CODE LATER

After making changes in VS Code, run these in the terminal:

        git add .
        git commit -m "Describe what you changed"
        git push

GitHub Pages updates automatically within a minute.

---

## WHAT EACH FILE DOES

| File              | Purpose                                          |
|-------------------|--------------------------------------------------|
| index.html        | Full page structure and all app pages            |
| css/style.css     | All visual styling, 5 themes, responsive rules   |
| js/data.js        | 415+ flashcard questions across 7 subjects       |
| js/app.js         | Quiz, flashcards, timer, notes, auth, search     |
| assets/logo.jpg   | App logo shown in the navbar                     |
| .gitignore        | Tells Git which files to skip                    |
| README.md         | This guide                                       |

---

## RECOMMENDED VS CODE EXTENSIONS

| Extension           | Purpose                              |
|---------------------|--------------------------------------|
| Live Server         | Preview with auto-refresh            |
| Prettier            | Auto-format HTML, CSS, JS            |
| GitLens             | Visual Git history inside VS Code    |
| HTML CSS Support    | Better autocomplete                  |
| Path Intellisense   | Autocomplete file paths              |

---

## TROUBLESHOOTING

App shows blank page or broken layout:
  → Use Live Server instead of double-clicking index.html
  → Check browser DevTools (F12) → Console for errors

Logo not showing:
  → Must use Live Server (browser blocks local file loading)
  → Confirm assets/logo.jpg exists

Styles or scripts not loading:
  → Confirm folder names are exactly: css/ js/ assets/
  → File names are case-sensitive on Mac/Linux

Git push asks for password repeatedly:
  → Use your Personal Access Token (Step 9)

GitHub Pages shows 404:
  → Wait 3-5 minutes after saving Settings → refresh

---

## APP FEATURES

| Feature              | Description                                         |
|----------------------|-----------------------------------------------------|
| Login / Sign Up      | Account creation with email and password            |
| Flashcards (Flip)    | Classic flip-card with spaced repetition rating     |
| Flashcards (Type)    | Type your answer, auto-checked, self-rate           |
| Search               | Search questions across all subjects instantly      |
| Quiz Mode            | Multiple choice, 10/20/30 questions, instant score  |
| Focus Timer          | Pomodoro, Short Break, Quick Drill, Deep Work       |
| Quick Notes          | Add, edit, delete personal study notes              |
| My Content           | Create custom subjects and add your own questions   |
| Progress Tracking    | Mastery %, streaks, session history                 |
| 5 Themes             | Light, Dark, Ocean, Forest, Sunset                  |
| Mobile Ready         | Fully responsive on phone, tablet, desktop          |
