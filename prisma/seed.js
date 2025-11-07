const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Rôles et privilèges de base
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'user' },
  });

  const readPriv = await prisma.privilege.upsert({
    where: { name: 'read_video' },
    update: {},
    create: { name: 'read_video' },
  });
  const uploadPriv = await prisma.privilege.upsert({
    where: { name: 'upload_video' },
    update: {},
    create: { name: 'upload_video' },
  });

  // Lier privilèges aux rôles (many-to-many)
  await prisma.role.update({
    where: { id: adminRole.id },
    data: { privileges: { connect: [{ id: readPriv.id }, { id: uploadPriv.id }] } },
  });
  await prisma.role.update({
    where: { id: userRole.id },
    data: { privileges: { connect: [{ id: readPriv.id }] } },
  });

  // Types de vidéos
  await prisma.videoType.upsert({ where: { name: 'film' }, update: {}, create: { name: 'film' } });
  await prisma.videoType.upsert({ where: { name: 'serie' }, update: {}, create: { name: 'serie' } });

  // Genres
  await prisma.genre.upsert({ where: { name: 'action' }, update: {}, create: { name: 'action' } });
  await prisma.genre.upsert({ where: { name: 'drame' }, update: {}, create: { name: 'drame' } });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());