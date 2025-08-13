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
		console.log(JSON.stringify(icsEvent));
		const [summary] = /^SUMMARY:(.*)$/m.exec(icsEvent).slice(1);
		const [year, month, day] = /^DTSTART;VALUE=DATE:(\d{4})(\d{2})(\d{2})$/m.exec(icsEvent).slice(1);
		const [endYear, endMonth, endDay] = /^DTEND;VALUE=DATE:(\d{4})(\d{2})(\d{2})$/m.exec(icsEvent).slice(1);
		const [location] = (/^LOCATION:(.*)$/m.exec(icsEvent) || []).slice(1);
		const [description] = (/^DESCRIPTION:(.*(?:\r\n .*)*)/m.exec(icsEvent) || []).slice(1);
		console.log(year, month, day, summary);
		console.log(location);
		console.log(description);

		events.push({
			color,
			year, month, day,
			summary,
			endYear, endMonth, endDay,
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
console.log(events);

const upcoming = document.getElementById('upcoming');
for (const event of events) {
	const el = cloneFirstElementChildOf('calendarEntry');

	el.style.background = event.color;
	el.querySelector('[data-id="date"]').textContent = event.year == new Date().getFullYear() ? `${event.month} ${event.day}` : `${event.year} ${event.month} ${event.day}`;
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


	upcoming.appendChild(el);
}