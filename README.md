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
├── .devcontainer                 # Dev container configuration
├── README.md
├── requirements.txt              # Python dependencies list for backend
├── .env                          # Stores secrets that are not in VCS
├── deploy.sh                    
└── client/                       # QStack's React frontend
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
| Docker      | `20.x.x`   |
| Python      | `3.9.x`    |

## Setup

### Env

Copy `.env.sample` to `.env` and fill in the necessary values. You should be able to find them on slack.

## Docker

Using [Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers#_quick-start-open-an-existing-folder-in-a-container) are strongly recommended when doing development work on Ballot. Containers are a way of provisioning identical environments from computer to computer and alleviates a lot of headache when it comes to installing dependencies, setting up Postgres, etc...

To use Dev Containers you must first install [Visual Studio Code](https://code.visualstudio.com/) and [Docker](https://www.docker.com/get-started/). Then you must install the [Remote Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension for Visual Studio Code.

To use Docker, install it [here](https://docs.docker.com/get-docker/). To check if your installation is working, try running

```sh
docker run hello-world
```

If you get a message on your screen that starts with "Hello from Docker!", your installation is working.

After that, follow [this tutorial](https://www.youtube.com/watch?v=Uvf2FVS1F8k) to get your environment set up. Make sure you open this repository as a dev container in VSCode.

> Note: It can take a few minutes to provision the container if it is your first time starting it up.

## Development

To start the server, run

```sh
python3 run.py
```

To start the client, in a different terminal, run 
```sh
cd client
npm run dev
```

The client runs on port `6001` and the server runs on port `3001`. You should be able to access the website at `http://localhost:6001`.

## License
Released under [AGPL v3.0](./LICENSE). See LICENSE for more details.
