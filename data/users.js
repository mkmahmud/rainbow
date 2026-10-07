/* Seeded demo accounts. Passwords are mock-only (static prototype). */
window.App = window.App || {};
App.DATA = App.DATA || {};

App.DATA.demoUsers = [
  {
    id: "u_healthy",
    name: "Rahim Uddin",
    email: "rahim@demo.bd",
    password: "demo1234",
    role: "user",
    premium: false,
    persona: "Health-conscious",
    profile: { age: 29, sex: "male", heightCm: 172, weightKg: 70, activity: "moderate", goal: "maintain", conditions: [], ckdStage: null, allergies: [], diet: [], budgetSensitive: false, language: "en" },
  },
  {
    id: "u_diabetic",
    name: "Fatima Akter",
    email: "fatima@demo.bd",
    password: "demo1234",
    role: "user",
    premium: false,
    persona: "Diabetes",
    profile: { age: 52, sex: "female", heightCm: 156, weightKg: 68, activity: "light", goal: "weight-loss", conditions: ["diabetes"], ckdStage: null, allergies: [], diet: [], budgetSensitive: false, language: "en" },
  },
  {
    id: "u_ckd",
    name: "Karim Mia",
    email: "karim@demo.bd",
    password: "demo1234",
    role: "user",
    premium: false,
    persona: "Kidney disease (CKD)",
    profile: { age: 61, sex: "male", heightCm: 165, weightKg: 62, activity: "light", goal: "manage-condition", conditions: ["ckd"], ckdStage: 3, allergies: [], diet: [], budgetSensitive: false, language: "en" },
  },
  {
    id: "u_veg",
    name: "Nusrat Jahan",
    email: "nusrat@demo.bd",
    password: "demo1234",
    role: "user",
    premium: false,
    persona: "Vegetarian + heart",
    profile: { age: 34, sex: "female", heightCm: 160, weightKg: 55, activity: "moderate", goal: "maintain", conditions: ["heart"], ckdStage: null, allergies: ["fish"], diet: ["vegetarian"], budgetSensitive: false, language: "en" },
  },
  {
    id: "u_budget",
    name: "Jashim Sheikh",
    email: "jashim@demo.bd",
    password: "demo1234",
    role: "user",
    premium: false,
    persona: "Budget-conscious",
    profile: { age: 41, sex: "male", heightCm: 168, weightKg: 74, activity: "moderate", goal: "weight-loss", conditions: [], ckdStage: null, allergies: [], diet: [], budgetSensitive: true, language: "bn" },
  },
  {
    id: "u_premium",
    name: "Ayesha Siddika",
    email: "ayesha@demo.bd",
    password: "demo1234",
    role: "user",
    premium: true,
    persona: "Premium member",
    profile: { age: 38, sex: "female", heightCm: 162, weightKg: 63, activity: "active", goal: "maintain", conditions: ["diabetes"], ckdStage: null, allergies: [], diet: ["vegetarian"], budgetSensitive: false, language: "en" },
  },
  {
    id: "u_admin",
    name: "Content Admin",
    email: "admin@demo.bd",
    password: "admin1234",
    role: "admin",
    premium: true,
    persona: "Content / Admin staff",
    profile: { age: 30, sex: "other", heightCm: 170, weightKg: 65, activity: "moderate", goal: "maintain", conditions: [], ckdStage: null, allergies: [], diet: [], budgetSensitive: false, language: "en" },
  },
];

App.DATA.activityLevels = [
  { id: "sedentary", nameEn: "Sedentary (little exercise)", nameBn: "অলস", factor: 1.2 },
  { id: "light", nameEn: "Light (1-3 days/week)", nameBn: "হালকা", factor: 1.375 },
  { id: "moderate", nameEn: "Moderate (3-5 days/week)", nameBn: "মাঝারি", factor: 1.55 },
  { id: "active", nameEn: "Active (6-7 days/week)", nameBn: "সক্রিয়", factor: 1.725 },
  { id: "athlete", nameEn: "Very active / athlete", nameBn: "অতি সক্রিয়", factor: 1.9 },
];

App.DATA.goals = [
  { id: "weight-loss", nameEn: "Lose weight", nameBn: "ওজন কমানো" },
  { id: "maintain", nameEn: "Maintain weight", nameBn: "ওজন ধরে রাখা" },
  { id: "weight-gain", nameEn: "Gain weight", nameBn: "ওজন বাড়ানো" },
  { id: "manage-condition", nameEn: "Manage a health condition", nameBn: "রোগ নিয়ন্ত্রণ" },
];
