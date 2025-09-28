# EV Charging Management App

This is a Next.js React and TypeScript application designed to simulate a white-label app where customers can manage their electricity usage, specifically focusing on planned charging for their electrical vehicles.

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
# or
yarn install
yarn dev
# or
pnpm install
pnpm dev
# or
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Application Overview

The app currently consists of one page that simulates a car interface. The car has several key properties and states:

- **Nickname**: A user-friendly name for the vehicle
- **Model**: The car model information
- **State of charge**: Current battery percentage
- **Connection status**: Whether the car is plugged in or not

### Core Functionality

#### Plug/Unplug Simulation

Users can plug and unplug the car using a button in the top right-hand corner. While this is a UI interaction in the app, it simulates the physical interaction that would occur between a vehicle and charger in the real world.

#### Dashboard Information

The app displays several key metrics:

- Current state of charge (battery percentage)
- Connection status (plugged in or unplugged)
- Current charging rate (mocked data)
- Time remaining until charge completion
- Historical charging data
- Event history of all car interactions

#### Intelligent Charging Scheduling

When a user plugs in the car for the first time, the system kicks off a background job to calculate the optimal time to schedule charging. This scheduling logic is currently mocked and set to start approximately 5 seconds after plugging in for demonstration purposes.

The charging process follows these rules:

1. **Target Charge**: The system charges until it reaches the target charge level (currently hard-coded to 85%)
2. **User Control**: Users can stop charging at any time, which suspends charging until 6:00 AM the following day
3. **Resume Logic**: If the user starts charging again after stopping, it will charge for exactly one hour before stopping
4. **Rescheduling**: After the one-hour charge period, the system attempts to find the nearest optimal schedule time

#### Event History

The application maintains a complete history of all events that have occurred with the car, allowing users to:

- Track what has happened to their vehicle
- Debug any issues that may arise
- Review charging patterns and decisions

## Technical Implementation

### State Management

The core of the application is built around a state machine implemented in the ChargingState reducer (`src/components/charging-state.tsx`). This handles all the logic around:

- Charging transitions
- Schedule management
- User interactions
- Event logging

The state management logic is tested in `src/components/charging-state.test.ts` to ensure edge cases are properly handled.

### Technology Stack

- **Framework**: Next.js with React
- **Language**: TypeScript for type safety
- **State Management**: React's `useReducer` hook for complex state logic
- **Side Effects**: `useEffect` hooks for timeouts and intervals that simulate charging behavior
- **Styling**: Modern, mobile-friendly UI components using shadCN UI.

### Development Approach

#### Assumptions Made

- **Linear charge rate**: The charging simulation assumes a consistent, linear charging rate rather than the real-world curve where charging slows as the battery approaches full capacity
- **Mocked data**: All charging rates, scheduling calculations, and timing are currently simulated rather than connected to real systems

#### Time Investment Focus

The majority of development time (approximately 2-3 hours) was spent on:

1. **State machine logic**: Building a robust charging state reducer that handles all edge cases
2. **Testing**: Ensuring the state transitions work correctly under various scenarios
3. **Foundation setting**: Establishing solid patterns for state management and event handling

#### UI Development Strategy

The development followed a pragmatic approach:

1. Started with a super minimal UI to focus on core functionality
2. Used AI tools (Claude Code) to iteratively improve the interface
3. Built out a more attractive but still simple and minimalistic design
4. Ensured mobile-friendly responsive design

This approach demonstrates the value of setting strong technical foundations first, then leveraging AI tools to handle more straightforward tasks like UI refinement and styling.

## Future Architecture Considerations

### Backend Integration

A continuation of this project in a separate branch explores adding a full backend using Convex, which provides:

- Real-time database capabilities
- Scheduling functions
- Serverless function execution
- Live state management across multiple clients
  I haven't included it here as this took me beyond 2-3 hours.

### Real-World Implementation

In a production system, the architecture would likely include:

#### Event Streaming

- **Vehicle Events**: Cars would send event streams about their status, charge level, and connection state
- **Charger Events**: Charging stations would communicate their availability, power delivery status, and any errors
- **Message Queues**: Systems like RabbitMQ or MQTT would handle real-time event ingestion and distribution

#### Backend Services

- **Event Ingestion**: Database systems to capture and store all incoming events
- **Scheduling Engine**: Backend services to calculate optimal charging times based on:
  - Grid demand and pricing
  - User preferences and schedules
  - Vehicle requirements and constraints
- **Real-time Processing**: Systems to react to events and trigger appropriate responses

#### Data Architecture

- **Event Store**: Complete audit trail of all vehicle and charging events
- **Analytics Database**: Aggregated data for reporting and optimization
- **Configuration Management**: User preferences, vehicle profiles, and charging rules
