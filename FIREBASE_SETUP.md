# 🔥 Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to **Firebase Console**: https://console.firebase.google.com/
2. Click **"Add project"**
3. Enter project name: `snake-game` (or any name you like)
4. Disable Google Analytics (optional, not needed for this project)
5. Click **"Create project"**
6. Wait for project to be created

## Step 2: Set Up Realtime Database

1. In the left sidebar, click **"Build"** → **"Realtime Database"**
2. Click **"Create Database"**
3. Choose database location (select closest to your users):
   - `us-central1` (United States)
   - `europe-west1` (Belgium)
   - `asia-southeast1` (Singapore)
4. Select **"Start in test mode"** (we'll secure it later)
5. Click **"Enable"**

## Step 3: Get Your Firebase Configuration

1. Click the **gear icon** ⚙️ next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** `</>`
5. Register your app:
   - App nickname: `snake-game`
   - Don't check "Firebase Hosting"
   - Click **"Register app"**
6. **Copy the firebaseConfig object** - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

## Step 4: Update Your Code

1. Open `src/firebase.js`
2. **Replace the placeholder config** with your actual Firebase config:

```javascript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Replace this with YOUR config from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_ACTUAL_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_ACTUAL_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_ACTUAL_PROJECT",
  storageBucket: "YOUR_ACTUAL_PROJECT.appspot.com",
  messagingSenderId: "YOUR_ACTUAL_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
```

## Step 5: Set Database Rules (Security)

1. In Firebase Console, go to **Realtime Database**
2. Click the **"Rules"** tab
3. Replace the rules with this:

```json
{
  "rules": {
    "leaderboard": {
      ".read": true,
      ".write": true,
      "$scoreId": {
        ".validate": "newData.hasChildren(['name', 'score', 'date', 'timestamp', 'character'])"
      }
    }
  }
}
```

4. Click **"Publish"**

**Note:** These rules allow anyone to read/write. For production, you should add authentication.

## Step 6: Test Your Setup

1. Save all files
2. Run your dev server:
   ```bash
   npm run dev
   ```
3. Play the game and lose
4. Enter your name and click "Save Score"
5. Check Firebase Console → Realtime Database → Data tab
6. You should see your score appear!

## Step 7: Deploy to Vercel

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Add Firebase global leaderboard"
   git push
   ```

2. Vercel will automatically redeploy with Firebase!

## 🎉 Done!

Your leaderboard is now **global**! All players will see the same top scores.

## Troubleshooting

### Error: "Firebase: Error (auth/api-key-not-valid)"
- Check that you copied the ENTIRE firebaseConfig correctly
- Make sure there are no extra quotes or missing commas

### Scores not appearing
- Check Firebase Console → Realtime Database → Data
- Check browser console for errors (F12)
- Make sure database rules are set correctly

### "Permission denied" error
- Go to Database Rules and make sure `.read` and `.write` are both `true`

## Free Tier Limits

Firebase Free (Spark) Plan includes:
- ✅ 1GB stored data
- ✅ 10GB/month downloaded
- ✅ 100 simultaneous connections
- ✅ Perfect for your snake game!

## Next Steps (Optional)

- Add Firebase Authentication to prevent cheating
- Add rate limiting to prevent spam
- Add user profiles
- Track more stats (longest snake, games played, etc.)

---

**Need help?** Firebase docs: https://firebase.google.com/docs/database
