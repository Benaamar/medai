# Medical AI Companion

## Overview

Medical AI Companion is a comprehensive medical practice management system that leverages AI-powered document generation and consultation assistance. The application is built as a full-stack web application with a React TypeScript frontend and Express.js backend, using PostgreSQL for data persistence and integrating with Anthropic's Claude API for intelligent medical content generation.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: Custom component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured endpoints
- **Authentication**: JWT-based authentication with bcryptjs for password hashing
- **File Handling**: Multer for audio file uploads (medical transcription)

### Database Architecture
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations and schema generation
- **Connection**: postgres client with connection pooling

## Key Components

### Data Models
1. **Users**: Doctor accounts with role-based access
2. **Patients**: Patient records with demographic information
3. **Consultations**: Medical appointments with notes, diagnosis, and treatment
4. **AI Summaries**: Generated medical documents (consultations, prescriptions, certificates)

### AI Integration
- **Primary AI Provider**: Anthropic Claude (claude-3-5-sonnet-20241022)
- **Fallback AI Provider**: OpenAI GPT (configured but not primary)
- **Capabilities**: 
  - Medical consultation summaries
  - Prescription generation
  - Medical certificate creation
  - Intelligent chat assistance
  - Medical transcription (OpenAI Whisper)

### Frontend Features
- **Dashboard**: Real-time statistics and quick actions
- **Patient Management**: CRUD operations with search and filtering
- **Consultation Management**: Appointment scheduling and medical notes
- **AI Assistant**: Chat interface with medical context awareness
- **Document Generation**: PDF export and printing capabilities
- **Notifications**: In-app notification system for user actions

## Data Flow

1. **Authentication Flow**: User login → JWT generation → Token-based API access
2. **Patient Management**: Patient creation → Consultation scheduling → Medical documentation
3. **AI Document Generation**: Consultation data → AI processing → Document creation → Storage
4. **Real-time Updates**: API mutations → Query invalidation → UI updates

## External Dependencies

### AI Services
- **Anthropic API**: Primary AI provider for medical content generation
- **OpenAI API**: Backup provider and audio transcription services

### UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **React Hook Form**: Form validation and management

### Database and ORM
- **PostgreSQL**: Primary database
- **Drizzle ORM**: Type-safe database queries and migrations
- **postgres**: Database client library

## Deployment Strategy

### Development Environment
- **Runtime**: Replit with Node.js 20
- **Process Manager**: tsx for TypeScript execution
- **Hot Reload**: Vite HMR for frontend, tsx watch for backend
- **Port Configuration**: Application runs on port 5000

### Production Build
- **Frontend**: Vite production build to `dist/public`
- **Backend**: ESBuild compilation to `dist` directory
- **Deployment Target**: Autoscale deployment on Replit
- **Environment**: Production mode with optimized assets

### Environment Configuration
- **Database**: PostgreSQL connection via DATABASE_URL
- **Authentication**: JWT secret configuration
- **AI Services**: API keys for Anthropic and OpenAI
- **Security**: Environment variables for sensitive configuration

## Changelog

- June 24, 2025. Initial Git commit - Complete Medical AI Companion application ready for GitHub deployment
- June 24, 2025. Added profile dropdown menu with session timer and logout functionality in dashboard header
- June 24, 2025. Redesigned login and signup pages with blue gradient design matching user reference image - glass-morphism cards with fingerprint icons and modern styling
- June 24, 2025. Enhanced UI/UX with modern gradient designs for login and signup pages, added 20-minute auto-logout functionality with session timer in header
- June 24, 2025. Implemented complete data isolation by doctor - each doctor now sees only their own patients, consultations, and AI summaries through JWT authentication and database filtering
- June 24, 2025. Corrected login redirection issue by adding query invalidation after authentication
- June 23, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
Data storage: All data must be stored in PostgreSQL database, not localStorage.
Design preference: Modern, attractive UI with gradients and professional medical aesthetics.