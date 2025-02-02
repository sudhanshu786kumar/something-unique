export const generateAvatar = (seed) => {
  const styles = ['adventurer', 'avataaars', 'bottts', 'funEmoji'];
  const style = styles[Math.floor(Math.random() * styles.length)];
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=orange,yellow`;
};

export const getDefaultAvatar = (email) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;
}; 