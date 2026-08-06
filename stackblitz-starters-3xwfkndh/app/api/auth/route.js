import { NextResponse } from 'next/server';
import { readData, writeData } from '../../lib/jsonDB';

export async function POST(request) {
  const { email, password } = await request.json();
  const users = readData('users.json');

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Invalid email or password' },
      { status: 401 }
    );
  }

  if (!user.isActive) {
    return NextResponse.json(
      { success: false, message: 'Account is deactivated' },
      { status: 403 }
    );
  }

  // Audit log
  const audit = readData('audit.json');
  audit.unshift({
    id: audit.length + 1,
    action: 'LOGIN',
    performedBy: user.name,
    recordId: '-',
    oldValue: '-',
    newValue: '-',
    timestamp: new Date().toLocaleString()
  });
  writeData('audit.json', audit);

  return NextResponse.json({
    success: true,
    message: `Welcome ${user.name}!`,
    user: { id: user.id, name: user.name, role: user.role }
  });
}