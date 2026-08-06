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
  { value: "general", label: "General", emoji: "💬", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
  { value: "relationship", label: "Relationships", emoji: "💞", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
  { value: "self-love", label: "Self-Love", emoji: "🌸", color: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300" },
  { value: "breakup", label: "Breakups", emoji: "💔", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  { value: "family", label: "Family", emoji: "🏡", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { value: "advice", label: "Advice", emoji: "🧭", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
  { value: "story", label: "Story", emoji: "📖", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
];

export const MOOD_TAGS = [
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "hopeful", label: "Hopeful", emoji: "🌿" },
  { value: "reflective", label: "Reflective", emoji: "🌙" },
  { value: "anxious", label: "Anxious", emoji: "🍃" },
  { value: "heartbreak", label: "Heartbroken", emoji: "💔" },
  { value: "grateful", label: "Grateful", emoji: "🙏" },
  { value: "confused", label: "Confused", emoji: "🌀" },
  { value: "in-love", label: "In Love", emoji: "💗" },
];

export const REACTION_EMOJIS = ["❤️", "🤗", "💪", "🙏", "✨"];

export const MOOD_OPTIONS = [
  { value: "joyful", label: "Joyful", emoji: "😄", color: "#f59e0b", score: 9 },
  { value: "calm", label: "Calm", emoji: "😌", color: "#14b8a6", score: 7 },
  { value: "grateful", label: "Grateful", emoji: "🙏", color: "#a855f7", score: 8 },
  { value: "in-love", label: "In Love", emoji: "💗", color: "#ec4899", score: 9 },
  { value: "hopeful", label: "Hopeful", emoji: "🌱", color: "#22c55e", score: 7 },
  { value: "neutral", label: "Neutral", emoji: "😐", color: "#64748b", score: 5 },
  { value: "anxious", label: "Anxious", emoji: "😰", color: "#0ea5e9", score: 3 },
  { value: "sad", label: "Sad", emoji: "😢", color: "#6366f1", score: 2 },
  { value: "angry", label: "Angry", emoji: "😠", color: "#ef4444", score: 1 },
];

export function generateMoodInsight(mood: string, score: number, content: string): string {
  const insights: Record<string, string[]> = {
    joyful: [
      "Joy is contagious — your energy today may quietly lift someone around you. Notice what sparked it so you can return to it.",
      "High-vibe days are worth bottling. Write down one specific moment that made you smile; memory fades faster than ink.",
    ],
    calm: [
      "Calm is not the absence of feeling but the presence of safety. You've created space for yourself today — protect it.",
      "A regulated nervous system is a quiet superpower. Use this steadiness to reflect, not to numb.",
    ],
    grateful: [
      "Gratitude rewires the brain toward abundance. Naming three specifics amplifies the effect — try it now.",
      "When you appreciate what you have, what you have appreciates. Gratitude is the bridge between enough and plenty.",
    ],
    "in-love": [
      "Love is a mirror — it shows you both your light and the places still asking to be healed. Move gently.",
      "Infatuation floods; love anchors. Notice whether you feel more like yourself or less, and let that guide you.",
    ],
    hopeful: [
      "Hope is not optimism — it's the decision to act as if the future can be kinder than the past. Keep walking.",
      "Hope grows in motion. One small step today matters more than a perfect plan tomorrow.",
    ],
    neutral: [
      "Neutral days are rest days for the heart. Not every page has to be a climax; some are just turning pages.",
      "A flat mood isn't a failure — it's a baseline. Use the stillness to notice what you usually drown out.",
    ],
    anxious: [
      "Anxiety lives in the future. Gently bring yourself back: name 5 things you see, 4 you can touch, 3 you hear.",
      "Your worry is trying to protect you, but it's overstepping. Thank it, then ask: is this threat real or rehearsed?",
    ],
    sad: [
      "Sadness asks to be felt, not fixed. Let it move through you like weather — it always does move.",
      "Tears are the body's way of processing what the mind can't yet articulate. You're not breaking; you're clearing.",
    ],
    angry: [
      "Anger is a boundary-signal — it tells you something mattered. Before reacting, ask what value was crossed.",
      "Anger without action festers; anger with wisdom transforms. Channel it into one clear, calm boundary.",
    ],
  };
  const pool = insights[mood] ?? insights.neutral;
  // Deterministic pick based on content length so it feels thoughtful
  const idx = (content.length + score) % pool.length;
  return pool[idx];
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
  words: {
    label: "Words of Affirmation",
    emoji: "💬",
    description: "You feel most loved through spoken and written appreciation. Kind, specific words land deeper for you than grand gestures — tell your people what you admire about them, and ask for the same in return.",
  },
  touch: {
    label: "Physical Touch",
    emoji: "🤝",
    description: "Your body reads love before your mind does. A hand on your back, a hug that lasts a beat longer — these are your love letters. You thrive with safe, affectionate connection.",
  },
  time: {
    label: "Quality Time",
    emoji: "⏳",
    description: "Undivided attention is your currency of love. When someone sets the world aside for you, you feel chosen. Guard presence over productivity in your closest bonds.",
  },
  gifts: {
    label: "Receiving Gifts",
    emoji: "🎁",
    description: "It's never about price — it's about being thought of. A found shell, a saved flower, the right book at the right time. You feel loved when someone proves they notice you.",
  },
  acts: {
    label: "Acts of Service",
    emoji: "🛠️",
    description: "Love, to you, looks like easing someone's load. When people show up in the doing, you feel held. Just remember: you're allowed to receive help, not only give it.",
  },
};

export const ATTACHMENT_QUIZ = {
  id: "attachment",
  title: "What's Your Attachment Style?",
  subtitle: "Understand how you bond, and why.",
  questions: [
    {
      id: 1,
      text: "When a partner doesn't reply for hours, you tend to...",
      options: [
        { text: "Assume they're busy and carry on", style: "secure" },
        { text: "Spiral — did I do something wrong?", style: "anxious" },
        { text: "Feel relieved — more space for me", style: "avoidant" },
        { text: "Want closeness but also want to pull away", style: "fearful" },
      ],
    },
    {
      id: 2,
      text: "In conflict, you usually...",
      options: [
        { text: "Try to understand and repair", style: "secure" },
        { text: "Need reassurance fast", style: "anxious" },
        { text: "Shut down or leave the room", style: "avoidant" },
        { text: "Push them away, then fear they'll go", style: "fearful" },
      ],
    },
    {
      id: 3,
      text: "You feel closest to someone when...",
      options: [
        { text: "We're honest, even about hard things", style: "secure" },
        { text: "They tell me they love me often", style: "anxious" },
        { text: "We each have plenty of independence", style: "avoidant" },
        { text: "They stay, even when I'm a mess", style: "fearful" },
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
  "Ask me about the book that changed me 📚",
  "My ideal Sunday involves coffee and…",
  "Controversial opinion: pineapple on pizza?",
  "Teach me something in 60 seconds",
  "The trait I admire most in a person is…",
  "I'm secretly really good at…",
  "My love language is probably…",
  "Last thing that made me laugh out loud:",
];

export const INTEREST_OPTIONS = [
  "Music", "Books", "Movies", "Travel", "Cooking", "Hiking", "Yoga",
  "Gaming", "Art", "Photography", "Coffee", "Wine", "Dogs", "Cats",
  "Fitness", "Meditation", "Dance", "Writing", "Philosophy", "Nature",
];
