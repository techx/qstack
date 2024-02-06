<h1 align="center">QStack</h1>

<div align="center">
	<a href="#overview">Overview</a>
  <span> • </span>
    	<a href="#setup">Setup</a>
  <span> • </span>
    	<a href="#development">Development</a>
  <span> • </span>
        <a href="#license">License</a>
  <p></p>
</div> 

QStack is HackMIT's mentor & help queue platform.

## Overview

QStack uses [Flask](https://flask.palletsprojects.com/en/2.2.x/) for its backend framework and uses [React](https://reactjs.org) for its frontend framework.

### Directory Overview

```
qstack/
├── Dockerfile.backend            # Docker files that set up
├── Dockerfile.frontend           # the dev environments
├── docker-compose.yml            # Docker Compose lets them work together and talk to each other
├── README.md
├── requirements.txt              # Python dependencies list for backend
├── .env                          # Stores secrets that are not in VCS
├── deploy.sh                    
└── client/                       # QStack's React frontend
│   ├── yarn.lock         
│   ├── index.html         
│   ├── vite.config.js            # Frontend config for local deployment
│   ├── tsconfig.json             # Config for TypeScript
│   ├── tailwind.config.js        # Config for Tailwind CSS
│   ├── postcss.config.js         # Config for Post CSS
│   ├── package.json              # Node.js dependencies list for frontend
│   ├── public/                   # All the static files that are served by backend in prod
│   └── src/                      # Frontend source
│       ├── api/                  # API routes
│       ├── components/           # Bulk of QStack's UI components
│       ├── hooks/                # Webhook, custom callbacks
│       ├── routes/               # Main pages and routing
│       ├── config.jsx            # QStack's client configuration, modified every cycle
│       ├── index.css             
│       ├── App.jsx               # Code that renders everything
│       └── main.jsx              # Code that renders everything
└── server/                       # QStack's backend folder
    ├── __init__.py               # Has all the setup code for backend
    ├── config.py                 # Holds config for application
    ├── controllers/              # Folder for API endpoints
    │   ├── auth.py               # Router for /api/auth 
    │   ├── queue.py              # Router for /api/queue
    │   └── ticket.py             # Router for /api/ticket
    ├── models/                   # Database ORM schemas for Postgres
    └── data/
        └── tagslist.csv          
```

### Requirements

If you are developing using [Docker](https://docs.docker.com/get-started/) (see setup instructions below), the only requirement you need to install is Docker itself. Otherwise you will need the following versions of the following tools:

| Requirement | Version    |
|-------------|------------|
| Node.js     | `18.x.x`   |
| Yarn        | `1.x.x`    |
| Docker      | `20.x.x`   |
| Python      | `3.9.x`    |

## Setup

### Env

Fill in the `.env` file (should be able to find it on Slack). 
```env
FRONTEND_URL=""
BACKEND_URL=""

AUTH0_SECRET_KEY=""
AUTH0_CLIENT_ID=""
AUTH0_CLIENT_SECRET=""
```
## Setup

This webapp uses [Docker](https://docs.docker.com/get-started/) to make managing all these different technologies and installation/setup a (hopefully better) experience. So you'll need to install it by following the instructions [here](https://docs.docker.com/get-docker/). If you'd like a slimmer installation, there are options for just the command-line interface through Homebrew if you're on a Mac, or any Linux package manager. It also uses Postgres, so please have Postgres and Node.js installed.

### Clone

The first step to contributing to any project with git is to clone it! Navigate to the folder in your terminal where you want to store qstack and run:

```sh
git clone https://github.com/techx/qstack
```

Now you'll have a local copy of the project in `qstack/`.

### Start it!

Now get into your `qstack/` directory and run one simple command:

```sh
cd qstack
docker compose up
```

This will download all the necessary dependencies for React, Flask, and Postgres onto their separate Docker containers, and then connect them all together so they can talk to each other! After you see qstack-frontend-1 print "project is running at http://...", you should be able to go to `http://localhost:6001` and see Qstack's webpage! The Flask webserver should be at `http://localhost:3001` (though it won't have a landing page). 

Now you can start editing the frontend or backend, and see changes reflected!

### Developing with Docker

Once you're done you can stop all the containers by pressing Ctrl+C on your keyboard. You'll notice by default, running `docker compose up` will connect your terminal to all the terminals of each container (frontend, backend, database) and kind of capture it. You'll see the log outputs of each. But you might want to run it in the background without seeing all of it. You can run in _detached_ mode with:

```sh
docker compose up -d
```

Then you can stop them by running a separate command instead of Ctrl+C:

```sh
docker compose down
```

And then when you need to check on a specific container's logs you can first find the container's name (usually something like `qstack-frontend-1` or `qstack-backend-1` depending on what you want):

## Development

Note that you when you pull changes, the Dockerfile may have changed. It's always good to run

```sh
docker compose up --build
```

after a pull to rebuild images.

## License
Released under [AGPL v3.0](./LICENSE). See LICENSE for more details.
