// HeartSpace content library: quotes, quiz questions, mood insights, categories.

export const LOVE_QUOTES: { text: string; author: string }[] = [
  // Love
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
  { text: "Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.", author: "Lao Tzu" },
  { text: "Love is an act of endless forgiveness, a tender look which becomes a habit.", author: "Peter Ustinov" },
  { text: "The most important thing in life is to learn how to give out love, and to let it come in.", author: "Morrie Schwartz" },

  // Trust & relationships
  { text: "Trust is the glue of life. It's the most essential ingredient in effective communication.", author: "Stephen Covey" },
  { text: "The best proof of love is trust.", author: "Joyce Brothers" },
  { text: "Trust takes years to build, seconds to break, and forever to repair.", author: "Anonymous" },
  { text: "Love without trust is a river without water.", author: "Anonymous" },
  { text: "A relationship without trust is like a car without gas — you can stay in it, but it won't go anywhere.", author: "Anonymous" },
  { text: "When people show you who they are, believe them the first time.", author: "Maya Angelou" },
  { text: "The quality of your life is the quality of your relationships.", author: "Tony Robbins" },
  { text: "Assumptions are the termites of relationships.", author: "Henry Winkler" },
  { text: "We are never so defenseless against suffering as when we love.", author: "Sigmund Freud" },

  // Psychology & self-awareness
  { text: "Until you make the unconscious conscious, it will direct your life and you will call it fate.", author: "Carl Jung" },
  { text: "The curious paradox is that when I accept myself just as I am, then I can change.", author: "Carl Rogers" },
  { text: "What we resist, persists.", author: "Carl Jung" },
  { text: "Feelings are just visitors. Let them come and go.", author: "Mooji" },
  { text: "Your task is not to seek for love, but merely to seek and find all the barriers within yourself that you have built against it.", author: "Rumi" },
  { text: "Healing doesn't mean the damage never existed. It means the damage no longer controls your life.", author: "Anonymous" },
  { text: "You are not your thoughts. You are the awareness behind them.", author: "Eckhart Tolle" },
  { text: "Between stimulus and response there is a space. In that space is our power to choose our response.", author: "Viktor Frankl" },
  { text: "The privilege of a lifetime is to become who you truly are.", author: "Carl Jung" },
  { text: "Owning our story and loving ourselves through that process is the bravest thing we'll ever do.", author: "Brené Brown" },
  { text: "Vulnerability is not winning or losing; it's having the courage to show up when you can't control the outcome.", author: "Brené Brown" },
  { text: "Anxiety is the dizziness of freedom.", author: "Søren Kierkegaard" },
  { text: "The wound is the place where the Light enters you.", author: "Rumi" },

  // Self-love & worth
  { text: "You yourself, as much as anybody in the entire universe, deserve your love and affection.", author: "Buddha" },
  { text: "How you love yourself is how you teach others to love you.", author: "Rupi Kaur" },
  { text: "Self-care is not selfish. You cannot serve from an empty vessel.", author: "Eleanor Brownn" },
  { text: "Be soft with yourself. You're doing the best you can with what you know.", author: "Anonymous" },
  { text: "You are allowed to be both a masterpiece and a work in progress simultaneously.", author: "Sophia Bush" },
  { text: "Talk to yourself like you would to someone you love.", author: "Brené Brown" },
  { text: "Your value doesn't decrease based on someone's inability to see your worth.", author: "Anonymous" },
  { text: "Caring for myself is not self-indulgence, it is self-preservation.", author: "Audre Lorde" },

  // Healing & growth
  { text: "Growth is painful. Change is painful. But nothing is as painful as staying stuck somewhere you don't belong.", author: "Mandy Hale" },
  { text: "The only way out is through.", author: "Robert Frost" },
  { text: "Healing is not linear. Some days you will feel like a warrior; some days you will feel like a wound. Both are valid.", author: "Anonymous" },
  { text: "Sometimes the bravest thing you can do is ask for help.", author: "Anonymous" },
  { text: "What hurts you, blesses you. Darkness is your candle.", author: "Rumi" },
  { text: "You don't have to have it all figured out to move forward.", author: "Anonymous" },
  { text: "Peace is the result of retraining your mind to process life as it is, rather than as you think it should be.", author: "Wayne Dyer" },
  { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
];

export const POST_CATEGORIES = [
  { value: "general", label: "General", emoji: "\ud83d\udcac", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
  { value: "relationship", label: "Relationships", emoji: "\ud83d\udc9e", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
  { value: "self-love", label: "Self-Love", emoji: "\ud83c\udf38", color: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300" },
  { value: "breakup", label: "Breakups", emoji: "\ud83d\udc94", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  { value: "family", label: "Family", emoji: "\ud83c\udfe1", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { value: "advice", label: "Advice", emoji: "\ud83e\udded", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
  { value: "story", label: "Story", emoji: "\ud83d\udcd6", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
];

export const MOOD_TAGS = [
  { value: "happy", label: "Happy", emoji: "\ud83d\ude0a" },
  { value: "hopeful", label: "Hopeful", emoji: "\ud83c\udf3f" },
  { value: "reflective", label: "Reflective", emoji: "\ud83c\udf19" },
  { value: "anxious", label: "Anxious", emoji: "\ud83c\udf43" },
  { value: "heartbreak", label: "Heartbroken", emoji: "\ud83d\udc94" },
  { value: "grateful", label: "Grateful", emoji: "\ud83d\ude4f" },
  { value: "confused", label: "Confused", emoji: "\ud83c\udf00" },
  { value: "in-love", label: "In Love", emoji: "\ud83d\udc97" },
];

export const REACTION_EMOJIS = ["\u2764\ufe0f", "\ud83e\udd17", "\ud83d\udcaa", "\ud83d\ude4f", "\u2728"];

export const MOOD_OPTIONS = [
  { value: "joyful", label: "Joyful", emoji: "\ud83d\ude04", color: "#f59e0b", score: 9 },
  { value: "calm", label: "Calm", emoji: "\ud83d\ude0c", color: "#14b8a6", score: 7 },
  { value: "grateful", label: "Grateful", emoji: "\ud83d\ude4f", color: "#a855f7", score: 8 },
  { value: "in-love", label: "In Love", emoji: "\ud83d\udc97", color: "#ec4899", score: 9 },
  { value: "hopeful", label: "Hopeful", emoji: "\ud83c\udf31", color: "#22c55e", score: 7 },
  { value: "neutral", label: "Neutral", emoji: "\ud83d\ude10", color: "#64748b", score: 5 },
  { value: "anxious", label: "Anxious", emoji: "\ud83d\ude30", color: "#0ea5e9", score: 3 },
  { value: "sad", label: "Sad", emoji: "\ud83d\ude22", color: "#6366f1", score: 2 },
  { value: "angry", label: "Angry", emoji: "\ud83d\ude20", color: "#ef4444", score: 1 },
];

export function generateMoodInsight(mood: string, score: number, content: string): string {
  const insights: Record<string, string[]> = {
    joyful: [
      "Joy is contagious \u2014 your energy today may quietly lift someone around you. Notice what sparked it so you can return to it.",
      "High-vibe days are worth bottling. Write down one specific moment that made you smile; memory fades faster than ink.",
    ],
    calm: [
      "Calm is not the absence of feeling but the presence of safety. You've created space for yourself today \u2014 protect it.",
      "A regulated nervous system is a quiet superpower. Use this steadiness to reflect, not to numb.",
    ],
    grateful: [
      "Gratitude rewires the brain toward abundance. Naming three specifics amplifies the effect \u2014 try it now.",
      "When you appreciate what you have, what you have appreciates. Gratitude is the bridge between enough and plenty.",
    ],
    "in-love": [
      "Love is a mirror \u2014 it shows you both your light and the places still asking to be healed. Move gently.",
      "Infatuation floods; love anchors. Notice whether you feel more like yourself or less, and let that guide you.",
    ],
    hopeful: [
      "Hope is not optimism \u2014 it's the decision to act as if the future can be kinder than the past. Keep walking.",
      "Hope grows in motion. One small step today matters more than a perfect plan tomorrow.",
    ],
    neutral: [
      "Neutral days are rest days for the heart. Not every page has to be a climax; some are just turning pages.",
      "A flat mood isn't a failure \u2014 it's a baseline. Use the stillness to notice what you usually drown out.",
    ],
    anxious: [
      "Anxiety lives in the future. Gently bring yourself back: name 5 things you see, 4 you can touch, 3 you hear.",
      "Your worry is trying to protect you, but it's overstepping. Thank it, then ask: is this threat real or rehearsed?",
    ],
    sad: [
      "Sadness asks to be felt, not fixed. Let it move through you like weather \u2014 it always does move.",
      "Tears are the body's way of processing what the mind can't yet articulate. You're not breaking; you're clearing.",
    ],
    angry: [
      "Anger is a boundary-signal \u2014 it tells you something mattered. Before reacting, ask what value was crossed.",
      "Anger without action festers; anger with wisdom transforms. Channel it into one clear, calm boundary.",
    ],
  };
  const pool = insights[mood] ?? insights.neutral;
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
    emoji: "\ud83d\udcac",
    description: "You feel most loved through spoken and written appreciation. Kind, specific words land deeper for you than grand gestures \u2014 tell your people what you admire about them, and ask for the same in return.",
  },
  touch: {
    label: "Physical Touch",
    emoji: "\ud83e\udd1d",
    description: "Your body reads love before your mind does. A hand on your back, a hug that lasts a beat longer \u2014 these are your love letters. You thrive with safe, affectionate connection.",
  },
  time: {
    label: "Quality Time",
    emoji: "\u23f3",
    description: "Undivided attention is your currency of love. When someone sets the world aside for you, you feel chosen. Guard presence over productivity in your closest bonds.",
  },
  gifts: {
    label: "Receiving Gifts",
    emoji: "\ud83c\udf81",
    description: "It's never about price \u2014 it's about being thought of. A found shell, a saved flower, the right book at the right time. You feel loved when someone proves they notice you.",
  },
  acts: {
    label: "Acts of Service",
    emoji: "\ud83d\udee0\ufe0f",
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
        { text: "Spiral \u2014 did I do something wrong?", style: "anxious" },
        { text: "Feel relieved \u2014 more space for me", style: "avoidant" },
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
        { text: "I'm not enough \u2014 I have to earn it", style: "anxious" },
        { text: "I'm fine on my own, thanks", style: "avoidant" },
        { text: "I want it but I'm scared of it", style: "fearful" },
      ],
    },
  ],
};

export const ATTACHMENT_RESULTS: Record<string, { label: string; emoji: string; description: string }> = {
  secure: {
    label: "Secure",
    emoji: "\ud83c\udf33",
    description: "You trust that love can be steady. You're comfortable with closeness and with autonomy. This doesn't mean you never feel hurt \u2014 it means you believe in repair. You're a grounding force in relationships.",
  },
  anxious: {
    label: "Anxious-Preoccupied",
    emoji: "\ud83c\udf0a",
    description: "You love deeply and crave reassurance. Your nervous system reads distance as danger. The work isn't to stop caring \u2014 it's to build inner safety so someone else's mood doesn't dictate your worth.",
  },
  avoidant: {
    label: "Dismissive-Avoidant",
    emoji: "\ud83c\udfd4\ufe0f",
    description: "Independence is your armor. Closeness can feel like losing yourself, so you create distance to feel safe. Growth looks like letting one trusted person in, slowly, and staying.",
  },
  fearful: {
    label: "Fearful-Avoidant",
    emoji: "\ud83c\udf2a\ufe0f",
    description: "You long for love and fear it equally. You want someone to stay but expect them to leave. Healing begins with tiny, consistent acts of safety \u2014 with others and with yourself.",
  },
};

export const DATING_PROMPTS = [
  "Ask me about the book that changed me \ud83d\udcda",
  "My ideal Sunday involves coffee and\u2026",
  "Controversial opinion: pineapple on pizza?",
  "Teach me something in 60 seconds",
  "The trait I admire most in a person is\u2026",
  "I'm secretly really good at\u2026",
  "My love language is probably\u2026",
  "Last thing that made me laugh out loud:",
];

export const INTEREST_OPTIONS = [
  "Music", "Books", "Movies", "Travel", "Cooking", "Hiking", "Yoga",
  "Gaming", "Art", "Photography", "Coffee", "Wine", "Dogs", "Cats",
  "Fitness", "Meditation", "Dance", "Writing", "Philosophy", "Nature",
];
