# StreetVendor BD Platform

A comprehensive full-stack web application designed to streamline street vendor management in Bangladesh. StreetVendor provides tools for vendor registration, location management, and digital operations through an intuitive interface with geospatial capabilities.

## 🚀 Overview

StreetVendor BD Platform is a modern, responsive web application that empowers street vendors by providing digital infrastructure for business management. The platform leverages cutting-edge technologies to offer real-time location tracking, vendor management, and seamless integration with payment and documentation systems.

### Key Features

- **Vendor Management**: Register, manage, and track vendor information
- **Geospatial Mapping**: Interactive map-based vendor location tracking using Leaflet
- **QR Code Generation**: Generate unique QR codes for vendor identification
- **PDF Export**: Create and export vendor documentation and reports
- **Real-time Data Sync**: Cloud-based data synchronization with Supabase
- **Responsive Design**: Mobile-friendly interface for on-the-go access
- **RESTful API**: Robust backend API for seamless data operations

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher

## 🏗️ Project Structure

This is a monorepo containing both frontend and backend applications:

```
StreetVendor/
├── frontend/          # React + Vite frontend application
├── backend/           # Express.js backend API
└── package.json       # Root package configuration
```

## 🛠️ Tech Stack

### Frontend
- **React** (v19.2.4) - UI framework
- **Vite** (v8.0.1) - Build tool and dev server
- **React Router** (v7.13.2) - Client-side routing
- **Leaflet** (v1.9.4) - Interactive mapping library
- **React Leaflet** (v5.0.0) - React wrapper for Leaflet
- **Supabase** (v2.100.0) - Backend-as-a-Service (BaaS)
- **Axios** (v1.13.6) - HTTP client
- **QRCode** (v1.5.4) - QR code generation
- **jsPDF** (v4.2.1) - PDF generation

### Backend
- **Express.js** (v5.2.1) - Web framework
- **Supabase** (v2.100.0) - Database and authentication
- **CORS** (v2.8.6) - Cross-origin resource sharing
- **dotenv** (v17.3.1) - Environment variable management

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/itzabd/StreetVendor.git
cd StreetVendor
```

### 2. Install Dependencies

Install all dependencies for both frontend and backend:

```bash
npm run install-frontend
npm run install-backend
```

Or individually:

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

## 🚀 Getting Started

### Frontend Development

Navigate to the frontend directory and start the development server:

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173` (Vite default).

### Backend Development

Navigate to the backend directory and start the server with hot reload:

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:3000` (configure port in `.env`).

### Start Both Servers

From the root directory:

```bash
npm start
```

This starts the backend server. Run the frontend dev server in a separate terminal.

## 🔨 Available Scripts

### Root Commands

```bash
npm start              # Start the backend server
npm run build          # Build frontend and prepare for production
npm run install-backend # Install backend dependencies
npm run install-frontend # Install frontend dependencies
```

### Frontend Commands

```bash
npm run dev       # Start development server with HMR
npm run build     # Build for production
npm run lint      # Run ESLint to check code quality
npm run preview   # Preview production build locally
```

### Backend Commands

```bash
npm start # Start the server
npm run dev # Start with file watcher for development
npm test  # Run tests (not yet configured)
```

## 📝 Environment Configuration

Create `.env` files in both `frontend/` and `backend/` directories:

### Backend `.env` Example

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_api_key
PORT=3000
NODE_ENV=development
```

### Frontend `.env` Example

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_api_key
VITE_API_URL=http://localhost:3000
```

## 🏗️ Building for Production

Build the frontend for production:

```bash
npm run build
```

This creates an optimized build in `frontend/dist/`.

## 🧪 Code Quality

### Linting

Check code quality with ESLint:

```bash
cd frontend
npm run lint
```

## 📊 Language Composition

- **JavaScript**: 92.7%
- **CSS**: 7.0%
- **HTML**: 0.3%

## 📚 API Documentation

The backend provides RESTful endpoints for vendor management. Key endpoints include:

- `GET /api/vendors` - Retrieve all vendors
- `POST /api/vendors` - Create a new vendor
- `GET /api/vendors/:id` - Get vendor details
- `PUT /api/vendors/:id` - Update vendor information
- `DELETE /api/vendors/:id` - Delete a vendor

For detailed API documentation, refer to the backend API routes.

## 🗺️ Features in Detail

### Interactive Mapping
- Real-time vendor location visualization
- Geospatial search and filtering
- Map-based vendor discovery

### Vendor Management
- Complete vendor profile management
- Business information tracking
- License and documentation management

### Digital Tools
- QR code generation for vendor identification
- PDF export for reports and documents
- Real-time data synchronization

## 🔒 Security

- Supabase authentication and authorization
- CORS configuration for API security
- Environment-based configuration for sensitive data

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code passes linting and follows the project's coding standards.

## 📋 License

This project is licensed under the ISC License. See the LICENSE file for details.

## 📧 Contact & Support

For questions, issues, or suggestions, please:
- Open an issue on GitHub
- Contact the repository owner: [@itzabd](https://github.com/itzabd)

## 🎯 Roadmap

- [ ] User authentication and authorization system
- [ ] Payment integration
- [ ] Analytics dashboard
- [ ] Mobile app development
- [ ] Advanced reporting features
- [ ] Multi-language support

## 📝 Changelog

See the [CHANGELOG.md](CHANGELOG.md) for a list of changes in each version.

---

**Made with ❤️ by itzabd**

**Last Updated**: April 2026
