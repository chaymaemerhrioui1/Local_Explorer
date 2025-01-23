from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

# Mon clé API
API_KEY_WEATHER = '6300935544b37fb72bf0339fb13fdd89'
GOOGLE_PLACES_API_KEY = 'AIzaSyBm5iaWomPausHjMbXF-9vbl7VR-9rExGM'

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/places', methods=['GET'])
def get_places():
    place_type = request.args.get('type')  
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    # Appeler l'API Google Places
    places_url = (
        f"https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        f"?location={lat},{lon}&radius=2000&type={place_type}&key={GOOGLE_PLACES_API_KEY}"
    )
    response = requests.get(places_url)
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Impossible de récupérer les lieux proches'}), 500



# API pour récupérer les données météo
@app.route('/weather', methods=['GET'])
def get_weather():
    try:
        # Récupérer les coordonnées GPS depuis la requête
        lat = request.args.get('lat')
        lon = request.args.get('lon')

        # Construire l'URL de l'API OpenWeatherMap
        weather_url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY_WEATHER}&units=metric"

        # Envoyer la requête à OpenWeatherMap
        response = requests.get(weather_url)
        response.raise_for_status() 
        return jsonify(response.json())
    except Exception as e:
        print(f"Erreur lors de l'appel à l'API météo : {e}")  
        return jsonify({'error': 'Erreur lors de la récupération des données météo'}), 500

# API pour générer des recommandations d'activités
@app.route('/recommend', methods=['POST'])
def recommend_activities():
    # Récupérer les données envoyées par le frontend
    data = request.get_json()
    weather = data.get('weather', {})
    time = data.get('time')  # Récupérer l'heure envoyée par le frontend

    # Logique de recommandation
    description = weather.get('description', '').lower()
    activities = []

    if 6 <= time < 12:  # Matin
        if 'clear' in description:
            activities = ['Faites un jogging', 'Prenez un café en terrasse']
        elif 'clouds' in description:
            activities = ['Promenez-vous dans un parc', 'Lisez un livre dans un café']
        elif 'rain' in description or 'drizzle' in description:
            activities = ['Visitez un musée', 'Prenez un petit déjeuner dans un endroit chaleureux']
        else:
            activities = ['Essayez une séance de yoga', 'Profitez de votre matinée pour faire du ménage']

    elif 12 <= time < 18:  # Après-midi
        if 'clear' in description:
            activities = ['Organisez un pique-nique', 'Visitez une attraction touristique']
        elif 'clouds' in description:
            activities = ['Faites du shopping', 'Promenez-vous dans un centre commercial']
        elif 'rain' in description or 'drizzle' in description:
            activities = ['Regardez un film', 'Détendez-vous dans un café']
        else:
            activities = ['Explorez une librairie', 'Essayez une nouvelle recette chez vous']

    else:  # Soirée (18h - Minuit) ou Nuit (Minuit - 6h)
        if 'clear' in description:
            activities = ['Regardez les étoiles', 'Prenez un dîner romantique']
        elif 'clouds' in description:
            activities = ['Regardez un spectacle', 'Allez dans un restaurant local']
        elif 'rain' in description or 'drizzle' in description:
            activities = ['Regardez un film chez vous', 'Préparez une boisson chaude']
        else:
            activities = ['Lisez un livre', 'Écoutez de la musique relaxante']

    return jsonify(activities)


if __name__ == '__main__':
    app.run(debug=True)
