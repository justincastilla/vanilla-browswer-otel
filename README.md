# Vanilla Browser OpenTelemetry with Elastic Observability

This project demonstrates a minimal, framework-agnostic example of capturing browser telemetry using OpenTelemetry and sending it to Elastic Observability. It walks through a progression from manual instrumentation, to automatic instrumentation, and a final hybrid approach, showing each step in action. Accompanying slides may be found [here](slides/Linuxfest%20Northwest%20-%20Observability%20is%20for%20Frontend,%20Too!.pdf).



## 1. Installation

```bash
# Clone the repository
git clone https://github.com/justincastilla/vanilla-browser-otel.git
cd vanilla-browswer-otel
npm install
```



## 2. Getting API Keys and Endpoints

You will need credentials for Elastic APM to send telemetry data. Here's how:

1. Log into your [Elastic Cloud Console](https://cloud.elastic.co/).
2. Create or select an existing deployment optimized for Observability.
3. Navigate to **Observability > APM** and note the following:
   - APM Server URL (e.g., `https://<your-deployment>.apm.us-central1.gcp.elastic-cloud.com`)
   - API Key for sending data securely (e.g., `<Bearer your-token here>`)
4. Create a `.env` file in your root directory and copy from `.env.example`:

```bash
cp .env.example .env
```

Then fill in the values:
```bash
ELASTIC_APM_ENDPOINT='https://<your-deployment>.apm.us-central1.gcp.elastic-cloud.com'
ELASTIC_ENDPOINT='Bearer your-token here'
```



## 3. Breakdown of components

### Parcel
Parcel is a fast, zero-config bundler that compiles and serves the frontend JavaScript (like app.js) and HTML (like index.html). It ensures that modern JavaScript syntax works across browsers.

### NGINX
NGINX acts as a reverse proxy server. In this setup, it forwards OpenTelemetry data from the browser to the OpenTelemetry Collector. This solves CORS issues by having a server-side relay.

### OpenTelemetry Collector
The OTEL Collector receives telemetry data from the browser, optionally processes or transforms it, and then exports it to Elastic APM using the OTLP exporter. It decouples instrumentation from backend observability systems.


## 4. Running the Project & Viewing Examples

Ensure your docker container service is started. Run the NGINX reverse proxy server and the OTel Elastic Collector using Docker Compose:
```bash
docker-compose up
```

Open a new tab in your terminal to run the Parcel server:

```bash
npm run dev
```

This will serve `index.html` bundle your `app.js`, which contains various buttons and inputs that emit OpenTelemetry spans based on different types of instrumentation.

Open the browser to `localhost:1234` and open the devtools to the Console view. You will see information appear in when button clicks occur. You can also check the network tab to view traces being sent out with their payloads.


## 5. Exploring Manual and Automatic Instrumentation Progression

To understand the progression of OpenTelemetry instrumentation, follow this step-by-step:

### Step 1: **Manual Instrumentation Only**
- In `app.js`, **comment out** all `registerInstrumentations()` calls.
- Trigger spans via custom JavaScript - a button click manually emits a span using the emitSpan() function.

### Step 2: **User Interaction Instrumentation**
- Uncomment only the `@opentelemetry/instrumentation-user-interaction` registration.
- Try clicking and typing—spans will be generated automatically for these actions.

### Step 3: **Full Web Instrumentation**
- TODO
- TODO

### Final Step: **Weather API Tracing (Hybrid Example)**
- The weather fetch shows hybrid tracing:
  - Automatic fetch instrumentation
  - Manual span enrichment and nesting for fine-grained control

All spans should be visible in Elastic Observability UI under the `vanilla-frontend` servicename.



## License
[Apache 2.0](LICENSE)


Feel free to fork, explore, and extend!

