import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '@/context/AuthContext';
import { usersApi } from '@/app/api';
import { TextField, SelectField } from '@/components/forms/components/FormFields';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import Loader from '@/components/ui/Loader/Loader';
import { showSuccess, showError } from '@/utils/toast';
import { handleValidationError } from '@/features/utils/errorHandling';

const profileSchema = yup.object().shape({
  name: yup.string().trim().required('Name is required'),
  username: yup.string().trim().nullable().max(100),
  office: yup.string().trim().nullable().max(100),
  jobPosition: yup.string().trim().nullable().max(100),
  phone: yup.string().trim().nullable().max(50),
  avatarUrl: yup.string().trim().url('Valid URL required').nullable().max(500),
  gender: yup.string().trim().nullable().oneOf(['male', 'female', null]),
  colorSet: yup.string().trim().nullable().max(20),
});

const ProfilePage = () => {
  const { user: authUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatarImgError, setAvatarImgError] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset, watch, setValue } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: useMemo(() => ({
      name: '', username: '', office: '', jobPosition: '', phone: '',
      avatarUrl: '', gender: '', colorSet: '',
    }), []),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const avatarUrl = watch('avatarUrl') || profile?.avatarUrl;
  const name = watch('name') || profile?.name;
  const displayAvatar = (avatarUrl && !avatarImgError) ? avatarUrl : null;
  const initials = (name || profile?.name || '?').trim().substring(0, 2).toUpperCase();
  const email = profile?.email ?? authUser?.email ?? '—';

  const editFields = useMemo(() => [
    { name: 'name', label: 'Name', type: 'text', required: true, autoComplete: 'name' },
    { name: 'username', label: 'Username', type: 'text', placeholder: '—', autoComplete: 'username' },
    { name: 'office', label: 'Office', type: 'text', placeholder: '—', autoComplete: 'organization' },
    { name: 'jobPosition', label: 'Job position', type: 'text', placeholder: '—', autoComplete: 'organization-title' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '—', autoComplete: 'tel' },
    { name: 'avatarUrl', label: 'Avatar URL', type: 'url', placeholder: 'https://…' },
    { name: 'gender', label: 'Gender', type: 'select', options: [{ value: '', label: '—' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
    { name: 'colorSet', label: 'Color set', type: 'text', placeholder: '—' },
  ], []);

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name ?? '',
        username: profile.username ?? '',
        office: profile.office ?? '',
        jobPosition: profile.jobPosition ?? '',
        phone: profile.phone ?? '',
        avatarUrl: profile.avatarUrl ?? '',
        gender: profile.gender ?? '',
        colorSet: profile.colorSet ?? '',
      });
    }
  }, [profile, reset]);

  const fetchProfile = useCallback(async () => {
    if (!authUser?.id) {
      setError('Not authenticated.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const data = await usersApi.getById(authUser.id);
      setProfile(data.user);
      setAvatarImgError(false);
    } catch (err) {
      setError(err.message || 'Failed to load profile.');
      if (err.code === 'TOKEN_EXPIRED') logout();
    } finally {
      setIsLoading(false);
    }
  }, [authUser?.id, logout]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const onSubmit = useCallback(async (data) => {
    if (!authUser?.id) return;
    if (!isDirty) return;
    try {
      setError(null);
      const { user } = await usersApi.update(authUser.id, data);
      setProfile(user);
      reset({ name: user.name ?? '', username: user.username ?? '', office: user.office ?? '', jobPosition: user.jobPosition ?? '', phone: user.phone ?? '', avatarUrl: user.avatarUrl ?? '', gender: user.gender ?? '', colorSet: user.colorSet ?? '' });
      setAvatarImgError(false);
      showSuccess('Profile saved.');
    } catch (err) {
      setError(err.message || 'Failed to save.');
      handleValidationError(errors, 'Profile');
      showError(err.message || 'Failed to save.');
      if (err.code === 'TOKEN_EXPIRED') logout();
    }
  }, [authUser?.id, errors, isDirty, logout, reset]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader size="lg" text="Loading…" variant="spinner" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Profile
        </span>
        <span className="h-px flex-1 max-w-[2rem] bg-gray-200 dark:bg-gray-600 rounded-full shrink-0" />
      </div>

      <div className="bg-white dark:bg-smallCard rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row md:gap-8">
          {/* Avatar + identity */}
          <div className="flex flex-col items-center md:items-start md:w-44 shrink-0 mb-6 md:mb-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center shrink-0">
              {displayAvatar ? (
                <img src={displayAvatar} alt="" className="w-full h-full object-cover" onError={() => setAvatarImgError(true)} />
              ) : (
                <span className="text-2xl font-semibold text-white">{initials}</span>
              )}
            </div>
            <p className="mt-3 text-sm font-medium text-text-primary dark:text-text-white truncate w-full text-center md:text-left">{profile?.name || '—'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center md:text-left" title={email}>{email}</p>
            {profile?.departmentName && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center md:text-left mt-1" title="Department (read-only; change via DB/psql)">Department: {profile.departmentName}</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {editFields.map((field) => {
              if (field.type === 'select') {
                return (
                  <SelectField
                    key={field.name}
                    field={field}
                    register={register}
                    errors={errors}
                    watch={watch}
                    setValue={setValue}
                  />
                );
              }
              return (
                <TextField key={field.name} field={field} register={register} errors={errors} watch={watch} />
              );
            })}
            <div className="sm:col-span-2 pt-2">
              <DynamicButton type="submit" variant="primary" size="sm" loading={isSubmitting} disabled={!isDirty}>
                Save
              </DynamicButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
