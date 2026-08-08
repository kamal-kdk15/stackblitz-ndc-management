global.ndcStore = global.ndcStore || {
  'users.json': [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@sunpharma.com',
      password: 'admin123',
      role: 'Admin',
      isActive: true,
    },
    {
      id: 2,
      name: 'Kamal Deep',
      email: 'kamal@sunpharma.com',
      password: 'kamal123',
      role: 'SPOC',
      isActive: true,
    },
    {
      id: 3,
      name: 'Viewer User',
      email: 'viewer@sunpharma.com',
      password: 'view123',
      role: 'Viewer',
      isActive: true,
    },
  ],
  'ndc.json': [],
  'changes.json': [],
  'audit.json': [],
};

export function readData(fileName) {
  return global.ndcStore[fileName] || [];
}

export function writeData(fileName, data) {
  global.ndcStore[fileName] = data;
  return true;
}
