# ROS 2 CLI UI

A modern web interface for interacting with ROS 2 command line tools. This project provides a user-friendly way to monitor and interact with ROS 2 topics, nodes, and services through a web browser.

## Features

- **Topics Management**
  - View all ROS 2 topics
  - See topic publishers and subscribers
  - Filter and search topics
  - View topic message types

- **Nodes Management**
  - List all ROS 2 nodes
  - View node details including:
    - Published topics
    - Subscribed topics
    - Services
    - Clients
  - Search and filter nodes

## Architecture

The project consists of two main components:

1. **Backend (FastAPI)**
   - Python-based FastAPI server
   - Interfaces with ROS 2 using rclpy
   - Provides RESTful API endpoints
   - Handles ROS 2 communication

2. **Frontend (Next.js)**
   - Modern React-based web interface
   - Real-time updates
   - Responsive design
   - TypeScript for type safety

## Prerequisites

- Docker and Docker Compose
- ROS 2 (tested with Humble)
- Python 3.8+
- Node.js 20+

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vibe-roscli
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory (optional):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Start the application**
   ```bash
   docker-compose up
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Development

### Backend Development

The backend is a FastAPI application that provides the following endpoints:

- `GET /topics` - List all ROS 2 topics
- `GET /topics/{topic_name}` - Get details for a specific topic
- `GET /nodes` - List all ROS 2 nodes
- `GET /nodes/{node_name}` - Get details for a specific node

### Frontend Development

The frontend is a Next.js application with the following structure:

- `/app` - Main application code
  - `/components` - Reusable React components
  - `/topics` - Topics management page
  - `/nodes` - Nodes management page

## Configuration

### Environment Variables

- `NEXT_PUBLIC_API_URL`: URL of the backend API (default: http://localhost:8000)
- `RMW_IMPLEMENTATION`: ROS 2 middleware implementation (default: rmw_fastrtps_cpp)

### Docker Configuration

The application uses Docker Compose with two services:

1. **ros-backend**
   - Builds from `./backend`
   - Exposes port 8000
   - Uses host network mode for ROS 2 communication

2. **react-frontend**
   - Builds from `./frontend`
   - Exposes port 3000
   - Hot-reloading enabled for development

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- ROS 2 community
- FastAPI
- Next.js
- React 