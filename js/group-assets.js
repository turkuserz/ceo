export const GROUP_PROFILE_IMAGES = Object.freeze({
  BASTIEN: './assets/logobastien.png',
  EVELYN: './assets/evelyn.png',
  STANNOWAYHOME: './assets/Stannowayhome.png',
  JOPNOK: './assets/jopnok.png',
  ASSASSIN: './assets/assassin.png'
});

export function groupProfile(group) {
  return GROUP_PROFILE_IMAGES[String(group || '').toUpperCase()] || GROUP_PROFILE_IMAGES.BASTIEN;
}
