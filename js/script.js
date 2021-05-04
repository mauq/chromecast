"use strict";

//setting up firebase
const config = {
  apiKey: "AIzaSyApW2utbkr4-BoRnl7SizGZkluiO5DYyhQ",
  authDomain: "test-8dd69.firebaseapp.com",
  databaseURL: "https://test-8dd69-default-rtdb.firebaseio.com",
  projectId: "test-8dd69",
  storageBucket: "test-8dd69.appspot.com",
  messagingSenderId: "734193969893",
  appId: "1:734193969893:web:95fb09a38d3822ae2d820c",
  measurementId: "G-0W8PD3B8WX"
};

firebase.initializeApp(config);

const daysRef = firebase.database().ref().child('object');

//database response promise
const dbProm = daysRef.get()
  .then((res) => {return res.val();});

//fake api response promise
const jsonProm = axios.get('http://api.openweathermap.org/data/2.5/forecast?q=Forks&units=imperial&appid=23bd40f43f1959f801895de830da8f31')
  .then((res) => {return res;});

const aWeekAgo = Date.now() - 604800000;


//handle both the firebase database request, and the api request
Promise.all([dbProm, jsonProm]).then((values) => {
  console.log(values);
  //if the firebase database is empty (null), populate it with api request data
  const currDB = values[0];
  const currAPI = values[1].data.list;
  if (values[0] === null) {
    currAPI.forEach((i) => {
      daysRef.child('3hrChunks/' + i.dt).set({
        "day": i.dt_txt,
        "time": i.dt,
        "precip": i.pop,
        "accum": i?.rain?.['3h'] || 0,
        "descrip": i.weather[0].description,
        "temp": i.main.temp});
    });
  } else { //update existing firebase database data with new api request data
    //truncate data removing anything over 7 days old
    Object.keys(currDB['3hrChunks']).forEach((i) => {
      if (i < aWeekAgo) {
        daysRef.child("3hrChunks/" + i).remove();
      }
    });
    currAPI.forEach((i) => { //if date for new api call exists in old db, update
      if (i.dt in currDB['3hrChunks']) {
        daysRef.child("3hrChunks/" + i.dt).update({
          "day": i.dt_txt,
          "time": i.dt,
          "precip": i.pop,
          "accum": i?.rain?.['3h'] || 0,
          "descrip": i.weather[0].description,
          "temp": i.main.temp});
      } else { //else, add new days
        daysRef.child('3hrChunks/' + i.dt).set({
          "day": i.dt_txt,
          "time": i.dt,
          "precip": i.pop,
          "accum": i?.rain?.['3h'] || 0,
          "descrip": i.weather[0].description,
          "temp": i.main.temp});
      }
    });
  }

})
.catch(error => {
  console.error(error.message);
});
