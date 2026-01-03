-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MANAGER', 'WORKER');

-- CreateEnum
CREATE TYPE "PhoneType" AS ENUM ('SMART', 'FEATURE');

-- CreateEnum
CREATE TYPE "LocationMethod" AS ENUM ('GPS', 'CELL', 'WIFI', 'PHONE');

-- CreateTable
CREATE TABLE "sites" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "manager_id" UUID,
    "center_lat" DECIMAL(10,7) NOT NULL,
    "center_lng" DECIMAL(10,7) NOT NULL,
    "radius_meters" INTEGER NOT NULL DEFAULT 200,
    "rest_interval_minutes" INTEGER NOT NULL DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL,
    "phone_type" "PhoneType" NOT NULL,
    "site_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_status" (
    "user_id" UUID NOT NULL,
    "last_lat" DECIMAL(10,7),
    "last_lng" DECIMAL(10,7),
    "is_inside" BOOLEAN NOT NULL DEFAULT false,
    "last_seen" TIMESTAMPTZ(6),
    "battery_level" INTEGER,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_status_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "attendance_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "lat" DECIMAL(10,7) NOT NULL,
    "lng" DECIMAL(10,7) NOT NULL,
    "is_offline_sync" BOOLEAN NOT NULL DEFAULT false,
    "distance_meters" DECIMAL(10,2),
    "is_inside_geofence" BOOLEAN,
    "location_method" "LocationMethod" NOT NULL DEFAULT 'GPS',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_sites_manager" ON "sites"("manager_id");

-- CreateIndex
CREATE INDEX "idx_sites_active" ON "sites"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "idx_users_phone" ON "users"("phone");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_users_site" ON "users"("site_id");

-- CreateIndex
CREATE INDEX "idx_users_active" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "idx_live_status_is_inside" ON "live_status"("is_inside");

-- CreateIndex
CREATE INDEX "idx_live_status_last_seen" ON "live_status"("last_seen" DESC);

-- CreateIndex
CREATE INDEX "idx_attendance_logs_user" ON "attendance_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_attendance_logs_timestamp" ON "attendance_logs"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_attendance_logs_user_timestamp" ON "attendance_logs"("user_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_attendance_logs_offline_sync" ON "attendance_logs"("is_offline_sync");

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_status" ADD CONSTRAINT "live_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
