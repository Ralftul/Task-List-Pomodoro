document.addEventListener("DOMContentLoaded", function () {
    // Tasks
    const todoContainer = document.getElementsByClassName("todo-container")[0];
    let originalTodoContainerSize = getComputedStyle(todoContainer).height

    const taskInput = document.getElementById("task-input");
    const addTaskButton = document.getElementById("add-task-button");
    const taskList = document.getElementById("task-list");

    // Timer
    const timerContainer = document.getElementById("timer-container")
    let originalTimerContainerSize = getComputedStyle(timerContainer).height

    const workTimerInput = document.getElementById("work-timer-input");
    const breakTimerInput = document.getElementById("break-time-input");

    const buttonsContainer = document.getElementById("buttons-container");
    
    const startPauseButton = document.getElementById("start-pause-button");
    const resetButton = document.getElementById("reset-button");
    
    const timerContent = document.getElementById("timer-content"); // Timer text
    const timerCountdown = document.getElementById("timer-display") // Timer time display
    let originalTimerCountdownHeight = getComputedStyle(timerCountdown).height

    let workTimerTime = workTimerInput.value * 60 // Minutes to sec
    let breakTimerTime = breakTimerInput.value * 60 // Minutes to sec
    let currentTimerTime = 0
    let timerIntervalId = null
    
    let onBreak = false
    let isPaused = false
    let isTimerDisplayerToggled = false

    // Load tasks from local
    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks.forEach(task => addTaskToDOM(task.text, task.completed));
    }

    // Save task to local storage
    function saveTask(task) {
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks.push(task);
        localStorage.setItem("tasks", JSON.stringify(tasks));
    };

    // Remove from local storage
    function removeTask(taskText) {
        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks = tasks.filter(t => t.text !== taskText);
        localStorage.setItem("tasks", JSON.stringify(tasks));
    };

    taskInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            addTaskButton.click();
        }
    });

    // Add task event
    addTaskButton.addEventListener("click", function () {
        const taskText = taskInput.value.trim();
        if (taskText === "") return;

        addTaskToDOM(taskText);
        saveTask({text: taskText, completed: false});
        taskInput.value = "";
    });

    // Add task to the DOM
    function addTaskToDOM(taskText, isCompleted = false) {
        const li = document.createElement("li");
        li.classList.add()

        // Create task container
        const taskContainer = document.createElement("div");
        taskContainer.style.display = "flex";
        taskContainer.style.alignItems = "center";

        // Create text span
        const textSpan = document.createElement("span");
        textSpan.classList.add("taskText");
        textSpan.style.display = "flex";
        textSpan.style.alignItems = "center";
        textSpan.textContent = taskText;
        textSpan.style.flex = "1"; // Give text more space

        // Create checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";

        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                // Add a margin to the bottom of the task to ensure smooth transition
                li.style.marginBottom = getComputedStyle(li).marginBottom;

                // Trigger the collapse animation
                textSpan.classList.add("completed");

                textSpan.addEventListener("transitionend", function opacityHandler(event) {
                    if (event.propertyName !== "opacity") return;
                    textSpan.removeEventListener("transitionend", opacityHandler);

                    const startingHeight = li.offsetHeight + "px";
                    li.style.height = startingHeight;
                    li.offsetHeight; // Trigger reflow

                    li.style.opacity = "0";
                    li.style.transform = "translateY(-20px)";
                    li.style.height = "0";
                    li.style.marginTop = "0";
                    li.style.marginBottom = "0";
                    li.style.paddingTop = "0";
                    li.style.paddingBottom = "0";

                    li.addEventListener("transitionend", function heightHandler(event) {
                        if (event.propertyName !== "height") return;
                        li.removeEventListener("transitionend", heightHandler);
                        li.remove();
                        removeTask(textSpan.textContent);
                    });
                });
            }
        });
        
        // Create label
        const label = document.createElement("label");
        label.style.display = "flex";
        label.style.justifyContent = "space-between";
        label.style.flex = "1";
        label.style.padding = "10px";

        if (isCompleted) {
            checkbox.checked = true;
            textSpan.classList.add("completed")
        }   

        // Append elements
        label.appendChild(textSpan);
        label.appendChild(checkbox);
        
        taskContainer.appendChild(label);
        
        li.appendChild(taskContainer);
        taskList.appendChild(li);
    }
    
    // Get work timer input
    workTimerInput.addEventListener("input", function() {
        workTimerTime = workTimerInput.value * 60
    });
    // Get break timer input
    breakTimerInput.addEventListener("input", function() {
        breakTimerTime = breakTimerInput.value * 60
    });

    //Add timer fucntionality
    startPauseButton.addEventListener("click", function () {
        if (!isTimerDisplayerToggled) { // If not toggled, toggle and start timer
            // Smooth show/hide
            replaceClass(timerContent, "visible", "hidden")
            replaceClass(buttonsContainer, "shifted-down", "shifted-up")
            replaceClass(timerCountdown, "hidden", "visible")

            // Update timerContainer height
            todoContainer.style.height = "480px";
            timerContainer.style.height = "500px";

            // Adjusting startPauseButton visuals
            startPauseButton.textContent  = "Pause";
            startPauseButton.style.backgroundColor = "rgb(105, 122, 105)";
            
            isTimerDisplayerToggled = true

            // Start work timer
            currentTimerTime = workTimerTime
            startPauseTimer(true)
        } else {
            // Toggle pause/resume
            isPaused = !isPaused
            startPauseButton.textContent = isPaused ? "Resume" : "Pause";
            startPauseButton.style.backgroundColor = isPaused ? "rgb(13, 109, 13)" : "rgb(105, 122, 105)"
        }
    });

    resetButton.addEventListener("click", function() {
        // Reset logic
        clearInterval(timerIntervalId);
        timerIntervalId = null;
        isPaused = false;
        onBreak = false;

        isTimerDisplayerToggled = false;
        currentTimerTime = workTimerTime;

        // Reset display
        startPauseButton.textContent  = "Start";
        startPauseButton.style.backgroundColor = "rgb(13, 109, 13)";

        replaceClass(timerContent, "hidden", "visible")
        replaceClass(buttonsContainer, "shifted-up", "shifted-down")
        replaceClass(timerCountdown, "visible", "hidden")

        // Reset sizes
        todoContainer.style.height = originalTodoContainerSize;
        timerContainer.style.height = originalTimerContainerSize
        timerCountdown.style.height = originalTimerCountdownHeight
    });

    function startPauseTimer(started) {
        if (started && !timerIntervalId) {
            updateCountdownDisplay();

            timerIntervalId = setInterval(function() {
            if (!isPaused) {
                currentTimerTime--;

                if (currentTimerTime < 0) {
                    // Breaktimer logic
                    clearInterval(timerIntervalId);
                    timerIntervalId = null;

                    if (!onBreak) {
                        // Switch to break
                        onBreak = true;
                        currentTimerTime = breakTimerTime;
                        startPauseTimer(true);
                    } else { 
                        // Switch back to work time
                        onBreak = false;
                        currentTimerTime = workTimerTime;
                        startPauseTimer(true);
                    }
                    return
                }
                updateCountdownDisplay();
                }
            }, 1000);
        }
    };

    // Upadte display
    function updateCountdownDisplay() {
        // Get timer minutes and seconds
        let minutes = Math.floor(currentTimerTime / 60);
        let seconds = currentTimerTime % 60;

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        // Display counter
        timerCountdown.textContent = minutes + ":" + seconds;
    }

    //Helper fucntion for switching classes
    function replaceClass(element, oldClass, newClass) {
        element.classList.remove(oldClass);
        element.classList.add(newClass);
    }

    // Load tasks when page loads
    loadTasks();
});