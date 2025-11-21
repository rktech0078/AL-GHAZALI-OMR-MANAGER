import { z } from 'zod';

// Role enum
export const UserRole = z.enum(['admin', 'teacher', 'student']);

// Email validation schema
const emailSchema = z.string().email('Invalid email address');

// Create User Schema
export const CreateUserSchema = z.object({
    email: emailSchema,
    password: z.string().min(6, 'Password must be at least 6 characters'),
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    role: UserRole,
    school_id: z.string().uuid('Invalid school ID').optional().nullable(),
    roll_number: z.string().optional().nullable(),
    student_class: z.string().optional().nullable(),
});

// Update User Schema (no email or password update)
export const UpdateUserSchema = z.object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    role: UserRole.optional(),
    school_id: z.string().uuid('Invalid school ID').optional().nullable(),
    roll_number: z.string().optional().nullable(),
    student_class: z.string().optional().nullable(),
});

// Type exports
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
