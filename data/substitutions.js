/* Curated swaps. Nutrient-similar alternatives are also computed at runtime
   by the engine; these are hand-picked, high-confidence replacements. */
window.App = window.App || {};
App.DATA = App.DATA || {};

App.DATA.substitutions = {
  /* Cheaper / plant-based replacements for a given food */
  map: {
    ilish: ["ruhi", "tilapia", "mola"],
    beef: ["chicken_breast", "egg", "masoor", "soybean"],
    mutton: ["beef", "chicken_breast", "soybean"],
    chicken_breast: ["tilapia", "egg", "masoor", "soybean"],
    ruhi: ["tilapia", "mola", "masoor"],
    katla: ["ruhi", "tilapia", "mola"],
    tilapia: ["mola", "ruhi", "masoor"],
    milk: ["soybean", "sesame"],
    yogurt: ["soybean", "sesame"],
    rashogolla: ["gur", "banana"],
    almond: ["peanut", "sesame"],
    peanut: ["sesame", "chola"],
    rice_white: ["rice_brown", "oats", "chira"],
    paratha: ["roti", "oats"],
    potato: ["sweetpotato", "lau", "pumpkin"],
    sugar: ["gur", "banana"],
    coconut: ["sesame", "peanut"],
  },

  /* Plant-based sources that cover the nutrient role of animal products */
  plantBasedFor: {
    beef: ["soybean", "masoor", "chola"],
    mutton: ["soybean", "chola"],
    chicken_breast: ["soybean", "masoor", "mung"],
    egg: ["soybean", "chola", "masoor"],
    milk: ["soybean", "sesame", "almond"],
    yogurt: ["soybean", "sesame"],
    ruhi: ["soybean", "masoor", "sesame"],
    katla: ["soybean", "masoor"],
    tilapia: ["soybean", "mung"],
    ilish: ["soybean", "peanut"],
    mola: ["sesame", "soybean"],
    shrimp: ["soybean", "masoor"],
    rashogolla: ["gur", "banana"],
  },

  /* Which foods are animal-derived, for vegetarian/vegan exclusion */
  animalCategories: ["fish", "meat", "egg"],
};
