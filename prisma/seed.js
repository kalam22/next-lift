const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = bcrypt.hashSync('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword },
    create: {
      name: 'Administrator',
      username: 'admin',
      password: hashedPassword,
      role: 'superadmin',
      isActive: true,
    },
  })

  console.log('Seeded admin user:', { id: admin.id, username: admin.username, role: admin.role })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
