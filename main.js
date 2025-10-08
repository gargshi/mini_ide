

const { app, BrowserWindow, dialog, Menu, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;
// let configPath = path.join(app.getPath('userData'), 'config.json');
// const appDir = process.cwd(); // current working directory
const isAppPackaged = app.isPackaged;
const appDir = !isAppPackaged ? app.getAppPath() : path.dirname(process.execPath);
const configDir = path.join(appDir, "config");
if (!fs.existsSync(configDir)) {
	fs.mkdirSync(configDir);
}
const configPath = path.join(configDir, "config.json");
const keybindingsPath = path.join(configDir, "key-bindings.json");
console.log("Config path:", configPath);
console.log("Keybindings path:", keybindingsPath);

// Ensure config files exist
for (let path of [configPath, keybindingsPath]) {
	if (!fs.existsSync(path)) {
		console.log("Creating file:", path);
		fs.writeFileSync(path, "{}");
	}
}

fs.writeFileSync(
	path.join(path.dirname(process.execPath), "config_path_debug.txt"),
	`Config Path: ${configPath}\n
  Keybindings Path: ${keybindingsPath}\n
  Current Working Directory: ${process.cwd()}`
);

// Load config
function loadConfig() {
	try {
		return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
	} catch {
		return {};
	}
}
function loadKeybindings() {
	const defaults = {
		"saveFile": "CmdOrCtrl+S",
		"openFile": "CmdOrCtrl+O",
		"saveFileAs": "CmdOrCtrl+Shift+S",
		"openFolder": "CmdOrCtrl+K",
		"closeFile": "CmdOrCtrl+W",
		"newFile": "CmdOrCtrl+N",
		"deleteFile": "Delete",
	};
	try {
		if (!fs.existsSync(keybindingsPath)) {
			// Write defaults if file doesn't exist
			fs.writeFileSync(keybindingsPath, JSON.stringify(defaults, null, 2));
			return defaults;
		}
		const data = JSON.parse(fs.readFileSync(keybindingsPath, "utf-8"));
		// Merge defaults → ensures missing keys are added
		const merged = { ...defaults, ...data };
		// If merged has changes (user file missing keys), write back updated version
		if (JSON.stringify(merged) !== JSON.stringify(data)) {
			fs.writeFileSync(keybindingsPath, JSON.stringify(merged, null, 2));
		}
		return merged;
	} catch {
		console.error("Error loading keybindings:", err);
		// If JSON is corrupted, reset to defaults
		fs.writeFileSync(keybindingsPath, JSON.stringify(defaults, null, 2));
		return defaults;
	}
}
function watchKeybindings() {
	if (!fs.existsSync(keybindingsPath)) return;

	fs.watchFile(keybindingsPath, { interval: 500 }, () => {
		console.log("Keybindings updated, reloading menu");
		const newBindings = loadKeybindings();
		buildAppMenu(newBindings);
	});
}

// Save config
function saveConfig(cfg) {
	fs.writeFileSync(configPath, JSON.stringify(cfg));
}
// Save keybindings
function saveKeybindings(kb) {
	fs.writeFileSync(keybindingsPath, JSON.stringify(kb));
}
function matchesInput(input, accelerator) {
	const parts = accelerator.toLowerCase().split("+");
	const ctrl = parts.includes("cmdorctrl");
	const shift = parts.includes("shift");
	const alt = parts.includes("alt");
	const key = parts[parts.length - 1]; // last part is key

	return (
		(ctrl ? (input.control || input.meta) : true) &&
		(shift ? input.shift : true) &&
		(alt ? input.alt : true) &&
		input.key.toLowerCase() === key
	);
}

function buildAppMenu(keybindings) {
	const menu = Menu.buildFromTemplate([
		{
			label: "File",
			submenu: [
				{
					label: "New File",
					accelerator: keybindings.newFile,
					click: () => mainWindow.webContents.send("new-file")
				},
				{
					label: "Open",
					accelerator: keybindings.openFile,
					click: async () => {
						const { canceled, filePaths } = await dialog.showOpenDialog();
						if (!canceled && filePaths.length > 0) {
							const filePath = filePaths[0];
							const content = fs.readFileSync(filePath, "utf-8");
							mainWindow.webContents.send("file-opened", { content, filePath });
						}
					}
				},
				{
					label: "Save",
					accelerator: keybindings.saveFile,
					click: () => mainWindow.webContents.send("file-save")
				},
				{
					label: "Save As",
					accelerator: keybindings.saveFileAs,
					click: async () => {
						const { filePath } = await dialog.showSaveDialog();
						if (filePath) mainWindow.webContents.send("file-save-as", filePath);
					}
				},
				{
					label: "Open Folder",
					accelerator: keybindings.openFolder,
					click: async () => {
						const { canceled, filePaths } = await dialog.showOpenDialog({
							properties: ["openDirectory"]
						});
						if (!canceled && filePaths.length > 0) {
							const dirPath = filePaths[0];
							mainWindow.webContents.send("folder-opened", dirPath);
							saveConfig({ lastFolder: dirPath });
						}
					}
				}
			]
		},
		{
			label: "Settings",
			submenu: [
				{
					label: "Keybindings",
					click: () => {
						console.log("Menu: sending open-keybindings-tab");
						console.log("Main window load in progress:", mainWindow.webContents.isLoading());
						console.log(keybindingsPath);
						mainWindow.webContents.send("open-keybindings-tab", keybindingsPath);
					}
				}
			]
		}
	]);

	Menu.setApplicationMenu(menu);
}

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 900,
		height: 700,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	mainWindow.loadFile("index.html");

	const keybindings = loadKeybindings();
	mainWindow.webContents.on("before-input-event", (event, input) => {
		if (matchesInput(input, keybindings.closeFile)) {
			event.preventDefault();
			mainWindow.webContents.send("close-file");
		}
	});

	// Load last folder if exists
	const config = loadConfig();
	if (config.lastFolder && fs.existsSync(config.lastFolder)) {
		mainWindow.webContents.once("did-finish-load", () => {
			mainWindow.webContents.send("folder-opened", config.lastFolder);
		});
	}

	// Load keybindings and send to renderer

	buildAppMenu(keybindings);

	// Handle "request-save" (when renderer has no filePath yet)
	ipcMain.on("request-save", async (event, content) => {
		const { filePath } = await dialog.showSaveDialog();
		if (filePath) {
			fs.writeFileSync(filePath, content, "utf-8");
			event.sender.send("file-saved", filePath);
		}
	});

	ipcMain.on("opened-keybindings-tab", () => {
		// openKeybindingsWindow();
		console.log("recieved opened-keybindings-tab from renderer");
	})
	watchKeybindings();
}

app.whenReady().then(createWindow);

function openKeybindingsWindow() {
	const win = new BrowserWindow({
		width: 500,
		height: 400,
		title: "Keybindings",
		webPreferences: {
			// preload: path.join(__dirname, "preload.js")
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	win.loadFile(path.join(__dirname, "keybindings.html"));
}
