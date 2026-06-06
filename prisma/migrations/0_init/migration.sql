-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "psy_favorites" JSONB,
    "psy_dismissed_reviews" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Psychologist" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT,
    "avatar" TEXT,
    "experience" INTEGER,
    "license" TEXT,
    "specialization" TEXT,
    "initial_consultation" TEXT,
    "about" TEXT,
    "rating" DOUBLE PRECISION,
    "price_per_hour" DOUBLE PRECISION,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "reviews" JSONB,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "availability" JSONB,
    "user_email" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Psychologist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" SERIAL NOT NULL,
    "patient_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "time_slot" TEXT NOT NULL,
    "comment" TEXT,
    "psychologist_id" TEXT NOT NULL,
    "psychologist_name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Appointment_email_idx" ON "Appointment"("email");

-- CreateIndex
CREATE INDEX "Appointment_psychologist_id_idx" ON "Appointment"("psychologist_id");

