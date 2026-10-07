/* Condition catalogue — the profiles the recommendation engine reasons about. */
window.App = window.App || {};
App.DATA = App.DATA || {};

App.DATA.conditions = [
  {
    id: "diabetes",
    nameEn: "Diabetes",
    nameBn: "ডায়াবেটিস",
    icon: "🩸",
    nutrientsOfConcern: ["sugar", "glycemic", "carbs", "fiber"],
    summaryEn: "Carbohydrate load, added sugar and glycemic impact matter most.",
    summaryBn: "কার্বোহাইড্রেট, চিনি ও গ্লাইসেমিক প্রভাব গুরুত্বপূর্ণ।",
  },
  {
    id: "heart",
    nameEn: "Heart disease / Hypertension",
    nameBn: "হৃদরোগ / উচ্চ রক্তচাপ",
    icon: "❤️",
    nutrientsOfConcern: ["sodium", "satFat"],
    summaryEn: "Keep sodium and saturated fat low; prefer unsaturated fats and fibre.",
    summaryBn: "সোডিয়াম ও সম্পৃক্ত চর্বি কম রাখুন।",
  },
  {
    id: "ckd",
    nameEn: "Chronic Kidney Disease",
    nameBn: "কিডনি রোগ",
    icon: "🫘",
    stageAware: true,
    nutrientsOfConcern: ["sodium", "potassium", "phosphorus", "protein"],
    summaryEn: "Stage-aware limits on sodium, potassium, phosphorus and protein.",
    summaryBn: "কিডনির পর্যায় অনুযায়ী সোডিয়াম, পটাশিয়াম, ফসফরাস ও প্রোটিন সীমিত।",
  },
];

App.DATA.ckdStages = [
  { value: 1, labelEn: "Stage 1", labelBn: "পর্যায় ১", factor: 1.35 },
  { value: 2, labelEn: "Stage 2", labelBn: "পর্যায় ২", factor: 1.2 },
  { value: 3, labelEn: "Stage 3", labelBn: "পর্যায় ৩", factor: 1.0 },
  { value: 4, labelEn: "Stage 4", labelBn: "পর্যায় ৪", factor: 0.78 },
  { value: 5, labelEn: "Stage 5", labelBn: "পর্যায় ৫", factor: 0.6 },
];

App.DATA.allergens = [
  { id: "fish", nameEn: "Fish & seafood", nameBn: "মাছ ও সামুদ্রিক" },
  { id: "egg", nameEn: "Egg", nameBn: "ডিম" },
  { id: "milk", nameEn: "Milk & dairy", nameBn: "দুধ ও দুগ্ধ" },
  { id: "peanut", nameEn: "Peanuts", nameBn: "চিনাবাদাম" },
  { id: "nuts", nameEn: "Tree nuts", nameBn: "বাদাম" },
  { id: "gluten", nameEn: "Gluten / wheat", nameBn: "গম / গ্লুটেন" },
  { id: "soy", nameEn: "Soy", nameBn: "সয়া" },
];

App.DATA.dietaryPrefs = [
  { id: "vegetarian", nameEn: "Vegetarian", nameBn: "নিরামিষ" },
  { id: "vegan", nameEn: "Vegan (no animal products)", nameBn: "ভেগান" },
  { id: "noBeef", nameEn: "No beef", nameBn: "গরুর মাংস নয়" },
  { id: "halalOnly", nameEn: "Halal only", nameBn: "হালাল" },
];

App.DATA.costTiers = [
  { id: "low", nameEn: "Low cost", nameBn: "কম খরচ", weight: 1 },
  { id: "medium", nameEn: "Medium cost", nameBn: "মাঝারি খরচ", weight: 2 },
  { id: "high", nameEn: "Higher cost", nameBn: "বেশি খরচ", weight: 3 },
];
