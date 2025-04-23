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
import { diag, DiagConsoleLogger, DiagLogLevel, context, trace} from '@opentelemetry/api';

// Defines a Resource to include metadata like service.name, required by Elastic
import { Resource } from '@opentelemetry/resources';

// Provides standard semantic keys for attributes, like service.name
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

import { automaticSpanMethod } from './otelMethods.js';

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
    new getWebAutoInstrumentations({
      '@opentelemetry/instrumentation-xml-http-request': {
        applyCustomAttributesOnSpan: automaticSpanMethod
      },
      // Add fetch instrumentation with custom span attributes 
      '@opentelemetry/instrumentation-fetch': {
        applyCustomAttributesOnSpan: automaticSpanMethod,
      },
    }),
    new UserInteractionInstrumentation({
      eventNames: ['click'], // instrument click events only
    }),
  ],
});


const tracer = trace.getTracer('vanilla-frontend');


const weatherApiKey = process.env.WEATHER_API_KEY;


const renderWeather = (data) => {
  const weatherContainer = document.querySelector('#weather');
  const { location, current } = data;

  const {
    name,
    region,
    country
  } = location;

  const { temp_f } = current;

  weatherContainer.innerHTML = `
    <h2>Weather in ${name}, ${region}, ${country}</h2>
    <p>Temperature: ${temp_f}°F</p>`
  
  weatherContainer.style.display = 'block';

  return weatherContainer;
}
      
  
document.querySelector('#getWeather').addEventListener('click', async () => {
  const input = document.querySelector('#weatherInput').value;
  let weatherEndpoint = `http://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${input || 98366}&aqi=yes`;

  try {
    const response = await fetch(weatherEndpoint);

    // 👇 Clone it *before* reading the body
    const cloneForApp = response.clone();

    const data = await cloneForApp.json(); // your app uses this one
    console.log('Weather data:', data);

    const weatherContainer = renderWeather(data);
    console.log('Weather container:', weatherContainer);

    const checkWeatherButton = document.querySelector('#getWeather');
    checkWeatherButton.insertAdjacentElement('afterend', weatherContainer);

    return response; // return the original, untouched version for OTEL
  } catch (e) {
    console.error('Error fetching weather data:', e);
  }
});


window.sendPOST = async (input) => {
  fetch('https://httpbin.org/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  }).then((response) => {
    return response.json();
  }).catch((error) => {
    console.error('Error sending POST request:', error);
  }
  ).finally(() => {
    console.log('POST request completed');
  });
}

const subFunction = () =>{
  const tracer = trace.getTracer('vanilla-frontend');

  // Start a span in the currently active context
  const span = tracer.startSpan('emitSpan.subfunction');

  // Optional: run in context if you have async work
  context.with(trace.setSpan(context.active(), span), () => {
    span.setAttribute('sub.key', 'subvalue');
    span.setAttribute('result', 1);
    span.end();
  });

  return 1;
}

// Manual span emitter tool for debugging
window.emitSpan = (action, value) => {

  const parent = trace.getSpan(context.active());

  const span = tracer.startSpan(action, {
    parent: parent?.spanContext(), // this helps propagate parent trace
  });

  // Run the span within the active context
  context.with(trace.setSpan(context.active(), span), () => {
    span.setAttribute('action', action);
    if (value !== undefined) {
      span.setAttribute('value', value);
    }
    console.log(`Manual span '${action}' emitted`);
    subFunction(span);
    span.end();
  });
};

document.querySelector('#button1').addEventListener('click', () => {
  emitSpan('user.clicked.#button1', '#button1');
});


document.querySelector('#slider').addEventListener('click', () => {
  // emitSpan('user.clicked.slider', 'slider');
});






// and some test
const btn1 = document.createElement('button');
btn1.append(document.createTextNode('btn1'));
btn1.addEventListener('click', () => {
  console.log('clicked');
});
document.querySelector('body').append(btn1);

const btn2 = document.createElement('button');
btn2.append(document.createTextNode('btn2'));
btn2.addEventListener('click', () => {
  getData1('https://httpbin.org/get').then(() => {
    getData2('https://httpbin.org/get').then(() => {
      console.log('data downloaded 2');
    });
    getData1('https://httpbin.org/get').then(() => {
      console.log('data downloaded 3');
    });
    console.log('data downloaded 1');
  });
});
document.querySelector('body').append(btn2);


// Example using XMLHttpRequest instead of fetch
function getData1(url) {
  return new Promise(async (resolve) => {
    const req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.setRequestHeader('Accept', 'application/json');
    req.send();
    req.onload = function () {
      resolve();
    };
  });
}

async function getData2(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // You can return parsed data or just the response
    // return await response.json(); // if you want the actual data
    return response; // if you only need the response object
  } catch (error) {
    console.error('Error in getData:', error);
  }
}

console.log('OpenTelemetry frontend initialized');
