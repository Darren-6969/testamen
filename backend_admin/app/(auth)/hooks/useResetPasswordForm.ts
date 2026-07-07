import { useState } from 'react';
import { useRouter } from 'next/navigation';
import authService from '../../services/authService';

export function useResetPasswordForm(item: string | null) {
	const router = useRouter();
	const [formData, setFormData] = useState({ password: '', confirm: '' });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formValid, setFormValid] = useState<Record<string, boolean>>({});
	const token = item || '';

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
		if (error) setError(null);
	};

	const handleValidationChange =
		(fieldName: string) => (isValid: boolean) => {
			setFormValid(prev => ({ ...prev, [fieldName]: isValid }));
		};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const response = await authService.resetPassword(token, formData);

			if (response.success) {
				router.push('/reset-success');
			} else {
				setError(response.message || 'Password reset failed');
			}
		} catch {
			setError('An unexpected error occurred');
		} finally {
			setLoading(false);
		}
	};

	return {
		formData,
		setFormData,
		loading,
		error,
		formValid,
		setFormValid,
		handleInputChange,
		handleValidationChange,
		handleSubmit,
	};
};