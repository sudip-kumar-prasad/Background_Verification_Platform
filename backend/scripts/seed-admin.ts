import prisma from '../src/config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

async function main() {
  const email = 'admin@example.com';
  const password = 'Admin123';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('✅ Admin user already exists');
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      name: 'Admin User',
      email,
      passwordHash,
    },
  });

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'super-secret-bgv-key-change-in-production',
    { expiresIn: '24h' }
  );

  console.log('✅ Admin user created');
  console.log('Login credentials:');
  console.log('  Email:    ', email);
  console.log('  Password: ', password);
  console.log('JWT (for debugging):', token);
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin user', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
