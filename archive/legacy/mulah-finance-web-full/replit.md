# Mulah - Unified Financial Platform

## Overview

Mulah is a comprehensive financial middleware platform designed to provide unified billing orchestration and AI-powered financial insights. It operates as a hybrid web/mobile progressive web app (PWA), integrating subscription tracking, virtual card management, merchant synchronization, and BNPL (Buy Now, Pay Later) fallback systems into a single platform. Mulah's core capabilities include smart subscription detection, centralized billing orchestration via its Unified Subscription Wallet (USW), dynamic payment card management through virtual cards, billing anchor negotiation with Mulah Mesh, and intelligent transaction classification with AI-based insights.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

Mulah is built as a PWA with a mobile-first design philosophy.

### Frontend Architecture
- **Framework**: React 18 with TypeScript.
- **Styling**: Tailwind CSS and shadcn/ui.
- **Routing**: Wouter.
- **State Management**: TanStack Query for server state.
- **Forms**: React Hook Form with Zod validation.
- **Build Tool**: Vite.

### Backend Architecture
- **Runtime**: Node.js with Express.js (TypeScript).
- **Authentication**: Replit Auth with OpenID Connect, session management via Express sessions and PostgreSQL.
- **API Design**: RESTful API with centralized error handling.
- **Financial Middleware**: Integrations with Stripe Issuing for virtual cards, Open Banking for transaction sync, and Klarna for BNPL fallback. Includes webhook management and retry queue logic.
- **Modular Services**: Dedicated services for USW, Mulah Mesh, Smart Buffer, Card management, and Scheduler.

### Mobile Application
- A separate React Native/Expo mobile app (`mobile/`) offers full feature parity.
- **Framework**: React Native 0.81 with Expo SDK 54.
- **Navigation**: React Navigation.
- **State Management**: TanStack Query and React Context.
- **Authentication**: Expo Auth Session.

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL.
- **Database Provider**: Neon (serverless PostgreSQL).
- **Schema Management**: Type-safe schema definitions with Zod.

### UI/UX Decisions
- Modern dark theme with glassmorphism design and custom Mulah brand colors.
- shadcn/ui and Radix UI for components.
- Mobile-optimized UI with bottom navigation, touch-friendly interactions, and responsive design for various screen sizes.
- Two-hub UI redesign (Subscription Hub, Finance Hub) for intuitive navigation.

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL.
- **Replit Auth**: Authentication provider.
- **Node.js**: Backend runtime.

### Financial Services Integration
- **Stripe Issuing**: Virtual card creation and management.
- **Stripe Webhooks**: Payment event processing.
- **Open Banking API**: Transaction synchronization and account access.
- **Klarna API**: BNPL fallback payment processing.

### Frontend Libraries
- **React Ecosystem**: React, React DOM, TypeScript.
- **UI Frameworks**: shadcn/ui, Radix UI, Tailwind CSS.
- **State Management**: TanStack Query, React Hook Form.

### Backend Libraries
- **Express Framework**: Core server framework.
- **Authentication**: passport, openid-client, connect-pg-simple.
- **Database**: drizzle-orm, @neondatabase/serverless.
- **Validation**: zod, drizzle-zod.