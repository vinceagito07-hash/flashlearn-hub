# FlashLearn Hub

A smart flashcard and quiz study app — HCI/UI/UX, OOP, Information Management,
Python, E-Commerce, Network Admin, and more.

---

## YOUR VS CODE FOLDER STRUCTURE

Your project folder must look exactly like this:

```
flashlearn-hub/
│
├── index.html              ← Open this in your browser
├── README.md               ← This guide
├── .gitignore              ← Git ignore rules
│
├── assets/
│   └── logo.jpg            ← App logo image
│
├── css/
│   └── style.css           ← All styles and 5 themes
│
└── js/
    ├── data.js             ← 415+ flashcard questions and answers
    └── app.js              ← All app functionality
```

IMPORTANT: Do NOT rename any file or folder.
The index.html references them by exact name.

---

## STEP 1 — SET UP VS CODE

1. Download VS Code from: https://code.visualstudio.com
2. Install and open it
3. Extract the ZIP file you downloaded
4. In VS Code: click File → Open Folder
5. Select the flashlearn-hub folder
6. You will see all files in the left Explorer panel

---

## STEP 2 — INSTALL LIVE SERVER EXTENSION

1. Click the Extensions icon on the left sidebar (4 squares)
2. Search: Live Server
3. Click Install on "Live Server" by Ritwick Dey

---

## STEP 3 — RUN THE APP

Option A — Live Server (recommended):
1. Right-click index.html in the Explorer panel
2. Click "Open with Live Server"
3. Browser opens at: http://127.0.0.1:5500

Option B — Direct open:
1. Go to the flashlearn-hub folder in File Explorer
2. Double-click index.html
3. Opens in your browser directly

---

## STEP 4 — INSTALL GIT

1. Go to: https://git-scm.com/downloads
2. Download and install Git for your OS
3. Open a terminal and verify:

   git --version

   You should see: git version 2.x.x

---

## STEP 5 — CONFIGURE GIT (one time only)

Open Terminal in VS Code (Terminal menu → New Terminal) and type:

   git config --global user.name "Your Full Name"
   git config --global user.email "your@email.com"

Press Enter after each line.

---

## STEP 6 — CREATE A GITHUB REPOSITORY

1. Go to https://github.com and sign in (create account if needed)
2. Click the + button (top right) → New repository
3. Fill in:
   - Repository name: flashlearn-hub
   - Description: Smart flashcard study app
   - Visibility: Public
   - Do NOT check "Add a README file"
4. Click Create repository
5. Keep the page open — you need the URL shown

---

## STEP 7 — PUSH YOUR CODE TO GITHUB

In the VS Code terminal, type these commands ONE BY ONE.
Press Enter after each line:

   git init

   git add .

   git commit -m "Initial commit: FlashLearn Hub"

   git branch -M main

   git remote add origin https://github.com/YOUR_USERNAME/flashlearn-hub.git

   git push -u origin main

IMPORTANT: Replace YOUR_USERNAME with your actual GitHub username.

---

## STEP 8 — AUTHENTICATE WITH GITHUB

When Git asks for a password, use a Personal Access Token:

1. Go to GitHub → click your profile photo (top right)
2. Click Settings
3. Scroll to bottom → click Developer settings
4. Click Personal access tokens → Tokens (classic)
5. Click Generate new token (classic)
6. Set:
   - Note: VS Code
   - Expiration: 90 days
   - Scopes: check "repo"
7. Click Generate token
8. COPY IT IMMEDIATELY (you will not see it again)
9. Paste it when Git asks for your password

---

## STEP 9 — VERIFY YOUR UPLOAD

Go to: https://github.com/YOUR_USERNAME/flashlearn-hub

You should see all your files listed there.

---

## STEP 10 — GET A FREE LIVE WEBSITE (GitHub Pages)

Make your app accessible to anyone online for free:

1. Go to your repository on GitHub
2. Click Settings tab (top of the repo page)
3. Click Pages in the left sidebar
4. Under Source:
   - Branch: main
   - Folder: / (root)
5. Click Save
6. Wait 1-2 minutes then refresh
7. Your site will be live at:

   https://YOUR_USERNAME.github.io/flashlearn-hub/

---

## UPDATING YOUR CODE LATER

After making changes in VS Code, run these in the terminal:

   git add .
   git commit -m "Describe what you changed"
   git push

GitHub Pages updates automatically within a minute.

---

## WHAT EACH FILE DOES

index.html   - Full page structure and all app pages
css/style.css - All visual styling, colors, 5 themes, animations
js/data.js   - 415+ flashcard Q&A across 7 subjects
js/app.js    - Quiz, flashcards, timer, notes, progress, navigation
assets/logo.jpg - App logo shown in the navbar
.gitignore   - Tells Git which files to skip
README.md    - This guide

---

## RECOMMENDED VS CODE EXTENSIONS

Live Server    - Preview with auto-refresh (Ritwick Dey)
Prettier       - Auto-format your code
GitLens        - See Git history inside VS Code
HTML CSS Support - Better autocomplete for HTML and CSS

---

## TROUBLESHOOTING

App shows blank page or broken layout:
  - Make sure folder structure matches exactly (css/, js/, assets/)
  - Open browser DevTools (F12) → Console tab to see errors
  - Use Live Server instead of double-clicking the file

Logo not showing:
  - Make sure assets/logo.jpg exists in the assets folder
  - File name must be exactly: logo.jpg

Git push asks for password repeatedly:
  - Use your Personal Access Token (Step 8 above)

GitHub Pages shows 404:
  - Wait 3-5 minutes after saving in Settings then refresh

---

## APP FEATURES

Flashcards    415+ cards across 7 subjects with spaced repetition
Quiz Mode     Multiple choice with instant feedback and scoring
Progress      Mastery %, streaks, and session history per deck
Focus Timer   Pomodoro / Short Break / Quick Drill / Deep Work
Quick Notes   Add, edit, and delete personal study notes
5 Themes      Light, Dark, Ocean, Forest, Sunset
Responsive    Works on desktop, tablet, and mobile
