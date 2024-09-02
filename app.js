document.addEventListener("DOMContentLoaded", () => {
  const timerDisplay = document.getElementById("timer");
  const startButton = document.getElementById("start");
  const pauseButton = document.getElementById("pause");
  const resetButton = document.getElementById("reset");
  const workTimeInput = document.getElementById("workTime");
  const breakTimeInput = document.getElementById("breakTime");
  const notificationSound = document.getElementById("notificationSound");
  const modeIndicator = document.getElementById("modeIndicator");
  const dailyChartCtx = document.getElementById("dailyChart").getContext("2d");

  let workTime = parseInt(workTimeInput.value) * 60;
  let breakTime = parseInt(breakTimeInput.value) * 60;
  let time = workTime;
  let isWork = true;
  let timerInterval;
  let isPaused = false;

  // Load daily report and render chart
  function loadDailyReport() {
    const weeklyData =
      JSON.parse(localStorage.getItem("pomodoroWeeklyData")) || {};
    renderChart(weeklyData);
  }

  // Function to render the chart
  function renderChart(data) {
    const dates = [];
    const times = [];
    const today = new Date();
    for (let i = 10; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().slice(0, 10);
      dates.push(dateString);
      times.push(data[dateString] || 0);
    }
    new Chart(dailyChartCtx, {
      type: "line",
      data: {
        labels: dates,
        datasets: [
          {
            label: "Minutes Spent",
            data: times,
            backgroundColor: "#ff8a00",
            borderColor: "#e52e71",
            borderWidth: 6,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Minutes",
            },
          },
          x: {
            title: {
              display: true,
              text: "Date",
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  }

  function updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    timerDisplay.textContent = `${minutes}:${
      remainingSeconds < 10 ? "0" : ""
    }${remainingSeconds}`;
  }

  function updateProgress(percent) {
    const circle = document.getElementById("progress");
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = `${
      circumference - percent * circumference
    }`;
  }

  function startTimer(duration) {
    time = duration;
    updateTimerDisplay(time);
    updateModeDisplay();
    timerInterval = setInterval(() => {
      if (!isPaused) {
        time--;
        const percent = 1 - time / (isWork ? workTime : breakTime);
        updateProgress(percent);
        updateTimerDisplay(time);
        if (time <= 0) {
          clearInterval(timerInterval);
          notificationSound.play();
          saveSessionData();
          setTimeout(
            () =>
              alert("Time is up! Please start the next session when ready."),
            100
          );
        }
      }
    }, 1000);
  }

  function saveSessionData() {
    const today = new Date().toISOString().slice(0, 10);
    let weeklyData =
      JSON.parse(localStorage.getItem("pomodoroWeeklyData")) || {};
    if (weeklyData[today]) {
      weeklyData[today] += isWork ? workTime / 60 : breakTime / 60;
    } else {
      weeklyData[today] = isWork ? workTime / 60 : breakTime / 60;
    }
    localStorage.setItem("pomodoroWeeklyData", JSON.stringify(weeklyData));
    isWork = !isWork;
    updateModeDisplay();
    loadDailyReport(); // Update the chart after saving data
  }

  function updateModeDisplay() {
    if (isWork) {
      modeIndicator.textContent = "Work Time";
      modeIndicator.classList.add("text-indigo-600");
      modeIndicator.classList.remove("text-green-600");
    } else {
      modeIndicator.textContent = "Break Time";
      modeIndicator.classList.add("text-green-600");
      modeIndicator.classList.remove("text-indigo-600");
    }
  }

  startButton.addEventListener("click", () => {
    clearInterval(timerInterval);
    workTime = parseInt(workTimeInput.value) * 60;
    breakTime = parseInt(breakTimeInput.value) * 60;
    time = isWork ? workTime : breakTime;
    isPaused = false;
    startTimer(time);
  });

  pauseButton.addEventListener("click", () => {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? "Resume" : "Pause";
  });

  resetButton.addEventListener("click", () => {
    clearInterval(timerInterval);
    isPaused = false;
    isWork = true;
    updateTimerDisplay(workTime);
    updateProgress(0); // Reset the progress bar
    updateModeDisplay();
    pauseButton.textContent = "Pause";
  });

  updateTimerDisplay(workTime);
  updateProgress(0); // Initialize the progress bar
  loadDailyReport(); // Load the chart on initial page load
});
