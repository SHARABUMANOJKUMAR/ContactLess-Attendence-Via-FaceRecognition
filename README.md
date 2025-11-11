# FacePresence — Contactless Face Recognition Attendance System

FacePresence is a modern, fully client-side facial recognition attendance system built using:

- **Frontend:** React / TypeScript / Vite (Generated in Lovable)
- **UI Library:** shadcn-ui + TailwindCSS (Futuristic / Glassmorphism UI)
- **Face Recognition:** face-api.js (Browser-Based ML — No Server GPU Required)
- **Backend / Automation:** n8n workflow
- **Database:** Google Sheets (Cloud Spreadsheet Database)
- **Email Notifications:** Gmail API through n8n

This system allows users to **log in or register**, and then **mark attendance simply by showing their face**.  
No touch. No fingerprint. No app installation. No passwords.

---

## 🚀 Features

| Feature | Description |
|--------|-------------|
| Login / Registration | User enters Roll No, Name, Email |
| Camera Attendance Page | Automatically activates webcam and detects face |
| New User Auto Registration | New students get their face embedding saved to the database |
| Returning User Recognition | Face matched → Mark **Present**, Otherwise **Absent** |
| Cloud-Based Attendance Records | Stored in Google Sheets automatically |
| Email Notifications | User receives email confirmation of Present / Absent status |
| Fully Browser-Based Recognition | No backend ML model required |

---

## 🌐 Live Project Dashboard

**Lovable Project Workspace**  
https://lovable.dev/projects/af9228ba-2627-4356-a50c-bea634bb18a5

Use Lovable to update UI, generate pages, or make workflow-related UI changes.

---

## 🛠️ Local Development

You can also run or edit this project locally.

### Requirements
- Node.js + npm (Recommended install via `nvm`)
- Any IDE (VS Code recommended)

### Steps
```sh
# Clone the repo
git clone <YOUR_GIT_URL>

# Enter project folder
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start development server
npm run dev

Your project will now be available at:
http://localhost:5173

## 🔗 Backend / n8n Setup (Important)

This application communicates with your n8n workflow using a **POST request**:

POST http://localhost:5678/webhook/attendance

Make sure your n8n workflow is:

- ✅ **Activated**
- ✅ Connected with **Google Sheets Credential**
- ✅ Using the following **Sheet Tabs** (exact spelling required):
  - `Students`
  - `FaceEmbeddings`
  - `Attendance`

---

## 📦 Google Sheets Data Structure

### **Students Sheet**
Stores basic student information.
| RollNo | Name | Email |

### **FaceEmbeddings Sheet**
Stores each student's face embedding for recognition.
| RollNo | Model | VectorJson | CreatedAt |

### **Attendance Sheet**
Stores daily attendance logs.
| DateTime | RollNo | Status (Present / Absent) | Confidence |

---

## ✨ Editing the UI in Lovable

You can modify UI and logic easily through Lovable’s visual AI builder:

**Open Project:**  
https://lovable.dev/projects/af9228ba-2627-4356-a50c-bea634bb18a5

**How to edit:**
1. Use prompts to request changes (example: _“Add neon glow to camera frame”_)
2. Review generated updates
3. Approve → Changes automatically sync to your repo

---

## ✏ Editing Directly in GitHub

1. Select the file to edit
2. Click the **pencil (edit)** icon
3. Save & commit → Changes sync to Lovable automatically

---

## 🧑‍💻 Editing Locally (VS Code)

If you cloned the repo locally, simply modify code and:

git add .
git commit -m "update"
git push

Changes will sync back to Lovable.

---

## 🌍 Deployment

To publish:

Open Lovable → Share → Publish

To use your own domain:



Project → Settings → Domains → Connect Domain


---

## ✅ Status

This project is **production-ready** and can be used in:

- Schools
- Colleges
- Coaching Centers
- Training / Corporate Attendance Systems
- Labs / Library Entry Monitoring

---



