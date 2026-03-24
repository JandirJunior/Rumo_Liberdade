import { Character } from '@/types';
import { IMAGES } from '@/assets/images';

const VILLAINS_ARRAY = Object.values(IMAGES.VILLAINS).map(url => ({ image: url }));

// Helper function to generate static characters based on the rules
export const generateCharacters = (): Character[] => {
  const characters: Character[] = [];
  let villainIndex = 0;

  // Generate characters up to a reasonable amount, e.g., 100 levels
  for (let level = 1; level <= 100; level++) {
    const isBoss = level % 5 === 0; // Every 50k (5 * 10k) is a boss
    const requiredInvestment = level * 10000;
    
    // Cycle through available villain images
    const imageObj = VILLAINS_ARRAY[villainIndex % VILLAINS_ARRAY.length];
    
    characters.push({
      id: level,
      name: isBoss ? `Super Boss Nv. ${level / 5}` : `Vilão Nv. ${level}`,
      type: isBoss ? 'boss' : 'villain',
      requiredInvestment,
      image: imageObj.image,
      difficulty: isBoss ? 'epic' : 'medium',
      reward: isBoss ? `${500 * (level/5)} XP & Loot Épico` : `${100 * level} XP`,
    });

    villainIndex++;
  }

  return characters;
};

export const STATIC_CHARACTERS = generateCharacters();

export const getCurrentCharacter = (totalInvested: number): Character | null => {
  if (totalInvested < 10000) return null; // No villain until 10k

  // Find the highest character whose required investment is <= totalInvested
  // Since the array is sorted by requiredInvestment, we can just find the last one that matches
  let currentCharacter: Character | null = null;
  
  for (const char of STATIC_CHARACTERS) {
    if (totalInvested >= char.requiredInvestment) {
      currentCharacter = char;
    } else {
      break; // Stop searching once we exceed the total invested
    }
  }

  return currentCharacter;
};

export const getNextCharacter = (totalInvested: number): Character | null => {
  for (const char of STATIC_CHARACTERS) {
    if (char.requiredInvestment > totalInvested) {
      return char;
    }
  }
  return null;
};
