const { PrismaClient } = require('@prisma/client')
const dotenv = require('dotenv')
dotenv.config()
const prisma = new PrismaClient()

async function main() {
  // ===============================
  // SEED SITES
  // ===============================
  await prisma.sites.createMany({
    data: [
      {
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        name: 'Chennai Construction Site A',
        center_lat: 13.0827,
        center_lng: 80.2707,
        radius_meters: 200,
        rest_interval_minutes: 60,
      },
      {
        id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
        name: 'Mumbai Metro Project',
        center_lat: 19.076,
        center_lng: 72.8777,
        radius_meters: 300,
        rest_interval_minutes: 90,
      },
      {
        id: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
        name: 'Bangalore Tech Park',
        center_lat: 12.9716,
        center_lng: 77.5946,
        radius_meters: 250,
        rest_interval_minutes: 60,
      },
    ],
    skipDuplicates: true,
  })

  // ===============================
  // SEED MANAGERS
  // ===============================
  await prisma.users.createMany({
    data: [
      {
        id: 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
        name: 'Rajesh Kumar',
        phone: '+919876543210',
        password_hash:
          '$2a$10$rZ8qXKJ9YvH5xKJ9YvH5xOqXKJ9YvH5xKJ9YvH5xKJ9YvH5xKJ9Yv',
        role: 'MANAGER',
        phone_type: 'SMART',
        site_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      },
      {
        id: 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b',
        name: 'Priya Sharma',
        phone: '+919876543211',
        password_hash:
          '$2a$10$rZ8qXKJ9YvH5xKJ9YvH5xOqXKJ9YvH5xKJ9YvH5xKJ9YvH5xKJ9Yv',
        role: 'MANAGER',
        phone_type: 'SMART',
        site_id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
      },
      {
        id: 'f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c',
        name: 'Amit Patel',
        phone: '+919876543212',
        password_hash:
          '$2a$10$rZ8qXKJ9YvH5xKJ9YvH5xOqXKJ9YvH5xKJ9YvH5xKJ9YvH5xKJ9Yv',
        role: 'MANAGER',
        phone_type: 'SMART',
        site_id: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
      },
    ],
    skipDuplicates: true,
  })

  // ===============================
  // UPDATE SITE MANAGERS
  // ===============================
  await prisma.sites.update({
    where: { id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' },
    data: { manager_id: 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a' },
  })

  await prisma.sites.update({
    where: { id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e' },
    data: { manager_id: 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b' },
  })

  await prisma.sites.update({
    where: { id: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f' },
    data: { manager_id: 'f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c' },
  })

  // ===============================
  // SEED WORKERS
  // ===============================
  await prisma.users.createMany({
    data: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'PREMNATH S',
        phone: '+917598253348',
        role: 'WORKER',
        phone_type: 'SMART',
        site_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'RAM',
        phone: '+919876543221',
        role: 'WORKER',
        phone_type: 'SMART',
        site_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Lakshmi Devi',
        phone: '+919876543222',
        role: 'WORKER',
        phone_type: 'SMART',
        site_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        name: 'SHANMUGA PRIYAN',
        phone: '+919566794604',
        role: 'WORKER',
        phone_type: 'FEATURE',
        site_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      },
    ],
    skipDuplicates: true,
  })

  // ===============================
  // SEED LIVE STATUS
  // ===============================
  await prisma.live_status.createMany({
    data: [
      {
        user_id: '11111111-1111-1111-1111-111111111111',
        last_lat: 13.0827,
        last_lng: 80.2707,
        is_inside: true,
        last_seen: new Date(Date.now() - 5 * 60 * 1000),
        battery_level: 85,
      },
      {
        user_id: '33333333-3333-3333-3333-333333333333',
        last_lat: 13.085,
        last_lng: 80.275,
        is_inside: false,
        last_seen: new Date(Date.now() - 45 * 60 * 1000),
        battery_level: 15,
      },
    ],
    skipDuplicates: true,
  })

  // ===============================
  // SEED ATTENDANCE LOGS
  // ===============================
  await prisma.attendance_logs.createMany({
    data: [
      {
        user_id: '11111111-1111-1111-1111-111111111111',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        lat: 13.0827,
        lng: 80.2707,
        is_offline_sync: false,
        distance_meters: 0,
        is_inside_geofence: true,
        location_method: 'GPS',
      },
    ],
  })

  console.log('✅ Prisma database seeding completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
