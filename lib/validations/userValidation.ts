import { z } from 'zod';

// Role enum
export const UserRole = z.enum(['admin', 'teacher', 'student']);

// Email validation schema
const emailSchema = z.string().email('Invalid email address');

// Create User Schema
// Create User Schema
export const CreateUserSchema = z.object({
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    role: UserRole,
    school_id: z.string().uuid('Invalid school ID').optional().nullable(),
    roll_number: z.string().optional().nullable(),
    student_class: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
    // If role is student, roll_number is required
    if (data.role === 'student') {
        if (!data.roll_number) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Roll number is required for students",
                path: ["roll_number"]
            });
        }
    }

    // If role is NOT student, email is required
    if (data.role !== 'student') {
        if (!data.email) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Email is required for non-student users",
                path: ["email"]
            });
        }
    }
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
