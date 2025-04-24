// Context and trace are used to manage the current context and create spans
import { context, trace } from '@opentelemetry/api';
// Import telemetry initilization function
import { initTelemetry } from './telemetry.js';

initTelemetry();

const tracer = trace.getTracer('vanilla-frontend');
const weatherApiKey = process.env.WEATHER_API_KEY;


const getDataCascade = () => {
  getData1('https://httpbin.org/get').then(() => {
    getData2('https://httpbin.org/get').then(() => {
      console.log('data downloaded 2');
    });
    getData1('https://httpbin.org/get').then(() => {
      console.log('data downloaded 3');
    });
    console.log('data downloaded 1');
  });
}

// Example using XMLHttpRequest instead of fetch
const getData1 = (url) => {
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

const getData2 = async (url) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Error in getData:', error);
  }
}

// Manual span emitter tool for debugging
const emitSpan = (action, value) => {
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
    subFunction(action);
    span.end();
  });
};

const subFunction = (action) => {
  const tracer = trace.getTracer('vanilla-frontend');
  const span = tracer.startSpan(`${action}.subfunction.emitSpan`);

  // Optional: run in context if you have async work
  context.with(trace.setSpan(context.active(), span), () => {
    span.setAttribute('sub.key', 'subvalue');
    span.setAttribute('result', 1);
    span.end();
  });
  // this return value will show up in the span as a result numeric_label type
  return 1;
}

const renderWeather = (data) => {
  const weatherContainer = document.querySelector('#weather');

  const { location, current } = data;
  const { name, region, country }  = location;
  const { temp_f } = current;

  weatherContainer.innerHTML = `
    <h2>Weather in ${name}, ${region}, ${country}</h2>
    <p>Temperature: ${temp_f}°F</p>`
  
  weatherContainer.style.display = 'block';

  return weatherContainer;
}
      
const getWeather = async (input) => {
  let weatherEndpoint = `http://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${input || 98366}&aqi=yes`;
  try {
      const response = await fetch(weatherEndpoint);
      const cloneForApp = response.clone();
      const data = await cloneForApp.json();
      const weatherContainer = renderWeather(data);
      const checkWeatherButton = document.querySelector('#getWeather');
      checkWeatherButton.insertAdjacentElement('afterend', weatherContainer);

      return response;
    } catch (e) {
      console.error('Error fetching weather data:', e);
    }
  }
  
document.querySelector('#getWeather').addEventListener('click', () => {
  const input = document.querySelector('#weatherInput').value;
  getWeather(input)
});

document.querySelector('#button1').addEventListener('click', () => {
  emitSpan('user.clicked.#button1', '#button1');
});

document.querySelector('#slider').addEventListener('click', () => {
  emitSpan('user.clicked.slider', 'slider');
});

document.querySelector('#button2').addEventListener('click', () => {
  getDataCascade()
});
