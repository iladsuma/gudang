/**
 * @fileOverview Manajemen rahasia aplikasi.
 * File ini membaca dari variabel lingkungan (.env) untuk keamanan.
 */

export const DATABASE_URL = process.env.DATABASE_URL || "";
export const FONNTE_TOKEN = process.env.FONNTE_TOKEN || "";
export const ADMIN_PHONE = process.env.ADMIN_PHONE || "";
