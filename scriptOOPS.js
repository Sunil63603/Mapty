//Building mapty using OOPS
'use strict';

//<-----------------------------------------MAIN JS CODE--------------------------------->

//contains common things related to running and cycling
class Workout {
  //Parent of running and cycling
  date = new Date();
  id = (Date.now() + '').slice(-10); //earlier i used coords as unique ID.
  //at a time multiple instances will not be created in our scenario.
  //but in real world ,multiple users can create instances at a time,then its not unique.
  clicks = 0;
  //these 3 above variables are class variables(shared by all instances)

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    //'months' is used in popup(marker) and workout plan(schedule)
    //this will be actually pointing to running and cycling classes
    this.description = `${this.type} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++; //instance variable
  }
}

class Running extends Workout {
  type = 'running'; //accessed using 'this' keyword.Is it class/instance variable
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration); //after super() 'this' must be used.
    this.cadence = cadence;

    //function calls inside constructor.
    this.calcPace();
    this._setDescription(); //but method is declared in Workout(Parent) class
  }

  calcPace() {
    //km per min
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;

    this._setDescription();
    this.calcSpeed();
  }

  calcSpeed() {
    //km per hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//////////////
//APPLICATION ARCHITECTURE
const form = document.querySelector('.form'); //selects entire form
const workoutsContainer = document.querySelector('.workouts'); //entire left side bar
const inputType = document.querySelector('.form__input--type'); //1st input box
const inputDistance = document.querySelector('.form__input--distance'); //2nd input box
const inputDuration = document.querySelector('.form__input--duration'); //3rd input box
const inputCadence = document.querySelector('.form__input--cadence'); //4th input box for running
const inputElevation = document.querySelector('.form__input--elevation'); //4th input box for cycling

//////////////////////////////////////////////////////////////////////////////////////
//APPLICATION ARCHITECTURE
//contains all the methods
class App {
  //private instance properties
  #mapDisplay;
  #mapEvent;
  #workouts = [];

  //contains common methods of running and cycling methods/functions
  constructor() {
    this._getPosition(); //here 'this' is being passed to _getPosition().

    //get data from local storage
    this._getLocalStorage(); //theres some problem in this line why?

    //here we will handle eventListeners ,else if handled in functions(then multiple handlers may get attached)
    form.addEventListener('submit', this._newWorkout.bind(this)); //inside event listener 'this' keyword would be pointing to the DOM element(form in this case)

    inputType.addEventListener('change', this._toggleInputField); //toggleInputField doesnt use 'this' keyword

    workoutsContainer.addEventListener('click', this._moveToMarker.bind(this));
  } //called immediately when a new object is created.

  _getPosition() {
    //protected
    if (navigator.geolocation) {
      //this has been passed when _getPosition was called
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), //we are passing this to loadMap() using bind
        function () //in this._loadMap,this is passed from _getPosition()
        {
          alert(`couldnt get the user's geolocation `);
        }
      );
    }
  }

  _loadMap(position) {
    //these are for initial user's location
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    //'this' refers to the App class
    this.#mapDisplay = L.map('map').setView(coords, 7); //we use this to add leaflets event handler

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#mapDisplay);

    //TASK 2

    //adding event listener in normal function,all JS listeners are inside constructor().
    this.#mapDisplay.on('click', this._showForm.bind(this)); //'on' is also similar to eventHandler(ie.this points to map)

    //why here?
    //if any markers present ,they would be displayed when page gets refreshed.
    this.#workouts.forEach(work => {
      this._addMarker(work);
    });
    //the reason we are writing markers here is bcoz we want map to be displayed first
    //else addTo() will throw error.
  }

  _showForm(mapE) {
    this.#mapEvent = mapE; //mapEvent gets assigned here,#mapEvent is used while creating running and cycling objects.
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none'; //first disappears
    form.classList.add('hidden'); //then actual hidden
    setTimeout(() => (form.style.display = 'grid'), 1000); //after 1 second again display = grid.
  }

  _toggleInputField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const isPositive = (...inputs) => inputs.every(input => input > 0); //returns true if all inputs are positive
    //else (...inputs)=>inputs.every(input=>Number.isFinit(input)); understand 'every'

    const isValid = (...inputs) =>
      inputs.every(input => Number.isFinite(input)); //returns true if all inputs are finite(ie.numbers)

    //get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value; //'+' converts string into a number.
    const duration = +inputDuration.value; //these 3 are common for both workouts

    //used whenever user clicks on map
    const { lat, lng } = this.#mapEvent.latlng;

    let workout;

    //if activity is running,create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //check if data is valid
      if (
        !isValid(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      )
        return alert('inputs have to be positive numbers');

      workout = new Running([lat, lng], distance, duration, cadence); //creating a new instance of running class and pushing it into the array
    }

    //if activity is cycling,create cycling object
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      //check if data is valid
      if (
        !isValid(distance, duration, elevationGain) ||
        !isPositive(distance, duration)
      )
        //elevationGain can be negative so,no need to check that
        return alert('inputs have to be positive numbers');

      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }

    //add new object to the workout array
    this.#workouts.push(workout);

    //add marker
    this._addMarker(workout);

    //display workout in sideBar.
    this._displayDetails(workout);

    this._hideForm();

    //set local  storage to all workouts
    this._setLocalStorage();
  }

  _addMarker(workout) {
    L?.marker(workout.coords)
      ?.addTo(this.#mapDisplay)
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
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}` //hence type and description are instance variables.
      )
      .openPopup(); //these methods are chainable,bcoz every method return 'this'
  }

  _displayDetails(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id //id is generated when instance of Workout class created.
      //workout is latest
    }">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'
            }</span>
            <span class="workout__value">${workout.distance}</span
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running')
      html += `<div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span
          <span class="workout__unit">km/min</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span
          <span class="workout__unit">spm</span>
        </div>
      </li>`;

    if (workout.type === 'cycling')
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span
      <span class="workout__unit">m</span>
    </div>`;
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToMarker(e) {
    if (!this.#mapDisplay) return; //if the map is not displayed/loaded just return.

    const workoutEl = e.target.closest('.workout'); //we get the main tag of workout's html structure.

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    //workouts array contains workout objects

    //get the coords present inside workout
    this.#mapDisplay.setView(workout.coords, 10, {
      //to navigate to location of the workout
      pan: { duration: 3 }, // Animation duration in seconds
      animate: true, // Enable animation
    });

    // using the public interface
    // workout.click();
    //after lossing prototypal chain,workout.click() would throw an error.
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts)); //storing sting
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts')); //parse.

    if (!data) return; //nothing to display just return

    this.#workouts = data;

    this.#workouts.forEach(workout => {
      this._displayDetails(workout); //we are adding markers as soon as the map is loaded.
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
//TASK 1:display users location

//TAKS 2:when clicked on map(2.1:show form,2.2:focus on 2nd input box,2.3:changeInputBox,)

//TASK 3:sequence of events when form is submitted.(3.1:hide form,3.2:add marker,3.3:clear inputs,3.4:disable inputs,3.5:display workout)
