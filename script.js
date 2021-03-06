"use strict";

// prettier-ignore

class Workout {
  // Instance public properties that doesn't need to recieve its value from the constructor function
  date = new Date();
  // calling the Date() constructor function with the keyword new returns a date object; that is an object that contains data about the date of instantiation
  // date object looks like this: Wed Jan 26 2022 13:35:34 GMT+0200 (Eastern European Standard Time)

  id = (Date.now() + "").slice(-10);
  // built-in class/constructor function that has useful properties and methods.

  // the constructor function is a function that gets called once a new object is created from this class with the "new" keyword with the "this" keyword set to the newly created object

  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  
  _setDescription() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
 
  // This method was to show that objects retrieved from localStorae will lose their prototype chain 
  // click() {
  //   this.clicks++;
  // }
}

// const workout1 = new Workout([12, 13], 14, 15);
// const workout2 = new Workout([22, 24], 124, 215);
// console.log(workout1, workout2);..

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    // the super function calls the constructor function of the parent class and sets the "this" keyword for the child class
    super(coords, distance, duration);
    this.cadence = cadence;

    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    // returns the pace property for chaining methods purposes
    return this.pace;
  }
}

// const running1 = new Running([13, 12], 1, 2, 6);
// console.log(running1);

class Cycling extends Workout {
  type = "cycling";
  // It's necessary to have constructor function in child class if we want to add more properties
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// The "this" keyword in the class method body is replaced with the object that is calling the method

//////////////////////////////////////////////////////////
// Application architecture

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers

    // The "this" keyword inside an event listener callback function is set to the DOM element onto which it is attached

    form.addEventListener("submit", this._newWorkout.bind(this));

    inputType.addEventListener("change", this._toggleElevationField);

    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      // API is an interface (????????) which has a set of functions that allow programmers to access specific data or features of another application, operating system or others.

      // Another definition of APIs: APIs are constructs made available in programming languages to allow developers to create complex functionality more easily. They abstract more complex code away from the programmer, providing some easier syntax to use in its place.

      // JavaScript APIs are not part of the language itself, rather they are built on top of the JavaScript language

      // Client-side JavaScript APIs generally fall into two categories:
      // 1) Browser APIs: are built into the web browser and are abole to expose data from the browser and the machine and do useful complex things with it.
      // 2) Third-party APIs: are not built into the browser by default, and you generally have to retrieve their code and information from somewhere on the web.

      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        // this._loadMap,
        // why did I have to do .bind(this)??

        // Because the _loadMap method doesn't get called by any object so that the "this" keyword gets assigned to. It gets called by the getCurrentPosition method so the "this" keyword is set to undefined.

        function () {
          alert("Could not get your position.");
        }
      );
    }
  }

  // The function that the getCurrentPosition method calls gets access to an object (which we here called it position) that has access to the data recieved about the end user's position.

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.fr/hot/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker(coords).addTo(this.#map).bindPopup("Reham lives here").openPopup();

    // Handling clicks on map
    this.#map.on("click", this._showForm.bind(this));

    this.#workouts.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm() {
    // Empty the inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";

    form.style.display = "none";
    form.classList.add("hidden");
    // setTimeout() calls the callback function after a certain amount of time
    setTimeout(() => ((form.style.display = "grid"), 1000));
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);
    e.preventDefault();
    // Get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;

    let workout;
    // If workout is running create running object
    if (type === "running") {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("Inputs have to be positive numbers!");
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // If workout is cycling create cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert("Inputs have to be positive numbers!");
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // Add new object to the workout array
    this.#workouts.push(workout);
    // Render workout on map
    this._renderWorkoutMarker(workout);
    // Render workout on list
    this._renderWorkout(workout);
    // Hide the form + clear input fields
    this._hideForm();
    // Set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "????" : "????"} ${workout.description}`
      )
      .openPopup();
  }

  // we use data html attributes to build a bridge between the UI and the data in our application

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === "running" ? "????" : "????"
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">???</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
      `;

    if (workout.type === "running") {
      html += `
              <div class="workout__details">
                <span class="workout__icon">??????</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">????????</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
              </div>
           </li>`;
    }

    if (workout.type === "cycling") {
      html += `
     <div class="workout__details">
      <span class="workout__icon">??????</span>
      <span class="workout__value">${workout.speed.toFixed(1)} </span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">???</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }
    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");

    // guard clause
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel),
      {
        animate: true,
        pan: {
          duration: 1,
        },
      };

    // using the public interface
    // workout.click();
    // console.log(workout);
  }

  // we shouldn't use local storage to store large amounts of data because that will slow down the application

  _setLocalStorage() {
    localStorage.setItem("workout", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workout"));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem("workout");

    // location is a big object that contains a lot of methods and properties regarding the browser
    location.reload();
  }
}

const app = new App();

/*
The architecture is about giving the project a structure and in that structure we can develop the functionality

One of the most important aspects of any architecture is to decide where and how to store data - data is the most fundamental part of any application

-- 

The architecture is about how to implement the features while the flowchart is about what to implement (high-level overview)


*/

// Implementing classes to manage the data that is coming from the UI
