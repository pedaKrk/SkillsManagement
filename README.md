# Skills Management
This project consists of an Angular frontend and an Express.js backend. Below are the instructions to set up and run the project.

## Prerequisites

### Before setting up the project, ensure you have the following installed:

-   [Node.js](https://nodejs.org/en) (LTS version recommended)

-   [npm](https://www.npmjs.com/) (comes with Node.js)

-   [Angular CLI](https://angular.dev/tools/cli) (for frontend development)

### Install Angular CLI globally (if not already installed):

`npm install -g @angular/cli`

## Backend Setup (ExpressJS)

### Navigate to the backend folder and install dependencies:

```
cd backend
npm install
```

## Frontend Setup (Angular)

### Navigate to the frontend folder and install dependencies:

```
cd ../frontend
npm install
```

## Environment Variables
Create a **.env.development.local** file in the backend folder.
The **env.js** file in the config folder makes those variables easily accessible in 
the backend of the project.
Take a look at the **env.js** file to see what variables are required.

The env.development.local file should contain parameters for:
- Database
- SMTP-Server
- Ports
- JWT

By default, the backend runs on Port **3000** and the frontend on Port **4200**.

## Run the Project
Execute `npm start` from the root of the project.
This starts the server by default on http://localhost:3000/ and the Angular app on http://localhost:4200/ by default.

## Project Structure
The project is divided in frontend and backend.
When installing new packages, make sure to install them in the corresponding folder,
so that there is no node_modules folder in the root of the project.

### Backend
The backend is divided in a routes-, controller-, services- and models-folder.
- add new routes using express-router
- each route file should have its own controller
- services inside the services folder
- if necessary, change the mongoose-schemas in the models folder

### Frontend
The frontend is using angular.
Make sure to create **reusable** Components and reuse them via dependency injection.

## Contributors
- [Peter Karkulik](https://github.com/pedaKrk)
