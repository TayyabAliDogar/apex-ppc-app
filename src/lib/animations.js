// Animation variants for Framer Motion
// Obsidian & Emerald Theme

export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeInOut' }
};

export const cardHover = {
  rest: {
    scale: 1,
    boxShadow: '0 0 0 rgba(16, 185, 129, 0)'
  },
  hover: {
    scale: 1.05,
    boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)', // Emerald glow
    transition: { duration: 0.2, ease: 'easeOut' }
  }
};

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

export const buttonPress = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};
