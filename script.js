'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
//'months' is used in popup(marker) and workout plan(schedule)

const form = document.querySelector('.form'); //selects entire form
const containerWorkouts = document.querySelector('.workouts'); //entire left side bar
const inputType = document.querySelector('.form__input--type'); //1st input box
const inputDistance = document.querySelector('.form__input--distance'); //2nd input box
const inputDuration = document.querySelector('.form__input--duration'); //3rd input box
const inputCadence = document.querySelector('.form__input--cadence'); //4th input box for running
const inputElevation = document.querySelector('.form__input--elevation'); //4th input box for cycling
const map = document.getElementById('map'); //entire right side (mapContainer)
const workoutsContainer = document.querySelector('.workouts');

let mapDisplay; //this is original map variable.(to interact with leaflet library)
let currentDate; //used this for marker and  to display workout plan
let coords; //array which contains latitude and longitude
// let html; //used to store html structure to display in sideBar.
let i = 0;
let workouts = []; //array of all created workouts

let inputTypeValue = inputType.value; //used in many occassions
//above variable is used in popup(marker),to change 4th input box,used to display in workout plan

//Functions
//F1
function successCallBack(position) {
  //user's approximate location

  //destructuring objects
  const { latitude } = position.coords;
  const { longitude } = position.coords;

  //storing in array
  coords = [latitude, longitude];

  // Create a map centered at [latitude, longitude] with a specified zoom level
  mapDisplay = L.map('map').setView(coords, 5);
  //'L' is global variable of leaflet.js,hence script.js can access global vaiables of other js files.
  // .map() is object of leaflet library.
  //(map) is html element ie.div
  //setView takes two parameters(center,zoom)

  // Add a tile layer from OpenStreetMap
  L.tileLayer(
    'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    {}
  ).addTo(
    mapDisplay //here both tile layer and mapDisplay are combined to display complete map
  ); //here 's' is subdomain 'z' is zoom and 'x,y' are co-ordinates.

  // TASK 2:display marker where user clicks,but before that a form should take all the inputs from user.
  mapDisplay?.on('click', handleClick);

  //TASK 3
  workoutsContainer.addEventListener('click', function (e) {
    if (form.classList.contains('hidden')) {
      //form should be hidden(else clicks on form input boxes are considered as 'click')
      const clickedWorkout = e.target.closest('.workout'); //gets closest parent with class 'workout'
      const newCoords = clickedWorkout?.dataset.coords; //returns a string
      const originalCoords = newCoords
        .replace('LatLng(', '')
        .replace(')', '')
        .split(',')
        .map(parseFloat); //convert string into array

      mapDisplay.flyTo(originalCoords, 10, {
        //to navigate to location of the workout
        duration: 4, // Animation duration in seconds
        easeLinearity: 0.25, // Affects the easing of the animation
        animate: true, // Enable animation
      });
    }
  });
} //end of successCallBack

//F2
function handleClick(event1) {
  //'on' belongs to leaflet library not JS
  //TASK 2.1:user has clicked on map,now display form
  form.classList.remove('hidden'); //remove hidden class from form
  inputsDisable(false); //input boxes will take input now.

  //based on inputTypeValue,need to change last input box
  inputType.oninput = changeInputBox();

  // these changes must occur when form is submitted.(check whether all input boxes are filled or not)
  //after submission,4 changes must happen(1.marker with popup 2.take inputs from form(but input box should change for running/cycling) 3.form values displayed like workout plan in sidebar 4.form should disappear  5.and also disable the input boxes of form,or else input would be taken)
  form.addEventListener('submit', function handleSubmit(event2) {
    form.removeEventListener('submit', handleSubmit); //bcoz where time mapDisplay.on() is executed,one eventListener is added.remove previous listener()
    //when form is submitted these changes takes place.(check whether all input boxes are filled or not)
    event2.preventDefault(); //to prevent refreshing of the page.

    //TASK 2.1.1:now set marker on the spot and a Pop up message which contains all the workout type(form-input-type) and month - date.
    displayMarker(event1);

    //TASK 2.1.2:take inputs from submitted form(they are already stored in reference variables for respective inputs.)
    //store running and cycling in array(data-set has 0 for running and 1 for cycling.)

    //TASK 2.1.3:now based on inputs display one workout plan in side bar
    displayWorkout();

    //TASK 2.1.4:(before hidding form,clear the inputboxes)
    clearInputs();
    form.classList.add('hidden'); //add hidden class for form

    //input boxes will not  take input now.
    inputsDisable(true);
  });
}

//F3
function changeInputBox() {
  //if you want to use addEventListener(),multiple listeners would be added on each click on map.
  // inputTypeValue = inputType.value; //is this line considered as inputType changed?
  if (inputTypeValue === 'running') {
    //add hide to elevGain(cycling),and remove hide to cadence(running)
    form
      .querySelector(`[data-index = "1"]`) //hide cycling input
      .classList.add('form__row--hidden');

    form
      .querySelector(`[data-index = "0"]`) //remove hide to running input
      .classList.remove('form__row--hidden');
  } else {
    form
      .querySelector(`[data-index = "0"]`) //hide running input
      .classList.add('form__row--hidden');

    form
      .querySelector(`[data-index = "1"]`) //remove hide cycling input
      .classList.remove('form__row--hidden');
  }
}

//F4
function displayMarker(event1) {
  coords = event1.latlng; //coordinates of the click.
  //latlng returns an array.

  //to display month and date in popup of the marker
  currentDate = new Date();

  L.marker(coords)
    .addTo(mapDisplay)
    .bindPopup(
      `${inputType.value} on ${
        months[currentDate.getMonth()]
      } ${currentDate.getDate()} `
    )
    .openPopup();
} //while displaying marker the coords and workout plan should be binded together.(link both of them)

//F5
function displayWorkout() {
  let html = `<li class="workout workout--${
    inputType.value
  }" data-id="123456789${
    inputType.value === 'running' ? 0 : 1
  }"  data-coords="${coords}">
      <h2 class="workout__title">${inputType.value} on ${
    months[currentDate.getMonth()]
  } ${currentDate.getDate()}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          inputType.value === 'running' ? '🏃‍♂️' : '🚴‍♂️'
        }</span>
        <span class="workout__value">${inputDistance.value}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${inputDuration.value}</span>
        <span class="workout__unit">min</span>
      </div>
      ${
        inputType.value === 'running'
          ? `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${(
          inputDistance.value / inputDuration.value
        ).toFixed(1)}</span>
        <span class="workout__unit">km/min</span>
       </div>
       <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${inputCadence.value}</span>
        <span class="workout__unit">spm</span>
       </div>`
          : `<div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${(
            inputDistance.value /
            (Number(inputDuration.value) / 60)
          ).toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
       <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${inputElevation.value}</span>
          <span class="workout__unit">m</span>
       </div>`
      }
    </li>`;

  form.insertAdjacentHTML('afterend', html);

  workouts.push(html);

  setLocalStorage(workouts);
}

//F6
function clearInputs() {
  inputDistance.value = '';
  inputDuration.value = '';
  inputCadence.value = '';
  inputElevation.value = '';
}

//F7
function inputsDisable(boolean) {
  document.querySelectorAll('.form__input').forEach(input => {
    input.disabled = boolean;
  });
}

//F8
function setLocalStorage(value) {
  localStorage.setItem('workouts', JSON.stringify(value));
}

function getLocalStorage() {
  let retrieved = JSON.parse(localStorage.getItem('workouts'));
  retrieved.forEach(workout => {
    form.insertAdjacentHTML('afterend', workout);
  });
}

function reset() {
  localStorage.clear();
  location.reload();
}

// //<----------------------------------MAIN JAVASCRIPT LOGIC------------------------------------------->

// //---------TASK 1:to load and display map using 'leaflet' library.
navigator.geolocation.getCurrentPosition(successCallBack, function (error) {
  alert(`no able to access your current location`);
});
// //mapDisplay will be initialized only after successCallBack is executed.
// //so mapDisplay would be undefined until successCallBack is executed completely.
// //learn callbacks and promises of JS

// //why is mapDisplay undefined outside successCallBack function?when successCallBack() is not yet called,then mapDisplay will not be assigned hence undefined
// //use classes and try to inherit the mapDisplay variable.

// //---------TASK 2(handlClick event inside Task 1)

// //---------TASK 3(when clicked on workouts in sideBar map should display its co-ordinates)
//for task 3 ,every workout should be binded with its respective coordinates and when clicked on it ,map should display its coordinates.
//whenever i have clicked on any workout which are present in sideBar,map should display that location,what should i do?
//i have included co-ords as dataset inside 'html' variable

//TASK 4(use local storage API to display workouts even after page refresh)

document.addEventListener('DOMContentLoaded', function () {
  // Retrieve workouts from local storage and display them
  getLocalStorage();
});

// reset();
