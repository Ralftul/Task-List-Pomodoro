document.addEventListener("DOMContentLoaded", function () {
    // Tasks
    const taskInput = document.getElementById("taskInput");
    const addTaskButton = document.getElementById("addTaskButton");
    const taskList = document.getElementById("taskList");

    // Timer
    const timerContainer = document.getElementById("timerContainer")
    let originalTimerContainerSize = getComputedStyle(timerContainer).height

    const workTimerInput = document.getElementById("workTimerInput");
    const breakTimerInput = document.getElementById("breakTimerInput");

    const buttonsContainer = document.getElementById("buttonsContainer");
    
    const startPauseButton = document.getElementById("startPauseButton");
    const resetButton = document.getElementById("resetButton");
    
    const timerContent = document.getElementById("timerContent"); // Timer text
    const timerCountdown = document.getElementById("timerCountdown") // Timer time display
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

    taskInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
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
        li.classList.add("taskItem")

        // Create task container
        const taskContainer = document.createElement("div");
        taskContainer.style.display = "flex";
        taskContainer.style.width = "100%";
        taskContainer.style.alignItems = "center";
        taskContainer.style.justifyContent = "space-between";

        // Create text span
        const textSpan = document.createElement("span");
        textSpan.classList.add("taskText");
        textSpan.textContent = taskText;
        textSpan.style.flex = "1"; // Give text more space

        // Create checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.classList.add("taskCheckbox");
        checkbox.style.flex = "0";
        checkbox.style.width = "16px";
        checkbox.style.marginLeft = "10px";
        
        if (isCompleted) {
            checkbox.checked = true;
            textSpan.classList.add("completed")
        }   

        // Append elements
        taskContainer.appendChild(textSpan);
        taskContainer.appendChild(checkbox);

        li.appendChild(taskContainer);
        taskList.appendChild(li);
        
        // When checkbox is clicked
        checkbox.addEventListener("change", function() {
            if (this.checked) {
                textSpan.classList.add("completed");

                // Delay before fading out
                setTimeout(() => {
                    li.classList.add("fade-out");

                    // Remove after fade-out animation
                    setTimeout(() => {
                        li.remove();
                        removeTask(taskText);
                    }, 1200); // Matches the transition time (1.2s)
                }, 500); // Delay before fade starts
            }
        });
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
            replaceClass(buttonsContainer, "shiftedDown", "shiftedUp")
            replaceClass(timerCountdown, "hidden", "visible")

            // Update timerContainer height
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
        replaceClass(buttonsContainer, "shiftedUp", "shiftedDown")
        replaceClass(timerCountdown, "visible", "hidden")

        // Reset sizes
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