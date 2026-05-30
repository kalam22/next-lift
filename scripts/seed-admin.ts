/**
 * Script untuk membuat super admin pertama.
 * Jalankan dengan: npx ts-node --project tsconfig.json scripts/seed-admin.ts
 * Atau: npx tsx scripts/seed-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@gpe.com'
  const password = 'Admin@123'
  const name = 'Super Admin'

  const existing = await (prisma as any).user.findUnique({ where: { email } })
  if (existing) {
    console.log(`✓ User ${email} sudah ada, skip.`)
    return
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await (prisma as any).user.create({
    data: { name, email, password: hashed, role: 'superadmin' },
  })

  console.log(`✓ Super admin dibuat:`)
  console.log(`  Email   : ${user.email}`)
  console.log(`  Password: ${password}`)
  console.log(`  Role    : ${user.role}`)
  console.log(`\n⚠️  Segera ganti password setelah login pertama!`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
