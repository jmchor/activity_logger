document.addEventListener('DOMContentLoaded', () => {
	console.log('activity_logger JS imported successfully!');
});

function selectRecurrence() {
	const repeat = document.getElementById('repeat');
	const days = document.getElementById('days');
	const specificDay = document.getElementById('specific-day');

	if (repeat.value === 'weekly') {
		days.style.display = 'block';
		specificDay.style.display = 'none';
	} else if (repeat.value === 'once') {
		specificDay.style.display = 'block';
		days.style.display = 'none';
	}
}
//


