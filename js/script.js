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
const jsonProm = axios.get('https://my-json-server.typicode.com/mauq/db2/db')
  .then((res) => {return res;});

const aWeekAgo = Date.now() - 604800000;


//handle both the firebase database request, and the api request
Promise.all([dbProm, jsonProm]).then((values) => {
  //if the firebase database is empty (null), populate it with api request data
  const currDB = values[0];
  const currAPI = values[1].data;
  if (values[0] === null) {
    currAPI.days.forEach((i) => {
      daysRef.child('days/' + i.timestamp).set({"day": i.day, "time": i.timestamp, "condis": i.condis});
    });
  } else { //update existing firebase database data with new api request data

    //truncate data removing anything over 7 days old
    Object.keys(currDB.days).forEach((i) => {
      if (i < aWeekAgo) {
        daysRef.child("days/" + i).remove();
      }
    });
    currAPI.days.forEach((i) => { //if date for new api call exists in old db, update
      if (i.timestamp in currDB.days) {
        daysRef.child("days/" + i.timestamp).update({"day": i.day, "time": i.timestamp, "condis": i.condis});
      } else { //else, add new days
        daysRef.child('days/' + i.timestamp).set({"day": i.day, "time": i.timestamp, "condis": i.condis});
      }
    });
  }

})
.catch(error => {
  console.error(error.message);
});
