// Creates the Leaflet map and centers it on Germany with a zoom
const map = L.map('map').setView([51.1657, 10.4515], 6); 

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 18
}).addTo(map);

// Custom icon for the event markers
const customIcon = L.icon({
  iconUrl: 'images/pin.png', 
  iconSize: [30, 55],
  iconAnchor: [14, 38]
});

// Creates the event overlay and modal dynamically
const overlay = document.createElement('div');
overlay.className = 'event-overlay';

overlay.innerHTML = `
    <div class="event-modal">
        <button class="event-close button-29" id="event-close">✕</button>

        <img id="event-image" src="" alt="">

        <div class="event-content">
            <p class="event-city" id="event-city"></p>
            <h2 id="event-title"></h2>
            <p class="event-date" id="event-date"></p>
            <p id="event-description"></p>
        </div>
    </div>
`;

document.body.appendChild(overlay);

overlay.querySelector('.event-close').addEventListener('click', () => {
    overlay.classList.remove('active');
});

overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
        overlay.classList.remove('active');
    }
});

// Loads the event data and creates a marker for each event 
fetch('events.json')
    .then(response => response.json())
    .then(events => {

        events.forEach(ev => {

            const marker = L.marker([ev.lat, ev.lng], {
                icon: customIcon
            }).addTo(map);

            // Displays the event information when a marker is clicked
            marker.on('click', () => {

                document.getElementById('event-image').src = ev.image;
                document.getElementById('event-image').alt = ev.title;

                document.getElementById('event-city').textContent = ev.city;
                document.getElementById('event-title').textContent = ev.title;
                document.getElementById('event-date').textContent = ev.date;
                document.getElementById('event-description').textContent = ev.description;

                overlay.classList.add('active');
            });
        });
    })
    .catch(error => console.error('Error loading events:', error));

const marker = L.marker([ev.lat, ev.lng], { icon: customIcon }).addTo(map);


loadEvents();