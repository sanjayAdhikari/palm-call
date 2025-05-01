# evolv
Palm Backend Boilerplate
## Table of Contents

- [Project Description](#project-description)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
    - [Installation](#installation)
    - [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [License](#license)

## Project Description

Project Description
## Features

List the key features of your application.

- Event Digitalizing
- Quest Hunt & Reward Collection
- NFT and TOTEM

## Prerequisites

Before you begin, ensure you have met the following prerequisites:

- **Node.js and npm**: Make sure you have Node.js (version 20.3.0 or higher) and npm (version 9.6.7 or higher) installed on your system. You can download them from [Node.js Downloads](https://nodejs.org/).

  You can verify the installation by running the following commands in your terminal:

  ```bash
  node -v
  npm -v

## Getting Started
Follow these steps to get this application up and running.

### Installation

```bash
#### Clone the repository
git clone https://github.com/EvolvNFT/evolv-backend.git

# Change Directory: Navigate to the project directory:
cd evolv-backend

# Install Dependencies: Use npm to install the project dependencies:
npm install
```

### Configuration
```
cp .env.dev .env
```
Edit the .env file with your configuration values.


### Seed Database
```
npm run seed
```
This command will build the typescript and run seed configuration

## Usage
```bash
# Start the Application: To start your Node.js application, run the following command:
npm start


# Testing: To run tests (if available), use the following command:
npm test

#Development: During development, you can use the following command to start the application with hot-reloading for TypeScript files:
npm run run
```

## Project Structure
Here's an overview of the project structure:
```
├── evolv/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   │   ├── constant.ts
│   │   │   ├── error_string.config.ts
│   │   │   ├── route_url.config.ts
│   │   │   └── seed/
│   │   │       └── admin.seed.config.ts
│   │   ├── controller/
│   │   ├── database/
│   │   │   ├── connection.ts
│   │   │   ├── index.ts
│   │   │   ├── model/
│   │   │   └── repository/
│   │   ├── interface/
│   │   ├── middleware/
│   │   │   ├── access.middleware.ts
│   │   │   ├── client_logging.middleware.ts
│   │   │   ├── index.ts
│   │   │   ├── parseValidation.middleware.ts
│   │   │   └── passport.middleware.ts
│   │   ├── route/
│   │   ├── service/
│   │   │   ├── seed
│   │   │   ├── api_service
│   │   │   ├── validation
│   │   └── utils/
│   │   │   ├── jwt
│   │   │   ├── helper.ts
│   ├── package.json
│   ├── .env.dev
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── README.md
│   ├── Makefile
│   ├── docker-compose.production.yml

```
## License

This software is closed-source and proprietary. All rights to the software and its source code are reserved by Palm Pte Ltd. Unauthorized use, distribution, or copying of this software is strictly prohibited.

For licensing inquiries or other questions, please contact Palm Pte Ltd. at [info@evolv.arts].



