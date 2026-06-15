const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = bcrypt.hashSync('admin123', 12)

  // All users from dump (same hashed passwords, admin gets reset)
  const users = [
    { id: 1, name: 'Super Admin',  username: 'admin', password: hashedPassword,              role: 'superadmin' },
    { id: 4, name: 'Kalam Aulia',   username: 'kalam', password: '$2b$12$honzG9CzImG6eaARhtShOOxRibXp8VMttbqxJpSNreaR1zMXGzqnK', role: 'user' },
    { id: 3, name: 'Rudi Wicaksono',username: 'rudi',  password: '$2b$12$crBp7wQhgVyf2CBMLVrp8eHOTUlSpzQFcRvl2HxNpH.8HGJKenzNO', role: 'admin' },
    { id: 5, name: 'Habib Syaukani',username: 'habib', password: '$2b$12$S3DTbZP8.ctUiBwGSO/wYOfzxVoAV0e.dyinpNE66PTtcQdS/NPwC', role: 'user' },
  ]

  for (const u of users) {
    const result = await prisma.user.upsert({
      where: { username: u.username },
      update: { password: u.password, role: u.role },
      create: { name: u.name, username: u.username, password: u.password, role: u.role, isActive: true },
    })
    console.log(`Seeded: ${result.username} (${result.role})`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
