// https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event
document.addEventListener("DOMContentLoaded", () => {
  console.log("activity_logger JS imported successfully!");
});

const repeat = document.getElementById('repeat');
const days = document.getElementById('days');
const specificDay = document.getElementById('specific-day');

function selectRecurrence() {


  if (repeat.value === 'weekly') {
    days.style.display = 'block';
    specificDay.style.display = 'none';

  } else if (repeat.value === 'once') {
    specificDay.style.display = 'block';
    days.style.display = 'none';
  }

}
//
window.onload = function () {
  specificDay.style.display = 'none';
  days.style.display = 'none';

}
