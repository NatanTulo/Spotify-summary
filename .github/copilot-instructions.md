# Copilot Instructions for Spotify Analytics Project

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

This is a modern Spotify analytics web application built with:

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui with Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Sequelize
- **Data Source**: Spotify extended streaming history (JSON files from GDPR export)

## Key Features

- Interactive dashboard showing listening statistics
- Filtering and sorting capabilities
- Responsive design for desktop and mobile
- PostgreSQL integration for fast queries
- Type-safe development with TypeScript

## Development Guidelines

- Use TypeScript for all new code
- Follow React best practices with hooks
- Use shadcn/ui components for consistent UI
- Implement responsive design with Tailwind CSS
- Create reusable components and utilities
- Handle errors gracefully with proper error boundaries
- Use proper PostgreSQL schemas with Sequelize
- Implement efficient data pagination
- Follow REST API conventions for backend endpoints

## Database Schema

- **artists**: Stores unique artist information
- **albums**: Stores album information with artist references
- **tracks**: Stores track information with album references
- **plays**: Stores individual play records with track references

## Code Style

- Use arrow functions for components
- Implement proper TypeScript interfaces
- Use async/await for asynchronous operations
- Follow consistent naming conventions
- Add JSDoc comments for complex functions
