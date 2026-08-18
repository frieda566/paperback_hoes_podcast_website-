const map = L.map('map').setView([51.1657, 10.4515], 6); // Zentrum: Deutschland

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 18
}).addTo(map);

async function loadEvents() {
  const events = await fetch('events.json').then(r => r.json());

  events.forEach(ev => {
    const marker = L.marker([ev.lat, ev.lng]).addTo(map);

    marker.bindPopup(`
      <strong>${ev.city}</strong><br>
      <em>${ev.title}</em><br>
      ${ev.description}
    `);
  });
}

loadEvents();