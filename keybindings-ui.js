const fs = require("fs");
const path = require("path");
// const filePath = path.join(__dirname, "./config/key-bindings.json");

function loadKeybindingsEditor(container, filePath) {	
	container.innerHTML = `
		<div id="status-line">Status</div>
		<table id="bindingsTable">
			<thead>
				<tr>
					<th>Command</th>
					<th>Shortcut</th>
				</tr>
			</thead>
			<tbody></tbody>
		</table>
	`;

	let data = {};	
	// alert("kbuijs filePath :"+filePath);
	function updateBinding(cmd, binding) {		
		data[cmd] = binding;
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
		document.getElementById("status-line").textContent = `✅ Updated ${cmd} to ${binding}`;
		loadBindings();
	}

	function loadBindings() {		
		data = JSON.parse(fs.readFileSync(filePath, "utf8"));
		const tbody = container.querySelector("#bindingsTable tbody");
		tbody.innerHTML = "";
		Object.entries(data).forEach(([cmd, key]) => {
			const row = document.createElement("tr");
			row.innerHTML = `
				<td>${cmd}</td>
				<td><input id="input-${cmd}" value="${key}"></td>
				<td><button class="update-btn" data-cmd="${cmd}">Update</button></td>
			`;
			tbody.appendChild(row);
		});

		tbody.querySelectorAll(".update-btn").forEach(btn => {
			btn.addEventListener("click", e => {
				const cmd = e.target.dataset.cmd;
				const val = container.querySelector(`#input-${cmd}`).value;
				updateBinding(cmd, val);
			});
		});
	}

	loadBindings();
}

module.exports = {
	loadKeybindingsEditor
};