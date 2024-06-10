export default async (filePath) => {
  if (!(await Bun.file(filePath).exists())) {
    await Bun.write(filePath, "{}");
  }

  let storage = await Bun.file(filePath).json();

  const set = async (key, value) => {
    storage[key] = value;
    return await sync();
  };

  const get = async (key) => {
    return storage[key];
  };

  const has = async (key) => {
    return storage.hasOwnProperty(key);
  };

  const remove = async (key) => {
    delete storage[key];
    return await sync();
  };

  const removeAll = async () => {
    storage = {};
    return await sync();
  };

  const sync = async () => {
    return Bun.write(filePath, JSON.stringify(storage));
  };

  return { set, get, has, remove, removeAll };
};
