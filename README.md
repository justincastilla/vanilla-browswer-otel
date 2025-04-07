# Vanilla Browser Otel example

This is a simple example of instrumentation with Open Telemetry in the Browser. It is not attached to any particular framework, but relies on parcel to bundle a frontend Javascript file `app.js` with a simple `index.html` file.

To address CORS, the span request from `app.js` is routed through an nginx reverse proxy server, which then forwards to the request to an Open Telemetry Collector, which sends the Observability data to an Elastic Observability endpoint.

## Installation and Startup

You will need an Elastic account with an `APM` endoint and token.

Change the name of the `.env.example` file to `.env` and replace the variable values with your own endpoint and token values.

### Start the OTel collector & nginx servers

In the root level of the repository, run this docker command:

```bash 
$ docker compose up --build
```

This will start the Otel Collector server, which reads the .env file to populate the endpoint and token values. This will then start the nginx server.

### Start the parcel bundler server

From the roote level of the repository, run this node.js command to start your dev server:

```bash
$ npm run dev
```
This will bundle and serve a page at `http://localhost:1234`. You should now be able to interact with the page and view trace information in your devtools network panel, docker logs, and on the Elastic Observability page as well.
