# Sustainable Fashion AI

An AI-powered fashion recommendation platform that helps users make sustainable fashion choices.

<img width="1457" alt="image" src="https://github.com/user-attachments/assets/c6c2d172-9b19-4821-ab53-dd22a60c6121" />

## 🌟 Features

- **Style Assistant**: Get personalized fashion recommendations based on your preferences while prioritizing sustainable options
- **Virtual Try-On**: Visualize how different pieces would look on you before making a purchase
- **AI-Powered Recommendations**: Advanced algorithms that consider both style preferences and sustainability metrics

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <https://github.com/M7-Soliman/Red-Square>
   cd green-square
   ```

2. **Set up the backend**
   ```bash
   # Navigate to backend directory
   cd backend
   
   # Install Python dependencies
   pip install -r requirements.txt
   
   # Create .env file and add your API key
   echo "ANTHROPIC_API_KEY=your_api_key_here" > .env
   
   # Start the Flask server
   python app.py
   ```
   Server will run on http://localhost:5000

3. **Set up the frontend**
   ```bash
   # In a new terminal, navigate to frontend directory
   cd frontend
   
   # Install dependencies
   npm install
   
   # Update config.js with your local IP
   # Then start the Expo server
   npm start
   ```
   The web version will be available at http://localhost:19006

## Development Setup

1. **Find your local IP address**:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`
   - Use this IP in `frontend/config.js`

2. **Configure environment**:
   ```bash
   # backend/.env
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

3. **Run in development**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   python app.py

   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

## Troubleshooting

- If you see CORS errors, ensure your IP is correctly set in `frontend/config.js`
- If the API calls fail, check that your Anthropic API key is correctly set in `.env`
- Make sure both backend and frontend servers are running simultaneously

## Tech Stack

**Frontend:**
- React Native + Expo
- React Navigation
- React Native Paper

**Backend:**
- Flask
- Claude AI

## Local Development

1. Find your local IP address:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`

2. Update `frontend/config.js` with your IP address

3. Start the backend:
   ```bash
   cd backend
   python app.py
   ```

4. Start the frontend:
   ```bash
   cd frontend
   expo start
   ```

The app should now work on both web on your local network.


