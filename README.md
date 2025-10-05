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
├── package.json           # Electron app metadata
├── main.js                # Electron main process
├── renderer.js            # Electron renderer script
├── style/                 # CSS files directory for styling
├── config/                # Local configuration (created at runtime, ignored by git)
│   ├── config.example.json
│   └── user_config.json  
├── dist/                  # Electron build output (ignored)
└── README.md
```

---
## 📦 Download Latest Version

[![Download Latest](https://img.shields.io/github/v/release/gargshi/mini_ide?label=latest&color=blue)](https://github.com/gargshi/mini_ide/releases/latest)

👉 [**Click here to download the latest release**](https://github.com/gargshi/mini_ide/releases/latest)

### ⚙️ Installation




#### 1 Clone the repo
```bash
git clone https://github.com/gargshi/mini_ide.git
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

Use the `config/` folder for runtime settings. These are created at runtime when the released software is run for the first time.

The config folder contains files storing telemetry and keybindings in json format files.

---

### Version info

| Version | Description                              |
|---------|------------------------------------------|
|  1.0.0  | basic file handling                      |

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
