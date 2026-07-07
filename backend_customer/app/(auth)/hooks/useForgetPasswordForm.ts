import { useState } from 'react';
import { useRouter } from 'next/navigation';
import authService from '../../services/authService';

export function useForgetPasswordForm() {
	const router = useRouter();
	const [formData, setFormData] = useState({ email: '' });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formValid, setFormValid] = useState<Record<string, boolean>>({});

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
			const response = await authService.forgotPassword(formData);

			if (response.success) {
				router.push('/check-email');
			} else {
				setError(response.message || 'Email not found');
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