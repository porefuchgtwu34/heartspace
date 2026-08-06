// HeartSpace content library: quotes, quiz questions, mood insights, categories.

export const LOVE_QUOTES: { text: string; author: string }[] = [
  { text: "Love is not about how much you say 'I love you', but how much you prove that it's true.", author: "Anonymous" },
  { text: "The greatest happiness of life is the conviction that we are loved.", author: "Victor Hugo" },
  { text: "We accept the love we think we deserve.", author: "Stephen Chbosky" },
  { text: "Love yourself first and everything else falls into line.", author: "Lucille Ball" },
  { text: "Where there is love there is life.", author: "Mahatma Gandhi" },
  { text: "The best thing to hold onto in life is each other.", author: "Audrey Hepburn" },
  { text: "Love is composed of a single soul inhabiting two bodies.", author: "Aristotle" },
  { text: "You don't love someone for their looks, or their clothes, or for their fancy car, but because they sing a song only you can hear.", author: "Oscar Wilde" },
  { text: "To love is nothing. To be loved is something. But to love and be loved, that's everything.", author: "T. Tolis" },
  { text: "The heart wants what it wants.", author: "Emily Dickinson" },
  { text: "Love isn't something you find. Love is something that finds you.", author: "Loretta Young" },
  { text: "A loving heart is the truest wisdom.", author: "Charles Dickens" },
];

export const POST_CATEGORIES = [
  { value: "general", label: "General", emoji: "💬", color: "bg-rose-100 text-rose-700" },
  { value: "relationship", label: "Relationships", emoji: "💞", color: "bg-pink-100 text-pink-700" },
  { value: "self-love", label: "Self-Love", emoji: "🌸", color: "bg-fuchsia-100 text-fuchsia-700" },
  { value: "breakup", label: "Breakups", emoji: "💔", color: "bg-red-100 text-red-700" },
  { value: "family", label: "Family", emoji: "🏠", color: "bg-amber-100 text-amber-700" },
  { value: "advice", label: "Advice", emoji: "💡", color: "bg-sky-100 text-sky-700" },
  { value: "story", label: "Stories", emoji: "📖", color: "bg-violet-100 text-violet-700" },
];

export const MOOD_TAGS = ["happy", "grateful", "hopeful", "reflective", "anxious", "sad", "angry", "lonely", "confused", "peaceful"];

export const REACTION_EMOJIS = ["❤️", "🤗", "💪", "🙏", "✨"];

export const MOOD_OPTIONS = [
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "grateful", label: "Grateful", emoji: "🙏" },
  { value: "hopeful", label: "Hopeful", emoji: "🌱" },
  { value: "reflective", label: "Reflective", emoji: "🤔" },
  { value: "anxious", label: "Anxious", emoji: "😰" },
  { value: "sad", label: "Sad", emoji: "😢" },
  { value: "angry", label: "Angry", emoji: "😤" },
  { value: "lonely", label: "Lonely", emoji: "😔" },
  { value: "confused", label: "Confused", emoji: "😕" },
  { value: "peaceful", label: "Peaceful", emoji: "😌" },
];

export function generateMoodInsight(mood: string, score: number, content: string): string {
  const insights: Record<string, string[]> = {
    happy: ["Savor this. Joy is worth noticing.", "Your light is contagious today."],
    grateful: ["Gratitude rewires the brain toward abundance.", "What you appreciate appreciates."],
    hopeful: ["Hope is a practice, and you're practicing it.", "Tomorrow is being built by today's courage."],
    reflective: ["Reflection is how experience becomes wisdom.", "Sitting with your thoughts is brave work."],
    anxious: ["Anxiety is loud; your breath is louder if you let it be.", "Name it, and it loses some power."],
    sad: ["Sadness is love with nowhere to go for a moment. Be gentle.", "You don't have to rush the weather of your heart."],
    angry: ["Anger often guards something tender. What is it protecting?", "Feel it fully, then choose what to do with the energy."],
    lonely: ["Loneliness is a signal, not a sentence. Reach when you can.", "You are not the only one feeling this tonight."],
    confused: ["Confusion is the middle of the bridge. Keep walking.", "Not knowing is allowed. Clarity often arrives later."],
    peaceful: ["This calm is earned. Rest in it.", "Peace is not the absence of storms; it is your center in them."],
  };
  const list = insights[mood] || insights.reflective;
  return list[score % list.length];
}

export const LOVE_LANGUAGE_QUIZ = {
  title: "Love Language Quiz",
  description: "Discover how you prefer to give and receive love.",
  questions: [
    { id: 1, text: "I feel most loved when someone...", options: [
      { text: "Tells me how much I mean to them", value: "words" },
      { text: "Spends uninterrupted time with me", value: "time" },
      { text: "Gives me a thoughtful gift", value: "gifts" },
      { text: "Helps me with tasks", value: "service" },
      { text: "Hugs me or holds my hand", value: "touch" },
    ]},
  ],
};

export const LOVE_LANGUAGE_RESULTS: Record<string, { label: string; emoji: string; description: string }> = {
  words: { label: "Words of Affirmation", emoji: "💬", description: "You thrive on verbal appreciation and kind words." },
  time: { label: "Quality Time", emoji: "⏳", description: "Undivided attention is your love language." },
  gifts: { label: "Receiving Gifts", emoji: "🎁", description: "Thoughtful tokens make you feel seen." },
  service: { label: "Acts of Service", emoji: "🛠️", description: "Helpful actions speak louder than words." },
  touch: { label: "Physical Touch", emoji: "🤗", description: "Physical closeness is how you feel connected." },
};

export const DATING_PROMPTS = [
  "What does a perfect Sunday look like for you?",
  "What's a small thing that always makes you smile?",
  "Describe your ideal way to spend a rainy day.",
];

export const INTEREST_OPTIONS = [
  "Reading", "Hiking", "Cooking", "Music", "Art", "Travel", "Fitness", "Gaming", "Photography", "Writing",
];

// Alias used by quotes API
export const QUOTES = LOVE_QUOTES;
