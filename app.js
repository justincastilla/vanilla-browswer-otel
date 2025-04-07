/* OpenTelemetry Front-End packages */

// Import the WebTracerProvider, which is the core provider for browser-based tracing
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';

// Used to auto-register built-in instrumentations like page load and user interaction
import { registerInstrumentations } from '@opentelemetry/instrumentation';

// Document Load Instrumentation automatically creates spans for document load events
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';

// Automatically creates spans for user interactions like clicks
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';

// Import the auto-instrumentations for web, which includes common libraries, frameworks and document load
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';

// This context manager ensures span context is maintained across async boundaries in the browser
import { ZoneContextManager } from '@opentelemetry/context-zone';

/* Packages for exporting traces */
// SimpleSpanProcessor immediately forwards completed spans to the exporter
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

// Import the OTLP HTTP exporter for sending traces to the collector over HTTP
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// These help with logging, diagnostics, and traces
import { diag, DiagConsoleLogger, DiagLogLevel, trace} from '@opentelemetry/api';

// Defines a Resource to include metadata like service.name, required by Elastic
import { Resource } from '@opentelemetry/resources';

// Provides standard semantic keys for attributes, like service.name
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';


// Enable OpenTelemetry debug logging to the console
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// Define resource metadata for the service, used by exporters (Elastic requires service.name)
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'vanilla-frontend',
});

// Configure the OTLP exporter to talk to the collector via nginx
const exporter = new OTLPTraceExporter({
  url: 'http://localhost:8123/v1/traces', // nginx proxy
  fetchOptions: {
    credentials: 'include', // needed for cookies/CORS handling if relevant
  },
});

// Instantiate the trace provider and inject the resource
const provider = new WebTracerProvider({ resource });

// Send each completed span through the exporter
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

// Register the provider and set up the async context manager for spans
provider.register({
  contextManager: new ZoneContextManager(),
});

// Enable automatic span generation for document load and user click interactions
registerInstrumentations({
  instrumentations: [
    // Automatically tracks when the document loads
    new DocumentLoadInstrumentation(),
    new getWebAutoInstrumentations(),
    new UserInteractionInstrumentation({
      eventNames: ['click'], // instrument click events only
    }),
  ],
});

// Manual span emitter tool for debugging
window.emitSpan = (action, value) => {
  const tracer = trace.getTracer('frontend');
  const span = tracer.startSpan(action);
  span.setAttribute('action', action);
  span.end();
};

console.log('OpenTelemetry frontend initialized');
