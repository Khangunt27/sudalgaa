# Backend API Setup

This application requires a backend server to be running for full functionality.

## Starting the Backend Server

1. Navigate to the API directory:
   ```bash
   cd api
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Make sure MongoDB is running on your system (default: `mongodb://localhost:27017/tripPlanner`)

4. Start the server:
   ```bash
   npm start
   ```

   The server will start on port 3000 by default (or the port specified in your `.env` file).

## Environment Variables

Create a `.env` file in the `api` directory with the following variables (optional):

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tripPlanner
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=your_google_api_key_here
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

## Troubleshooting

### Connection Refused Errors

If you see `ERR_CONNECTION_REFUSED` errors in the console:

1. **Check if the server is running**: Make sure you've started the backend server (see steps above)
2. **Check the port**: The frontend expects the server on port 3000 by default
3. **Check MongoDB**: Ensure MongoDB is running and accessible
4. **Check firewall**: Make sure your firewall isn't blocking port 3000

### Network Errors

The application now includes better error handling:
- Network errors will show user-friendly messages
- The app will gracefully fall back to local data when the server is unavailable (for aimags search)
- All API calls have timeout protection (5-30 seconds depending on the endpoint)

## API Endpoints

The backend provides the following endpoints:

- `POST /api/trips` - Create a new trip
- `GET /api/trips` - Get all trips for a user
- `GET /api/trips/:tripId` - Get a specific trip
- `POST /api/trips/:tripId/places` - Add a place to a trip
- `POST /api/trips/:tripId/itinerary` - Add an activity to itinerary
- `GET /api/places/aimags` - Get list of Mongolian aimags
- `GET /api/places/autocomplete` - Search for places
- `GET /api/places/details` - Get place details
- `POST /api/ai/chat` - AI chat endpoint
- `POST /api/ai/itinerary` - Generate AI itinerary
- `POST /api/send-email` - Send email

## Development

The server uses `nodemon` for auto-restart during development. Changes to `server.js` will automatically restart the server.

