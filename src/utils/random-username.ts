const {
    uniqueNamesGenerator,
    colors,
    animals,
    names,
    adjectives,
    starWars,
    NumberDictionary
} = require('unique-names-generator');

// Define gamified dictionary pairs
const gamifiedDictionaryPairs = [
    [adjectives, animals],    // e.g., "CleverWolf"
    [colors, animals],        // e.g., "BlueDragon"
    [adjectives, starWars],   // e.g., "BraveYoda"
    [adjectives, names],      // e.g., "HappyJohn"
    [colors, starWars],       // e.g., "GreenLuke"
    [starWars, animals],      // e.g., "LeiaTiger"
    [colors, names]           // e.g., "RedAlice"
];

// Function to generate a gamified username
export function generateGamifiedUsername(includeNumber: boolean = false) {
    // Randomly pick a gamified pair
    const randomPair = gamifiedDictionaryPairs[Math.floor(Math.random() * gamifiedDictionaryPairs.length)];
    const numberDictionary = NumberDictionary.generate({min: 100, max: 999});

    // Generate username
    return uniqueNamesGenerator({
        dictionaries: includeNumber ? [randomPair, numberDictionary] : randomPair,
        separator: '',
        style: 'capital' // Capitalize each word for better readability
    });
}
