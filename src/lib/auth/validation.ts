import { z } from "zod";

const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email is too long.")
  .email("Enter a valid email address.");

export const LoginSchema = z.strictObject({
  email: EmailSchema,
  password: z
    .string()
    .min(1, "Enter your password.")
    .max(128, "Password is too long."),
});

export const SignupSchema = z
  .strictObject({
    fullName: z
      .string()
      .trim()
      .min(1, "Enter your full name.")
      .max(100, "Full name must be 100 characters or fewer."),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Username must be at least 3 characters.")
      .max(30, "Username must be 30 characters or fewer.")
      .regex(
        /^[a-z0-9](?:[a-z0-9_]*[a-z0-9])?$/,
        "Start and end with a letter or number; use underscores only between them.",
      ),
    email: EmailSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must be 128 characters or fewer."),
    confirmPassword: z.string(),
  })
  .refine(({ confirmPassword, password }) => confirmPassword === password, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;

export type AuthFieldErrors = Partial<
  Record<keyof SignupInput, string[]>
>;

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: AuthFieldErrors;
};

export function toFieldErrors(error: z.ZodError): AuthFieldErrors {
  return error.flatten().fieldErrors as AuthFieldErrors;
}
