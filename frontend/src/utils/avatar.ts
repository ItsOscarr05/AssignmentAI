export const getAvatarUrl = (userId: string, name?: string) => {
  // Use DiceBear API for consistent avatars
  const seed = userId || name || 'default';
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
};
