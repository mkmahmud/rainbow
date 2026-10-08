/* Activity / exercise types with MET values used to estimate calories burned. */
window.App = window.App || {};
App.DATA = App.DATA || {};

/* MET = metabolic equivalent of task. kcal ≈ MET × weight(kg) × hours. */
App.DATA.activityTypes = [
  { id: "walking", nameEn: "Walking", nameBn: "হাঁটা", icon: "activity", met: 5.0, stepBased: true },
  { id: "running", nameEn: "Running", nameBn: "দৌড়", icon: "activity", met: 9.8 },
  { id: "cycling", nameEn: "Cycling", nameBn: "সাইক্লিং", icon: "activity", met: 7.5 },
  { id: "exercise", nameEn: "Exercise", nameBn: "ব্যায়াম", icon: "flame", met: 6.0 },
  { id: "yoga", nameEn: "Yoga", nameBn: "যোগব্যায়াম", icon: "leaf", met: 3.0 },
  { id: "swimming", nameEn: "Swimming", nameBn: "সাঁতার", icon: "drop", met: 8.0 },
];

/* Steps → distance (approx. 1,500 steps per km for an average stride). */
App.DATA.stepsPerKm = 1500;
