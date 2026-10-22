const API_URL = 'https://akabab.github.io/starwars-api/api/all.json';
let characters = [];

try {
  const response = await fetch(API_URL);
  characters = await response.json();
} catch (error) {
  console.log('Could not load characters from the Star Wars API');
}

export function getCharacters(search) {
  return characters.filter((character) => character.name.toLowerCase().includes(search));
}

export function getCharacter(id) {
  const index = characters.findIndex((character) => character.id === Number(id));

  if (index === -1) {
    return null;
  }

  const character = { ...characters[index] };
  character.masters = [].concat(character.masters || []);
  character.apprentices = [].concat(character.apprentices || []);
  character.affiliations = [].concat(character.affiliations || []);
  character.formerAffiliations = [].concat(character.formerAffiliations || []);
  character.prevId = characters[(index - 1 + characters.length) % characters.length].id;
  character.nextId = characters[(index + 1) % characters.length].id;

  return character;
}
