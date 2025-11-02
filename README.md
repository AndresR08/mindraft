# MinDraft — AI Email Assistant

MinDraft is a Chrome Extension that helps you generate, proofread, and polish emails directly in your browser. It uses the Gemini API to produce personalized responses and learns your writing style over time.

**Note:** This extension is focused on email composition, particularly in Gmail. It is a hackathon project, and the API key is configured in `background.js`.

---

## Features

### AI Text Generation
- Generate text based on your input and selected tone:  
  - **Formal** — professional responses  
  - **Casual** — friendly and approachable  
  - **Brief** — concise and direct  
- Automatic language detection: responds in English if the input is in English, Spanish if the input is in Spanish.

### Voice Input
- Dictate your prompt using your microphone.  
- One-click microphone button with live status.  
- Transcribes your speech and inserts it into the input box.

### Gmail Integration
- Paste AI-generated responses directly into Gmail compose windows.  
- Minimal setup required: just click "Use in Gmail".

### History & Style Memory
- Stores your last 10 prompts and responses.  
- Learns your writing style to improve AI suggestions.  
- Reset button to clear memory anytime.

### Minimalist UI
- Modern design with rounded elements, clear icons, and responsive layout.

---

## Installation Guide

1. Clone the repository:  
   ```bash
   git clone https://github.com/AndresR08/mindraft.git
Load as an unpacked extension in Chrome:

Open chrome://extensions/

Enable Developer Mode

Click Load unpacked and select the mindraft folder

Configure the Gemini API key:

Open background.js

Replace GEMINI_API_KEY with your personal API key from Google Gemini API

Usage
Open the MinDraft popup in Chrome.

Type or dictate your email text in the input box.

Select a tone (Formal, Casual, Brief).

Click Generate AI.

Copy the output or paste it directly into Gmail using Use in Gmail.

Check your history or reset your style memory at any time.

File Structure
php
Copiar código
mindraft/
├─ background.js        # Handles AI calls and tone/style logic
├─ content.js           # Inserts generated text into Gmail
├─ popup.html           # Extension popup UI
├─ popup.css            # Styling
├─ popup.js             # UI interactions, voice recognition, and history
├─ icon.png
└─ icons/
   ├─ clear.png
   ├─ copy.png
   ├─ icon128.png
   ├─ icon16.png
   ├─ icon32.png
   ├─ icon48.png
   ├─ logo.png
   ├─ mic.png
   ├─ reset.png
   └─ use.png
Limitations
Focused exclusively on emails, particularly Gmail.

Voice recognition works best in English (browser support may vary).

API key must be manually configured in background.js for security reasons.

License
This project is open source under the MIT License. See the LICENSE file for details.
