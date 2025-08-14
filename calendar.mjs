/** @returns {HTMLElement} */
function cloneFirstElementChildOf(id) {
	return document.getElementById(id).content.firstElementChild.cloneNode(true);
}

const calendars = [
	["#80ffff", "https://ics.qazm.de/furry-art-holidays-SFW.ics"],
	["#ff80ff", "https://ics.qazm.de/furry-art-holidays-NSFW.ics"],
]

const events = [];

for (const [color, url] of calendars) {
	const response = await fetch(url);
	const ics = await response.text();
	for (const icsEvent of ics.match(/^BEGIN:VEVENT$(.*?)^END:VEVENT$/mgs)) {
		const [summary] = /^SUMMARY:(.*)$/m.exec(icsEvent).slice(1);
		let [year, month, day] = /^DTSTART;VALUE=DATE:(\d{4})(\d{2})(\d{2})$/m.exec(icsEvent).slice(1);
		let [endYear, endMonth, endDay] = /^DTEND;VALUE=DATE:(\d{4})(\d{2})(\d{2})$/m.exec(icsEvent).slice(1);
		const [location] = (/^LOCATION:(.*)$/m.exec(icsEvent) || []).slice(1);
		const [description] = (/^DESCRIPTION:(.*(?:\r\n .*)*)/m.exec(icsEvent) || []).slice(1);

		const isYearlyMonthDay = icsEvent.includes('YEARLY') && icsEvent.includes('BYMONTH') && icsEvent.includes('BYMONTHDAY');
		if (isYearlyMonthDay) {
			const now = new Date();
			switch (true) {
				// Annoying mix of 0- and 1-indexing.
				case +year > now.getFullYear():
				case +year == now.getFullYear() && +month > now.getMonth() + 1:
				case +year == now.getFullYear() && +month == now.getMonth() + 1 && +day >= now.getDate():
				case +endYear > now.getFullYear():
				case +endYear == now.getFullYear() && +endMonth > now.getMonth() + 1:
				case +endYear == now.getFullYear() && +endMonth == now.getMonth() + 1 && +endDay > now.getDate():
					endYear = year = now.getFullYear().toString();
					break;

				default:
					endYear = year = (now.getFullYear() + 1).toString();
					break;
			}

			// Handle New Year's Eve events.
			if (endMonth < month || endMonth == month && endDay < day) {
				endYear = (endYear + 1).toString();
			}
		}

		events.push({
			color,
			year, month, day,
			summary,
			endYear, endMonth, endDay,
			isYearlyMonthDay,
			location, description,
		});
	}
}

events.sort((a, b) => {
	switch (true) {
		case a.year > b.year: return 1;
		case a.year < b.year: return -1;
		case a.month > b.month: return 1;
		case a.month < b.month: return -1;
		case a.day > b.day: return 1;
		case a.day < b.day: return -1;

		case a.endYear > b.endYear: return 1;
		case a.endYear < b.endYear: return -1;
		case a.endMonth > b.endMonth: return 1;
		case a.endMonth < b.endMonth: return -1;
		case a.endDay > b.endDay: return 1;
		case a.endDay < b.endDay: return -1;

		case a.summary > b.summary: return 1;
		case a.summary < b.summary: return -1;

		default: return 0;
	}
});

const currentAndUpcoming = document.getElementById('currentAndUpcoming');
currentAndUpcoming.innerText = '';
const past = document.getElementById('past');
past.innerText = '';
for (const event of events) {
	const el = cloneFirstElementChildOf('calendarEntry');

	el.style.background = event.color;
	if (event.isYearlyMonthDay) {
		el.querySelector('[data-id="date"]').textContent = `     ${event.month} ${event.day}`;
	} else {
		el.querySelector('[data-id="date"]').textContent = `${event.year} ${event.month} ${event.day}`;
	}
	el.querySelector('[data-id="summary"]').textContent = event.summary;

	if (event.location) {
		el.querySelector('[data-id="location"]').textContent = event.location;
	} else {
		el.querySelector('[data-id="location-p"]').remove();
	}

	if (event.description) {
		el.querySelector('[data-id="description"]').textContent = event.description
			.replaceAll('\r\n ', '')
			.replace(/\\(.)/g, (s, args) => {
				switch (args[0]) {
					case 'n': return '\n';
					default: return args[0];
				}
			});
	} else {
		el.querySelector('[data-id="description"]').remove();
	}

	const now = new Date();
	switch (true) {
		case event.isYearlyMonthDay:
		// Annoying mix of 0- and 1-indexing.
		case +event.year > now.getFullYear():
		case +event.year == now.getFullYear() && +event.month > now.getMonth() + 1:
		case +event.year == now.getFullYear() && +event.month == now.getMonth() + 1 && +event.day >= now.getDate():
		case +event.endYear > now.getFullYear():
		case +event.endYear == now.getFullYear() && +event.endMonth > now.getMonth() + 1:
		case +event.endYear == now.getFullYear() && +event.endMonth == now.getMonth() + 1 && +event.endDay > now.getDate():
			currentAndUpcoming.appendChild(el);
			break;

		default:
			past.appendChild(el);
			break;
	}
}

for (const child of Array.from(past.children).reverse()) {
	past.appendChild(child);
}

console.log("Schedule OK")