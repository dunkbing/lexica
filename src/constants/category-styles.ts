// Category styling - icon and color definitions
// These are presentation concerns kept separate from database

export interface CategoryStyle {
  icon: string;
  color: string;
}

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  // About ourselves
  emotions: { icon: "heart.fill", color: "#E57373" },
  human_body: { icon: "figure.stand", color: "#F06292" },
  people: { icon: "person.2.fill", color: "#BA68C8" },

  // By parts of speech
  verbs: { icon: "arrow.right.circle.fill", color: "#9575CD" },
  nouns: { icon: "cube.fill", color: "#7986CB" },
  adjectives: { icon: "paintbrush.fill", color: "#64B5F6" },

  // Culture
  society: { icon: "person.3.fill", color: "#4FC3F7" },
  literature: { icon: "book.fill", color: "#4DD0E1" },
  art: { icon: "paintpalette.fill", color: "#4DB6AC" },
  music: { icon: "music.note", color: "#81C784" },
  food: { icon: "fork.knife", color: "#AED581" },
  history: { icon: "clock.fill", color: "#DCE775" },

  // Lexicon
  beautiful_words: { icon: "sparkles", color: "#FFF176" },
  slang: { icon: "bubble.left.fill", color: "#FFD54F" },
  expressions: { icon: "text.quote", color: "#FFB74D" },
  office: { icon: "briefcase.fill", color: "#FF8A65" },
  legal: { icon: "building.columns.fill", color: "#A1887F" },
  medicine: { icon: "cross.case.fill", color: "#90A4AE" },

  // The world around us
  daily_life: { icon: "house.fill", color: "#78909C" },
  business: { icon: "chart.line.uptrend.xyaxis", color: "#8D6E63" },
  flora_fauna: { icon: "leaf.fill", color: "#66BB6A" },
  travel: { icon: "airplane", color: "#26A69A" },
  science: { icon: "atom", color: "#5C6BC0" },
  technology: { icon: "desktopcomputer", color: "#7E57C2" },
  environment: { icon: "globe.americas.fill", color: "#26C6DA" },

  // By level
  beginner: { icon: "1.circle.fill", color: "#4CAF50" },
  intermediate: { icon: "2.circle.fill", color: "#FF9800" },
  advanced: { icon: "3.circle.fill", color: "#F44336" },

  // By test
  gre: { icon: "graduationcap.fill", color: "#3F51B5" },
  sat: { icon: "pencil.circle.fill", color: "#673AB7" },
  toefl: { icon: "globe", color: "#009688" },
  ielts: { icon: "doc.text.fill", color: "#E91E63" },

  // By origin
  latin_root: { icon: "building.columns", color: "#795548" },
  greek_root: { icon: "laurel.leading", color: "#607D8B" },
  french_root: { icon: "flag.fill", color: "#2196F3" },
  germanic_root: { icon: "shield.fill", color: "#FFC107" },
};

// Default style for unknown categories
export const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  icon: "folder.fill",
  color: "#9E9E9E",
};

// Helper to get category style
export const getCategoryStyle = (categoryId: string): CategoryStyle => {
  return CATEGORY_STYLES[categoryId] ?? DEFAULT_CATEGORY_STYLE;
};
