// Fonction pour afficher l'heure actuelle
function displayCurrentTime() {
    const timeElement = document.getElementById("current-time");
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    timeElement.textContent = `${hours}:${minutes}`;
}

// Mettre à jour l'heure chaque seconde
setInterval(displayCurrentTime, 1100);

// Fonction pour afficher la carte avec la localisation actuelle
function displayMapWithIframe(lat, lon) {
    const mapDiv = document.getElementById("map");
    mapDiv.innerHTML = ""; // Effacer le contenu précédent
    mapDiv.innerHTML = `<iframe width="700" height="300" src="https://maps.google.com/maps?q=${lat},${lon}&z=15&output=embed"></iframe>`;
    console.log(`Carte centrée sur : Latitude = ${lat}, Longitude = ${lon}`);
}

// Fonction pour ajouter des marqueurs sur la carte
function addMarkerToMap(map, lat, lng, title) {
    new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title,
    });
}

// Gestion du bouton "Trouver des activités"
document.getElementById("get-activities").addEventListener("click", async () => {
    // Afficher les sections cachées au clic sur le bouton
    document.getElementById("time-info").style.display = "block";
    document.getElementById("geo-info").style.display = "block";
    document.getElementById("weather-info").style.display = "block";
    document.getElementById("activities-section").style.display = "block";
    document.getElementById("map").style.display = "block";
    
    const weatherDescription = document.getElementById("weather-description");
    const activitiesList = document.getElementById("activities");
    const latElement = document.getElementById("latitude");
    const lonElement = document.getElementById("longitude");

    // Effacer les anciennes données
    weatherDescription.textContent = "";
    activitiesList.innerHTML = "";
    latElement.textContent = "";
    lonElement.textContent = "";

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // Afficher les coordonnées détectées
                latElement.textContent = `Latitude : ${lat}`;
                lonElement.textContent = `Longitude : ${lon}`;

                // Afficher la carte avec la localisation actuelle
                displayMapWithIframe(lat, lon);

                try {
                    // Appeler l'API Flask pour récupérer les données météo
                    const weatherResponse = await fetch(`/weather?lat=${lat}&lon=${lon}`);
                    const weatherData = await weatherResponse.json();

                    if (weatherData.error) {
                        alert(weatherData.error);
                        return;
                    }

                    // Afficher les informations météo
                    weatherDescription.textContent = `Description : ${weatherData.weather[0].description}`;
                    const temperature = `Température : ${weatherData.main.temp}°C`;
                    document.getElementById("temperature").textContent = temperature;

                    // Récupérer l'heure actuelle
                    const currentTime = new Date().getHours();

                    // Appeler l'API Flask pour obtenir les recommandations d'activités
                    const activitiesResponse = await fetch("/recommend", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            weather: weatherData.weather[0],
                            time: currentTime, // Inclure l'heure actuelle
                        }),
                    });
                    const activities = await activitiesResponse.json();

                    // Parcourir les activités et ajouter des lieux spécifiques pour certaines activités
                    for (const activity of activities) {
                        const li = document.createElement("li");
                        li.textContent = activity;
                        activitiesList.appendChild(li);

                        // Ajouter des lieux spécifiques pour les activités
                        if (activity.includes("dîner romantique")) {
                            const placesResponse = await fetch(
                                `/places?type=restaurant&lat=${lat}&lon=${lon}`
                            );
                            const placesData = await placesResponse.json();

                            // Ajouter les 3 premiers restaurants à la liste et sur la carte
                            placesData.results.slice(0, 3).forEach((place) => {
                                const placeLi = document.createElement("li");
                                placeLi.textContent = `Restaurant : ${place.name}, Adresse : ${place.vicinity}`;
                                activitiesList.appendChild(placeLi);
                            });
                        } else if (activity.includes("étoiles")) {
                            const placesResponse = await fetch(
                                `/places?type=park&lat=${lat}&lon=${lon}`
                            );
                            const placesData = await placesResponse.json();

                            // Ajouter les 3 premiers parcs à la liste
                            placesData.results.slice(0, 3).forEach((place) => {
                                const placeLi = document.createElement("li");
                                placeLi.textContent = `Parc : ${place.name}, Adresse : ${place.vicinity}`;
                                activitiesList.appendChild(placeLi);
                            });
                        }
                    }
                } catch (error) {
                    console.error("Erreur lors de l'appel aux APIs :", error);
                    alert("Une erreur est survenue. Veuillez réessayer.");
                }
            },
            (error) => {
                console.error(`Erreur de géolocalisation : ${error.message}`);
                alert("Impossible de récupérer votre position.");
            }
        );
    } else {
        alert("La géolocalisation n'est pas prise en charge par votre navigateur.");
    }
});
