$(document).ready(createTaskList());

// Auto focus on input of add task modal //
$('#add-task-container').on('shown.bs.modal', function () {
	$('#new-task').trigger('focus');
});


async function createTaskList() {
	// Get account from the Ganache EVM //
	try {
		await getAccount();
		// Set contract and set gas //
		contract = new web3.eth.Contract(contractABI, contractAddress);
		try {
			numberOfTask = await contract.methods.getTaskCount().call({ from: web3.eth.defaultAccount });

			console.log('Number of Tasks are ' + numberOfTask);
			// If there are task present //
			if (numberOfTask != 0) {
				// Fetch one task after the other until no task remain //
				console.log('Start fetching task ...');
				let taskIterator = 0;
				while (taskIterator < numberOfTask) {
					try {
						let task = await contract.methods.getTask(taskIterator).call({ from: web3.eth.defaultAccount });
						if (task[0] != '') {
							// addTaskToList add this task as children to the ul tag //
							addTaskToList(taskIterator, task[0], task[1]);
						}
						else {
							console.log('The index ' + taskIterator + ' is empty');
						}
					} catch {
						console.log('Failed to get Task ' + taskIterator);
					}
					taskIterator++;
				}
				// Update the task count in HTML //
				updateTasksCount();
			}
		} catch {
			console.log('Failed to get task count from blockchain');
		}
	} catch {
		console.log('Failed to get the account');
	}

}


function addTaskToList(id, name, status) {
	console.log('addTaskToList(): Add Task ' + (id) + ' ' + [name, status]);

	let list = document.getElementById('list');

	let item = document.createElement('li');
	item.classList.add('list-group-item', 'border-0', 'd-flex', 'justify-content-between', 'align-items-center');
	item.id = 'item-' + id;
	let task = document.createTextNode(name);

	var checkbox = document.createElement("INPUT");
	checkbox.setAttribute("type", "checkbox");
	checkbox.setAttribute("id", "item-" + id + "-checkbox");
	checkbox.checked = status;

	if (status) {
		item.classList.add("task-done");
	}
	list.appendChild(item);
	item.ondblclick = function () {
		removeTask(item.id);
	}
	item.appendChild(task);
	item.appendChild(checkbox);
	checkbox.onclick = function () { changeTaskStatus(checkbox.id, id); };
}

async function changeTaskStatus(id, taskIndex) {
	// Get checkbox element //
	let checkbox = document.getElementById(id);
	// Get the id of the li element //
	let textId = id.replace('-checkbox', '');
	// Get the li element //
	let text = document.getElementById(textId);
	try {
		await contract.methods.updateStatus(taskIndex, checkbox.checked).send({ from: web3.eth.defaultAccount });
		console.log('changeTaskStatus(): Change status of task ' + textId + ' to ' + checkbox.checked);
		if (checkbox.checked) {
			text.classList.add("task-done");
		} else {
			text.classList.remove("task-done");
		}
	} catch (error) {
		console.log('Failed to change Status of task ' + textId + ' in blockchain');
	}
}

function updateTasksCount() {
	// Get the element of ul tag //
	let list = document.getElementById('list');
	// Get the count of the ul element //
	let taskCount = list.childElementCount;
	console.log('updateTaskCount(): The number of task are ' + taskCount);
	// Set the count to the taskCount id element //
	let count = document.getElementById('taskCount');
	count.innerText = taskCount + " Task";
}


async function addTask(name) {
	// Get the form element containing the new task //
	let form = document.getElementById('new-task');
	// Check if the input is valid and then add it//
	if (form.checkValidity()) {
		console.log('Get the number of task from blockchain');
		// Set blank value for text in the addtask modal //
		document.getElementById('new-task').value = '';
		// Remove the mentioned class because it might be
		// present if a task was added before
		form.classList.remove('was-validated');
		// Get the number of task from blockchain //
		contract.methods.getTaskCount().call({ from: web3.eth.defaultAccount }).then(numberOfTask => {
			// Add the task to the HTML //
			addTaskToList(numberOfTask, name, false);
			// Update the task count in HTML//
			updateTasksCount();
		}, err => {
			console.log('Failed to get the number of task in blockchain ' + err);
		});
		try {
			await contract.methods.addTask(name).send({ from: web3.eth.defaultAccount });
			console.log('Add task ' + name + ' to blockchain');
		} catch {
			console.log('Failed to add task to EVM');
		}

	} else {
		form.addEventListener('submit', function (event) {
			// Stop all events //
			event.preventDefault();
			event.stopPropagation();
			// Add the mentioned class to able to display
			// error to user
			form.classList.add('was-validated');
			// Set blank value for text in the addtask modal //
			document.getElementById('new-task').value = '';
		}, false);

	}

}
