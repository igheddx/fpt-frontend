// utils/randomNumber.js
export const generateUniqueNumber = () => {
  const usedIds = new Set();
  let id;
  do {
    id = Date.now() + Math.floor(Math.random() * 10000);
  } while (usedIds.has(id));
  usedIds.add(id);
  return id;
};
