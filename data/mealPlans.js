/* Meal slots used by the chart generator, plus a couple of seeded plans and
   canned nutritionist replies for the mock review flow. */
window.App = window.App || {};
App.DATA = App.DATA || {};

App.DATA.mealSlots = [
  { id: "breakfast", nameEn: "Breakfast", nameBn: "সকালের নাশতা", pct: 0.25, icon: "🌅" },
  { id: "lunch", nameEn: "Lunch", nameBn: "দুপুরের খাবার", pct: 0.35, icon: "🍛" },
  { id: "snack", nameEn: "Snack", nameBn: "বিকালের নাশতা", pct: 0.1, icon: "🍎" },
  { id: "dinner", nameEn: "Dinner", nameBn: "রাতের খাবার", pct: 0.3, icon: "🌙" },
];

App.DATA.samplePlans = [
  {
    id: "plan_balanced",
    nameEn: "Balanced Free Plan",
    nameBn: "সুষম ফ্রি প্ল্যান",
    tier: "free",
    items: [
      { slot: "breakfast", foodId: "roti", grams: 90 },
      { slot: "breakfast", foodId: "egg", grams: 100 },
      { slot: "lunch", foodId: "rice_white", grams: 300 },
      { slot: "lunch", foodId: "masoor", grams: 200 },
      { slot: "lunch", foodId: "lau", grams: 120 },
      { slot: "snack", foodId: "guava", grams: 150 },
      { slot: "dinner", foodId: "rice_white", grams: 250 },
      { slot: "dinner", foodId: "ruhi", grams: 120 },
      { slot: "dinner", foodId: "palong", grams: 100 },
    ],
  },
];

App.DATA.nutritionistReplies = [
  "Reviewed your chart. I reduced carbohydrate portions at dinner and added a fibre-rich green to improve glycemic control. Please monitor your post-meal readings and share them at your next review.",
  "Your plan looks appropriate for your condition. I suggest keeping sodium under the daily limit by using less salt in cooking, and swapping fried snacks for fruit. Recheck in four weeks.",
  "I adjusted protein portions to protect kidney function and trimmed high-potassium items. Keep fluid intake as advised by your doctor and repeat labs before the next review.",
];
