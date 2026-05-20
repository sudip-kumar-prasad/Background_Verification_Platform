import prisma from '../src/config/db';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });
  console.log('=== Users in DB ===');
  console.dir(users, { depth: null });
}

main()
  .catch((e) => console.error('Error listing users:', e))
  .finally(() => prisma.$disconnect());
