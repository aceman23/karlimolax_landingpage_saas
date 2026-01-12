# DapperLax - Luxury Transportation Service

A modern web application for managing luxury transportation services, built with React, Node.js, and MongoDB.

## Features

- User authentication and authorization
- Real-time booking management
- Driver assignment and tracking
- Vehicle fleet management
- SMS notifications via Twilio
- Admin dashboard with analytics
- Responsive design for all devices

## Tech Stack

- Frontend:
  - React
  - TypeScript
  - Tailwind CSS
  - React Query
  - React Router
  - React Hook Form
  - Lucide Icons

- Backend:
  - Node.js
  - Express
  - MongoDB
  - Mongoose
  - JWT Authentication
  - Twilio API

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

## Getting Started

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/dapperlax.git
cd dapperlax
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

4. **Initialize the database:**
```bash
npm run init-db
```

5. **Start the development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
dapperlax/
├── src/                # Frontend source code
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── services/      # API services
│   └── types/         # TypeScript types
├── server/            # Backend source code
│   ├── controllers/   # Route controllers
│   ├── models/        # MongoDB models
│   ├── routes/        # API routes
│   └── middleware/    # Custom middleware
└── scripts/           # Utility scripts
```

## API Documentation

The API documentation is available at `/api/docs` when running the development server.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.