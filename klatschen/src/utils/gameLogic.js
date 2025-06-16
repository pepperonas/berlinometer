// Karten-Definitionen
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = [7, 8, 9, 10, 11, 12, 13, 14]; // 11=Bube, 12=Dame, 13=König, 14=Ass

export function initializeDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  return shuffleDeck(deck);
}

function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck) {
  const playerHand = deck.slice(0, 3);
  const aiHand = deck.slice(3, 6);
  const middleCards = deck.slice(6, 9);
  const remainingDeck = deck.slice(9);
  
  return { playerHand, aiHand, middleCards, remainingDeck };
}

export function getCardPoints(card) {
  if (card.value === 14) return 11; // Ass
  if (card.value >= 11) return 10; // Bube, Dame, König
  return card.value; // 7-10
}

export function calculateHandValue(hand) {
  // Berechne Punkte pro Farbe
  const suitPoints = {};
  for (const suit of suits) {
    suitPoints[suit] = 0;
  }
  
  for (const card of hand) {
    suitPoints[card.suit] += getCardPoints(card);
  }
  
  // Finde höchste Punktzahl einer Farbe
  let maxPoints = 0;
  for (const suit of suits) {
    if (suitPoints[suit] > maxPoints) {
      maxPoints = suitPoints[suit];
    }
  }
  
  // Prüfe auf 31 (Ass + 10 + 10 gleicher Farbe)
  for (const suit of suits) {
    if (suitPoints[suit] === 31) {
      return 31;
    }
  }
  
  // Prüfe auf drei gleiche Werte (30.5 Punkte)
  const valueCounts = {};
  for (const card of hand) {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  }
  
  for (const value in valueCounts) {
    if (valueCounts[value] === 3) {
      return 30.5;
    }
  }
  
  return maxPoints;
}

export function checkGameEnd(playerHand, aiHand) {
  const playerValue = calculateHandValue(playerHand);
  const aiValue = calculateHandValue(aiHand);
  
  if (playerValue > aiValue) {
    return { 
      winner: 'player', 
      message: `Du gewinnst die Runde! ${playerValue} zu ${aiValue} Punkte` 
    };
  } else if (aiValue > playerValue) {
    return { 
      winner: 'ai', 
      message: `KI gewinnt die Runde! ${aiValue} zu ${playerValue} Punkte` 
    };
  } else {
    return { 
      winner: 'tie', 
      message: `Unentschieden! Beide haben ${playerValue} Punkte` 
    };
  }
}
