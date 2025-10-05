const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

const STATUS_TIMEOUT_DEFAULT_MS = 3000; // 3 seconds

const editor = document.getElementById("editor");
const sidebar = document.getElementById("sidebar");
const tabs = document.getElementById("tabs");
const statusbar = document.getElementById("statusbar");

// updateCursorPosition();

let openFiles = {}; // { filePath: { content, dirty, untitled } }
let activeFilePath = null;
let newFileCounter = 1;
let selectedPath = null; // for sidebar selection
let expandedFolders = new Set();


const folderIcon_open = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
  <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
</svg>
`;

const folderIcon_closed = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
  <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
</svg>
`;

const genericFileIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
  <path d="M6 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6zm7 1.5L18.5 9H13V3.5z"/>
</svg>
`;

// ===== Tabs =====
function renderTabs() {
	tabs.innerHTML = "";
	for (const filePath in openFiles) {
		const file = openFiles[filePath];
		const tab = document.createElement("div");
		tab.className = "tab" + (filePath === activeFilePath ? " active" : "");

		// Tab title: * for dirty, base name or untitled label
		let title = file.untitled ? filePath : path.basename(filePath);
		if (file.dirty) title = "*" + title;
		tab.textContent = title;

		// Close button
		const closeBtn = document.createElement("span");
		closeBtn.textContent = " ❌";
		closeBtn.className = "close";
		closeBtn.onclick = (e) => {
			e.stopPropagation();
			closeTab(filePath);
		};
		tab.appendChild(closeBtn);

		tab.onclick = () => switchTab(filePath);
		tabs.appendChild(tab);
	}
}

function switchTab(filePath) {
	activeFilePath = filePath;
	editor.value = openFiles[filePath].content;
	document.title = `Mini IDE - ${filePath}`;
	renderTabs();
	updateCursorPosition();
}

function closeTab(filePath) {
	delete openFiles[filePath];
	if (activeFilePath === filePath) {
		const remaining = Object.keys(openFiles);
		if (remaining.length > 0) {
			switchTab(remaining[0]);
		} else {
			activeFilePath = null;
			editor.value = "";
			document.title = "Mini IDE";
		}
	}
	renderTabs();
}

// ===== Status bar =====
function setStatus(msg, timeout = STATUS_TIMEOUT_DEFAULT_MS) {
	let status = statusbar.querySelector("#status");
	status.textContent = msg;
	setTimeout(() => {
		if (status.textContent === msg) {
			status.textContent = "Ready";
		}
	}, timeout);
}

// ===== Editor Tracking =====
editor.addEventListener("input", () => {
	if (activeFilePath && openFiles[activeFilePath]) {
		openFiles[activeFilePath].content = editor.value;
		openFiles[activeFilePath].dirty = true;
		renderTabs();
	}
	updateCursorPosition();
});

editor.addEventListener("input", updateCursorPosition);
editor.addEventListener("click", updateCursorPosition);
editor.addEventListener("keyup", updateCursorPosition);

function updateCursorPosition() {
	const cursorPosEl = statusbar.querySelector("#cursor-position");
	if (!cursorPosEl) return;

	// If no active file or editor is empty → hide
	if (!activeFilePath && editor.value.length == 0) {
		//cursorPosEl.style.display = "none";
		cursorPosEl.textContent = `Ln ${1}, Col ${1}`;
		return;
	}

	// Otherwise show and update position
	const pos = editor.selectionStart;
	const lines = editor.value.substr(0, pos).split("\n");
	const line = lines.length;
	const col = lines[lines.length - 1].length + 1;
	cursorPosEl.textContent = `Ln ${line}, Col ${col}`;
}


// ===== File Handling =====
function openFile(filePath) {
	if (!openFiles[filePath]) {
		const content = fs.readFileSync(filePath, "utf-8");
		openFiles[filePath] = { content, dirty: false, untitled: false };
	}
	switchTab(filePath);
	setStatus(`File opened: ${filePath}`, 5000);
}

// Sidebar click -> open file
// function createTreeItem(itemPath, isDirectory) {
//   const li = document.createElement("li");
//   li.className = isDirectory ? "folder" : "file";
//   li.innerHTML = `<span>${(isDirectory ? folderIcon_closed : genericFileIcon) + " " + path.basename(itemPath)}</span>`;
//   li.dataset.path = itemPath;

//   if (isDirectory) {
//     const ul = document.createElement("ul");
//     ul.style.display = "none";
//     li.appendChild(ul);

//     li.addEventListener("click", (e) => {
//       e.stopPropagation();
//       if (ul.style.display === "none") {
//         ul.innerHTML = "";
//         const items = fs.readdirSync(itemPath, { withFileTypes: true });
//         items.forEach((child) => {
//           const childPath = path.join(itemPath, child.name);
//           ul.appendChild(createTreeItem(childPath, child.isDirectory()));
//         });
//         ul.style.display = "block";
//       } else {
//         ul.style.display = "none";
//       }
//     });
//   } else {
//     li.addEventListener("mouseover", () => {
//       li.style.background = "#454545ff";
//     });
//     li.addEventListener("mouseout", () => {
//       li.style.background = "";
//     });
//     li.addEventListener("click", (e) => {
//       e.stopPropagation();
//       openFile(itemPath);
//     });
//   }

//   return li;
// }

function createTreeItem(itemPath, isDirectory) {
	const li = document.createElement("li");
	li.className = isDirectory ? "folder" : "file";
	li.innerHTML = `<span>${(isDirectory ? folderIcon_closed : genericFileIcon)} ${path.basename(itemPath)}</span>`;
	li.dataset.path = itemPath;

	// highlight when clicked
	li.addEventListener("click", (e) => {
		e.stopPropagation();
		document.querySelectorAll("#sidebar li").forEach(el => el.classList.remove("selected"));
		li.classList.add("selected");
		selectedPath = itemPath;

		if (!isDirectory) {
			openFile(itemPath);
		}
	});

	if (isDirectory) {
		const ul = document.createElement("ul");
		ul.style.display = "none";
		li.appendChild(ul);

		li.addEventListener("click", (e) => {  // double-click expands
			e.stopPropagation();
			if (ul.style.display === "none") {
				ul.innerHTML = "";
				const items = fs.readdirSync(itemPath, { withFileTypes: true });
				items.forEach((child) => {
					const childPath = path.join(itemPath, child.name);
					ul.appendChild(createTreeItem(childPath, child.isDirectory()));
				});
				ul.style.display = "block";
				expandedFolders.add(itemPath);
			} else {
				ul.style.display = "none";
				expandedFolders.delete(itemPath);
			}
		});
		// auto-expand if saved state says so
		if (expandedFolders.has(itemPath)) {
			const items = fs.readdirSync(itemPath, { withFileTypes: true });
			items.forEach((child) => {
				const childPath = path.join(itemPath, child.name);
				ul.appendChild(createTreeItem(childPath, child.isDirectory()));
			});
			ul.style.display = "block";
		}
	}

	return li;
}

function renderDirectory(dirPath) {
	sidebar.innerHTML = "";
	const rootList = document.createElement("ul");
	rootList.appendChild(createTreeItem(dirPath, true));
	sidebar.appendChild(rootList);
}

// ===== IPC Events =====
ipcRenderer.on("folder-opened", (event, dirPath) => renderDirectory(dirPath));

ipcRenderer.on("file-opened", (event, { content, filePath }) => {
	openFiles[filePath] = { content, dirty: false, untitled: false };
	switchTab(filePath);
});

ipcRenderer.on("file-save", () => {
	if (activeFilePath) {
		const file = openFiles[activeFilePath];
		const content = editor.value;

		if (file.untitled) {
			ipcRenderer.send("request-save", content); // force Save As
		} else {
			fs.writeFileSync(activeFilePath, content, "utf-8");
			openFiles[activeFilePath].content = content;
			openFiles[activeFilePath].dirty = false;
			setStatus(`File saved: ${activeFilePath}`, 5000);
			renderTabs();
			renderDirectory(selectedPath ? path.dirname(activeFilePath) : null); // refresh sidebar if possible
		}
	} else {
		ipcRenderer.send("request-save", editor.value);
	}
});

ipcRenderer.on("file-save-as", (event, filePath) => {
	fs.writeFileSync(filePath, editor.value, "utf-8");
	openFiles[filePath] = { content: editor.value, dirty: false, untitled: false };
	switchTab(filePath);
	setStatus(`File saved as: ${filePath}`, 5000);
	renderDirectory(selectedPath ? path.dirname(filePath) : null); // refresh sidebar if possible
});

ipcRenderer.on("file-saved", (event, filePath) => {
	// Handle untitled -> real file rename
	const file = openFiles[activeFilePath];
	if (file && file.untitled) {
		delete openFiles[activeFilePath];
	}
	openFiles[filePath] = { content: editor.value, dirty: false, untitled: false };
	switchTab(filePath);
	setStatus(`File saved: ${filePath}`, 5000);
	renderDirectory(selectedPath ? path.dirname(filePath) : null); // refresh sidebar if possible
});

// ===== New File Mechanism =====
ipcRenderer.on("new-file", () => {
	const untitledName = `Untitled-${newFileCounter++}`;
	openFiles[untitledName] = { content: "", dirty: true, untitled: true };
	switchTab(untitledName);
});

ipcRenderer.on("close-file", () => {
	if (activeFilePath) {
		closeTab(activeFilePath);
	}
});

document.addEventListener("keydown", async (e) => {
	if (e.key === "Delete" && selectedPath) {
		try {
			const isDir = fs.lstatSync(selectedPath).isDirectory();
			const name = path.basename(selectedPath);

			if (confirm(`Delete ${isDir ? "folder" : "file"} "${name}"?`)) {
				// if (isDir) {
				//   fs.rmSync(selectedPath, { recursive: true, force: true });
				// } else {
				//   fs.unlinkSync(selectedPath);
				// }
				const trash = require("trash");
				await trash([selectedPath]);


				setStatus(`${isDir ? "Folder" : "File"} deleted: ${name}`, 5000);

				// If file was open, close its tab
				if (!isDir && openFiles[selectedPath]) {
					closeTab(selectedPath);
				}

				// Refresh sidebar root
				const rootPath = document.querySelector("#sidebar > ul > li")?.dataset.path;
				if (rootPath) renderDirectory(rootPath);

				selectedPath = null;
			}
		} catch (err) {
			setStatus("Error deleting: " + err.message, 5000);
		}
	}
});
