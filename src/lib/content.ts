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
  id: "love-language",
  title: "What's Your Love Language?",
  subtitle: "Discover how you give and receive love.",
  questions: [
    {
      id: 1,
      text: "When someone really shows they care, it's usually through...",
      options: [
        { text: "Hearing 'I'm proud of you'", lang: "words" },
        { text: "A long, unhurried hug", lang: "touch" },
        { text: "Them setting aside a whole evening just for you", lang: "time" },
        { text: "A small thoughtful gift", lang: "gifts" },
        { text: "Them handling a chore you dreaded", lang: "acts" },
      ],
    },
    {
      id: 2,
      text: "After a hard day, you most want...",
      options: [
        { text: "To be told you did your best", lang: "words" },
        { text: "A hand on your shoulder", lang: "touch" },
        { text: "Someone to sit with you, no agenda", lang: "time" },
        { text: "Your favorite snack waiting", lang: "gifts" },
        { text: "Dinner already made", lang: "acts" },
      ],
    },
    {
      id: 3,
      text: "You feel most connected to a partner when...",
      options: [
        { text: "They leave you a sweet note", lang: "words" },
        { text: "You hold hands walking", lang: "touch" },
        { text: "You take a trip together, just the two of you", lang: "time" },
        { text: "They surprise you with something meaningful", lang: "gifts" },
        { text: "They run an errand so you can rest", lang: "acts" },
      ],
    },
    {
      id: 4,
      text: "The thing that hurts most is when someone...",
      options: [
        { text: "Critiques you harshly", lang: "words" },
        { text: "Pulls away physically", lang: "touch" },
        { text: "Is always on their phone around you", lang: "time" },
        { text: "Forgets occasions that matter to you", lang: "gifts" },
        { text: "Doesn't follow through on promises", lang: "acts" },
      ],
    },
    {
      id: 5,
      text: "Your ideal 'I love you' looks like...",
      options: [
        { text: "A heartfelt letter", lang: "words" },
        { text: "A slow dance in the kitchen", lang: "touch" },
        { text: "A weekend with nowhere to be", lang: "time" },
        { text: "A keepsake that says 'I saw this and thought of you'", lang: "gifts" },
        { text: "Coffee made exactly how you like it", lang: "acts" },
      ],
    },
  ],
};

export const LOVE_LANGUAGE_RESULTS: Record<string, { label: string; emoji: string; description: string }> = {
  words: { label: "Words of Affirmation", emoji: "💬", description: "You thrive on verbal appreciation and kind words. Hearing 'I love you' and specific praise fills your cup." },
  time: { label: "Quality Time", emoji: "⏳", description: "Undivided attention is your love language. Presence matters more than presents." },
  gifts: { label: "Receiving Gifts", emoji: "🎁", description: "Thoughtful tokens make you feel seen. It's the meaning behind the gift that counts." },
  acts: { label: "Acts of Service", emoji: "🛠️", description: "Helpful actions speak louder than words. When someone lightens your load, you feel loved." },
  touch: { label: "Physical Touch", emoji: "🤗", description: "Physical closeness is how you feel connected. Hugs, hand-holding, and proximity matter deeply." },
};

export const ATTACHMENT_QUIZ = {
  id: "attachment-style",
  title: "What's Your Attachment Style?",
  subtitle: "Understand how you bond and what makes you feel safe in love.",
  questions: [
    {
      id: 1,
      text: "When someone you care about pulls away, you tend to...",
      options: [
        { text: "Give them space and trust they'll return", style: "secure" },
        { text: "Reach out more, seeking reassurance", style: "anxious" },
        { text: "Pull away too — better to protect yourself", style: "avoidant" },
        { text: "Want closeness but also feel the urge to run", style: "fearful" },
      ],
    },
    {
      id: 2,
      text: "In conflict, your default is...",
      options: [
        { text: "Talk it through calmly when both are ready", style: "secure" },
        { text: "Chase resolution right away — silence feels unbearable", style: "anxious" },
        { text: "Shut down or change the subject", style: "avoidant" },
        { text: "Oscillate between wanting to fix it and wanting out", style: "fearful" },
      ],
    },
    {
      id: 3,
      text: "You feel safest in a relationship when...",
      options: [
        { text: "You're both honest, even about hard things", style: "secure" },
        { text: "They tell you they love you often", style: "anxious" },
        { text: "You each have plenty of independence", style: "avoidant" },
        { text: "They stay, even when you're a mess", style: "fearful" },
      ],
    },
    {
      id: 4,
      text: "Your inner narrative about love is...",
      options: [
        { text: "I'm worthy of love and so are they", style: "secure" },
        { text: "I'm not enough — I have to earn it", style: "anxious" },
        { text: "I'm fine on my own, thanks", style: "avoidant" },
        { text: "I want it but I'm scared of it", style: "fearful" },
      ],
    },
  ],
};

export const ATTACHMENT_RESULTS: Record<string, { label: string; emoji: string; description: string }> = {
  secure: {
    label: "Secure",
    emoji: "🌳",
    description: "You trust that love can be steady. You're comfortable with closeness and with autonomy. This doesn't mean you never feel hurt — it means you believe in repair. You're a grounding force in relationships.",
  },
  anxious: {
    label: "Anxious-Preoccupied",
    emoji: "🌊",
    description: "You love deeply and crave reassurance. Your nervous system reads distance as danger. The work isn't to stop caring — it's to build inner safety so someone else's mood doesn't dictate your worth.",
  },
  avoidant: {
    label: "Dismissive-Avoidant",
    emoji: "🏔️",
    description: "Independence is your armor. Closeness can feel like losing yourself, so you create distance to feel safe. Growth looks like letting one trusted person in, slowly, and staying.",
  },
  fearful: {
    label: "Fearful-Avoidant",
    emoji: "🌪️",
    description: "You long for love and fear it equally. You want someone to stay but expect them to leave. Healing begins with tiny, consistent acts of safety — with others and with yourself.",
  },
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
