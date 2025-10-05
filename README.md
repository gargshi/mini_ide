## Mini IDE

**Mini IDE** is a lightweight, cross-platform code editor that blends the flexibility of Electron with the power of Python.  
It’s designed for quick scripting, prototyping, and learning — without the heavy overhead of full IDEs.

---

### Features

- **Multi-language support** (via Python backend)  
- **Built-in code execution** for Python scripts  
- **Auto-save and session restore**  
- **Minimal and distraction-free interface**  
- **Portable build support** — run directly from a ZIP or folder  
- **Electron + Python integration** for easy extension  

---

### Project Structure

```
mini-ide/
├── main.py                # Python backend for runtime / logic
├── package.json           # Electron app metadata
├── main.js                # Electron main process
├── preload.js             # Preload bridge for Python↔JS communication
├── renderer/              # Frontend UI (HTML, CSS, JS)
├── config/                # Local configuration
│   ├── config.example.json
│   └── user_config.json   # (ignored by git)
├── dist/                  # Electron build output (ignored)
└── README.md
```

---

### ⚙️ Installation

#### 1 Clone the repo
```bash
git clone https://github.com/yourusername/mini-ide.git
cd mini-ide
```

#### 2 Install Node dependencies
```bash
npm install
```

#### 3 Start the development build
```bash
npm start
```

Electron will start and automatically deploy the app.

---

### Packaging

To build your distributable app:

```bash
npm run build
```

This will generate:
- `.exe` (Windows Setup)
- `.zip` (portable edition)

Output goes to the `/dist/` folder (ignored in Git).

---

### Configuration

Use the `config/` folder for runtime settings.

| File | Description |
|------|--------------|
| `config.example.json` | Template file (safe to commit) |
| `user_config.json` | Actual user config (ignored by Git) |

Tip: copy `config.example.json` → `user_config.json` to set your local preferences.

---

### Developer Notes

- The `.gitignore` file is set to **protect sensitive info**, temporary data, and build artifacts.  
- Avoid committing your local config or environment files.  
- For portable use, keep your user data and configs within the app folder (outside version control).

---

### License

MIT License — you are free to use, modify, and distribute this software with proper attribution.

---

### Author

**Shivam Garg**  
Building tools that make code creation faster, simpler, and more personal.
