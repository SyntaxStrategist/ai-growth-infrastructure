# How to Run Your Demo Form - Server Guide

**Last Updated:** October 22, 2025  
**Purpose:** Start local server for demo contact forms  
**Time Required:** 30 seconds

---

## 🎯 Quick Start (3 Steps)

### **Step 1: Open Terminal**

**On Mac:**
1. Press `Cmd + Space` (opens Spotlight)
2. Type: `Terminal`
3. Press `Enter`

**You'll see a black or white window with text.**

---

### **Step 2: Navigate to Your Project**

**Copy and paste this command into Terminal:**

```bash
cd /Users/michaeloni/ai-growth-infrastructure
```

**Press `Enter`**

**What this does:** Moves to the folder where your demo forms are stored.

---

### **Step 3: Start the Server**

**Copy and paste this command:**

```bash
python3 -m http.server 8000
```

**Press `Enter`**

**You'll see:**
```
Serving HTTP on :: port 8000 (http://[::]:8000/) ...
```

✅ **Server is running!**

---

## 🌐 Open Your Demo Forms

**Now that the server is running, open these URLs in Chrome:**

### **English Form:**
```
http://localhost:8000/DEMO_CONTACT_FORM_EN.html
```

### **French Form:**
```
http://localhost:8000/DEMO_CONTACT_FORM_FR.html
```

**Bookmark these URLs for easy access during demos!**

---

## ✅ Test the Form

1. Fill out the form with test data:
   - Name: `Test Lead`
   - Email: `test@example.com`
   - Message: `I need framing and drywall for a retail project. High urgency.`

2. Click **"Send Message"**

3. You should see: ✅ **"Thank you! Your message has been sent."**

4. Go to your dashboard: `https://www.aveniraisolutions.ca/en/client/dashboard`

5. Refresh the page

6. **Your test lead should appear with AI analysis!**

---

## ⏹️ How to Stop the Server

**When you're done with demos:**

1. Go back to Terminal (where the server is running)
2. Press `Ctrl + C`
3. Server stops

**You'll see the prompt return:**
```
michaeloni@Michaels-MacBook ai-growth-infrastructure %
```

✅ **Server is stopped.**

---

## 🔄 How to Restart the Server

**Next time you need to do a demo:**

1. Open Terminal
2. Run these 2 commands:
   ```bash
   cd /Users/michaeloni/ai-growth-infrastructure
   python3 -m http.server 8000
   ```
3. Open the bookmarked URL in Chrome
4. Form works again!

---

## 📋 Common Issues & Solutions

### **Issue 1: "Address already in use"**

**Error message:**
```
OSError: [Errno 48] Address already in use
```

**Debug Steps:**

**Step 1: Check what's using port 8000**
```bash
lsof -ti:8000
```
This shows what process is using the port.

**Step 2: Kill the process using port 8000**
```bash
lsof -ti:8000 | xargs kill -9
```
This frees up port 8000.

**Step 3: Try starting the server again**
```bash
python3 -m http.server 8000
```

**Alternative Solution:** Use a different port
```bash
python3 -m http.server 8001
```
Then use: `http://localhost:8001/DEMO_CONTACT_FORM_EN.html`

---

### **Issue 2: "python3: command not found"**

**Solution:** Use `python` instead:
```bash
python -m http.server 8000
```

---

### **Issue 3: Form still shows CORS error**

**Causes:**
1. Server not running → Check Terminal, restart server
2. Wrong URL → Make sure you're using `http://localhost:8000/...` not opening file directly
3. API key not set → Check line 118 in the HTML file

---

### **Issue 4: Lead not appearing in dashboard**

**Checklist:**
1. ✅ API key is correct (check line 118)
2. ✅ Server is running (`http://localhost:8000`)
3. ✅ Form submitted successfully (green success message)
4. ✅ Dashboard refreshed
5. ✅ Using the correct client account

---

## 🎬 For Your Sales Demos

### **Before the Demo:**
1. Start the server (30 seconds)
2. Open form URL in Chrome
3. Bookmark it
4. Open your dashboard in another tab
5. Ready to demo!

### **During the Demo:**
1. Screen share Chrome
2. Show the form
3. Fill it out live (or use pre-filled example)
4. Click Submit
5. Switch to dashboard tab
6. Refresh → Show the lead appearing
7. Show AI analysis (intent, tone, urgency, confidence)

### **After the Demo:**
1. Close Chrome tabs
2. Leave server running if doing more demos today
3. Stop server when done for the day

---

## 🔑 Quick Reference

### **Start Server:**
```bash
cd /Users/michaeloni/ai-growth-infrastructure
python3 -m http.server 8000
```

### **Stop Server:**
```bash
Ctrl + C
```

### **Form URLs:**
```
English: http://localhost:8000/DEMO_CONTACT_FORM_EN.html
French:  http://localhost:8000/DEMO_CONTACT_FORM_FR.html
```

### **Your Dashboard:**
```
https://www.aveniraisolutions.ca/en/client/dashboard
```

---

## 💡 Pro Tips

### **Tip 1: Keep Terminal Window Open**
- Don't close Terminal while demoing
- Minimize it instead
- Server needs to stay running

### **Tip 2: Bookmark the URLs**
- Saves time during demos
- Open bookmark → Form loads instantly

### **Tip 3: Use Incognito for Tests**
- Cmd + Shift + N (Chrome Incognito)
- Prevents caching issues
- Clean slate for each test

### **Tip 4: Pre-Fill Example Data**
- Have example text ready to copy-paste
- Faster during live demos
- Looks more professional

---

## ✅ You're Ready!

**Everything you need:**
- ✅ Demo forms created
- ✅ API key added
- ✅ Server running
- ✅ URLs bookmarked
- ✅ Ready to demo

**Now go test it:**
1. Open `http://localhost:8000/DEMO_CONTACT_FORM_EN.html`
2. Fill out the form
3. Submit
4. Check your dashboard
5. See the magic happen! ✨

---

**Questions?** The form should now work perfectly. If you still see CORS errors, the server isn't running or you're using the wrong URL.

---

**Created By:** Avenir AI Solutions  
**Last Updated:** October 22, 2025  
**Status:** ✅ Ready to Use

