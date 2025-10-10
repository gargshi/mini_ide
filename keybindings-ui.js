const fs = require("fs");
const path = require("path");
// const filePath = path.join(__dirname, "./config/key-bindings.json");
const default_status_line = "Click \"Change Bindings\" to edit";
function loadKeybindingsEditor(container, filePath) {
	container.innerHTML = `
		<div id="status-line-container">
			<div id="status-line">${default_status_line}</div>
			<button id="change-binding-btn">Change Bindings</button>
		</div>
		<br>
		<table id="bindingsTable">
			<thead>
				<tr>
					<td>Command</td>
					<td>Shortcut</td>					
				</tr>
			</thead>
			<tbody></tbody>
		</table>
	`;

	const change_binding_btn = container.querySelector("#change-binding-btn");

	let data = {};
	// alert("kbuijs filePath :"+filePath);
	function updateBinding(cmd, binding) {
		data[cmd] = binding;
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
		document.getElementById("status-line").textContent = `✅ Updated ${cmd} to ${binding}`;
		setTimeout(() => {
			document.getElementById("status-line").textContent = default_status_line;
		}, 2000);

		loadBindings();
	}


	function display_binding(where_disp, keybind) {
		let html = '';

		// 1. Handle "CmdOrCtrl"
		if (keybind.startsWith("CmdOrCtrl")) {
			html += '<span class="kb-btn">Cmd</span>';
			html += '<span class="kb-btn-sep">or</span>';
			html += '<span class="kb-btn">Ctrl</span>';

			// Remove the processed part and the '+'
			keybind = keybind.substring("CmdOrCtrl".length);
			if (keybind.startsWith("+")) {
				keybind = keybind.substring(1);
			}

			html += '<span class="kb-btn-sep">+</span>';

		}

		// 2. Handle the remaining key (e.g., "K" or "W")
		if (keybind.length > 0) {
			// Split the remaining string by '+' in case of multi-key combinations
			const remainingKeys = keybind.split('+');

			remainingKeys.forEach((key, index) => {
				html += `<span class="kb-btn">${key}</span>`;

				// Add a '+' separator if it's not the last key
				if (index < remainingKeys.length - 1) {
					html += '<span class="kb-btn-sep">+</span>';
				}
			});
		}

		html += '</div>';
		// return html;
		where_disp.innerHTML = html;
	}

	function loadBindings() {
		//reset button
		change_binding_btn.textContent = "Change Bindings";
		change_binding_btn.classList.remove("ena");

		data = JSON.parse(fs.readFileSync(filePath, "utf8"));
		const tbody = container.querySelector("#bindingsTable tbody");
		tbody.innerHTML = "";
		Object.entries(data).forEach(([cmd, key]) => {
			const row = document.createElement("tr");
			row.innerHTML = `
				<td>${cmd}</td>
				<td class="keybindings-cell"><span class="kb-line" id="kb-line"></span></td>
				<td><span class="collapsible"><input id="input-${cmd}" value="${key}"><button class="update-btn" data-cmd="${cmd}">Update</button></span></td>				
			`;
			tbody.appendChild(row);
			const kb_line = row.querySelector(".kb-line");
			display_binding(kb_line, key);
		});

		tbody.querySelectorAll(".update-btn").forEach(btn => {
			btn.addEventListener("click", e => {
				const cmd = e.target.dataset.cmd;
				const val = container.querySelector(`#input-${cmd}`).value;
				updateBinding(cmd, val);
			});
		});
	}



	change_binding_btn.addEventListener("click", () => {
		const table = container.querySelector("#bindingsTable");
		const collapsibles = table.querySelectorAll(".collapsible");
		collapsibles.forEach(collapsible => {
			let isHidden = window.getComputedStyle(collapsible).display === "none";
			collapsible.style.display = isHidden ? "table-cell" : "none";
		});
		const keybindingcells = table.querySelectorAll(".keybindings-cell");
		let a = 0;
		keybindingcells.forEach(kbcell => {
			let isHidden = window.getComputedStyle(kbcell).display === "none";
			kbcell.style.display = isHidden ? "table-cell" : "none";
			if (a == 0) {
				a = 1;
				change_binding_btn.textContent = !isHidden ? "Close Editor" : "Change Bindings";
				change_binding_btn.classList.toggle("ena");
			}
		});



	});

	loadBindings();
}

module.exports = {
	loadKeybindingsEditor
};