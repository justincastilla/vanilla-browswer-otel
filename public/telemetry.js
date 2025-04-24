// Import the custom method overriding automatic span generation
import { automaticSpanMethod } from './otelMethods.js';

// Import the WebTracerProvider, which is the core provider for browser-based tracing
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';

// Used to auto-register built-in instrumentations like page load and user interaction
import { registerInstrumentations } from '@opentelemetry/instrumentation';

// Automatically creates spans for user interactions like clicks
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';

// Import the auto-instrumentations for web, which includes common libraries, frameworks and document load
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';

// Document Load Instrumentation automatically creates spans for document load events
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';

// This context manager ensures span context is maintained across async boundaries in the browser
import { ZoneContextManager } from '@opentelemetry/context-zone';

/* Packages for exporting traces */
// SimpleSpanProcessor immediately forwards completed spans to the exporter
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

// Import the OTLP HTTP exporter for sending traces to the collector over HTTP
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// Defines a Resource to include metadata like service.name, required by Elastic
import { Resource } from '@opentelemetry/resources';

// Provides standard semantic keys for attributes, like service.name
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';


export function initTelemetry() {
  const provider = new WebTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'vanilla-frontend',
    }),
  });

  provider.addSpanProcessor(
    new SimpleSpanProcessor(
      new OTLPTraceExporter({
        url: 'http://localhost:8123/v1/traces',
        fetchOptions: {
          credentials: 'include',
        },
      })
    )
  );

  provider.register({
    contextManager: new ZoneContextManager(),
  });

  registerInstrumentations({
    instrumentations: [
      new getWebAutoInstrumentations({
        '@opentelemetry/instrumentation-xml-http-request': {
          applyCustomAttributesOnSpan: automaticSpanMethod
        },
        '@opentelemetry/instrumentation-fetch': {
          applyCustomAttributesOnSpan: automaticSpanMethod,
        },
      }),
    ],
  });

  console.log('OpenTelemetry frontend initialized');
}