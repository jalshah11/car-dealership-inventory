import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { getErrorMessage } from '@/utils/get-error-message';

// Mirrors the backend's registerSchema (see backend/src/validators/auth.validator.ts)
// closely enough to give useful inline feedback -- but this is UX only.
// The backend re-validates everything independently and is the actual
// source of truth; a user could bypass this entirely with a raw API call.
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await registerUser(values.email, values.password, values.name);
      toast.success('Account created');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold text-navy">Create an account</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input label="Name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" isLoading={isSubmitting} className="mt-2">
          Sign up
        </Button>
      </form>

      <p className="mt-4 text-sm text-ink-soft">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-amber">
          Log in
        </Link>
      </p>
    </div>
  );
}
