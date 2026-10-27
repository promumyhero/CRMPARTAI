import { z } from "zod";

/**
 * Validasi ketat untuk skema Login
 * - Melindungi dari SQL injection dan XSS payload via input email & password
 */
export const LoginInputSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .trim()
    .toLowerCase()
    .email("Format email tidak valid")
    .max(255, "Email maksimal 255 karakter"),
  password: z
    .string()
    .min(6, "Kata sandi minimal 6 karakter")
    .max(100, "Kata sandi maksimal 100 karakter"),
  rememberMe: z.boolean().optional().default(false),
});

/**
 * Validasi ketat untuk Pembuatan Pengguna Baru (Admin / Super Admin)
 */
export const CreateUserInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nama minimal 3 karakter")
    .max(150, "Nama maksimal 150 karakter")
    .regex(/^[a-zA-Z0-9\s.,'()-]+$/, "Nama mengandung karakter tidak valid"),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .trim()
    .toLowerCase()
    .email("Format email tidak valid")
    .max(255, "Email maksimal 255 karakter"),
  password: z
    .string()
    .min(6, "Kata sandi minimal 6 karakter")
    .max(100, "Kata sandi maksimal 100 karakter"),
  role: z
    .enum(["superadmin", "admin_dpc", "admin_pac", "operator", "viewer", "admin", "member"])
    .default("operator"),
  phone: z
    .string()
    .trim()
    .max(50, "Nomor telepon maksimal 50 karakter")
    .optional()
    .nullable(),
  status: z.enum(["active", "suspended"]).optional().default("active"),
  province: z.string().trim().max(100).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  district: z.string().trim().max(100).optional().nullable(),
});

/**
 * Validasi untuk Update Pengguna
 */
export const UpdateUserInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nama minimal 3 karakter")
    .max(150, "Nama maksimal 150 karakter")
    .regex(/^[a-zA-Z0-9\s.,'()-]+$/, "Nama mengandung karakter tidak valid")
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Format email tidak valid")
    .max(255, "Email maksimal 255 karakter")
    .optional(),
  password: z
    .string()
    .min(6, "Kata sandi minimal 6 karakter")
    .max(100, "Kata sandi maksimal 100 karakter")
    .optional(),
  role: z
    .enum(["superadmin", "admin_dpc", "admin_pac", "operator", "viewer", "admin", "member"])
    .optional(),
  phone: z.string().trim().max(50).optional().nullable(),
  status: z.enum(["active", "suspended"]).optional(),
  province: z.string().trim().max(100).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  district: z.string().trim().max(100).optional().nullable(),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;
