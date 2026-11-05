import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCustomer, getCustomer, updateCustomer } from '../api/customers.js';

const EMPTY_VALUES = {
  name: '',
  email: '',
  company: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCustomer(values) {
  const trimmed = {
    name: values.name.trim(),
    email: values.email.trim(),
    company: values.company.trim(),
  };
  const errors = {};

  if (!trimmed.name) errors.name = 'Name is required.';
  if (!trimmed.email) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(trimmed.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!trimmed.company) errors.company = 'Company is required.';

  return { errors, payload: trimmed };
}

function fieldErrorId(field) {
  return `${field}-error`;
}

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [values, setValues] = useState(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    if (!isEditMode) {
      setValues(EMPTY_VALUES);
      setFieldErrors({});
      setFormError('');
      setLoadError('');
      setIsLoading(false);
      return undefined;
    }

    let isCurrent = true;
    setIsLoading(true);
    setLoadError('');
    setFormError('');

    getCustomer(id)
      .then((customer) => {
        if (!isCurrent) return;
        setValues({
          name: customer?.name || '',
          email: customer?.email || '',
          company: customer?.company || '',
        });
        setFieldErrors({});
        setLoadError('');
      })
      .catch((error) => {
        if (!isCurrent) return;
        setLoadError(error?.message || 'Unable to load customer.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [id, isEditMode, loadAttempt]);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }, []);

  const handleCancel = useCallback(() => {
    navigate('/customers');
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { errors, payload } = validateCustomer(values);
    setFieldErrors(errors);
    setFormError('');

    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    try {
      if (isEditMode) {
        await updateCustomer(id, payload);
      } else {
        await createCustomer(payload);
      }
      navigate('/customers');
    } catch (error) {
      setFieldErrors(error?.fieldErrors || {});
      setFormError(error?.message || 'Unable to save customer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p role="status">Loading customer…</p>;
  }

  if (loadError) {
    return (
      <section className="max-w-xl space-y-4">
        <h1 className="text-3xl font-bold">Edit customer</h1>
        <div className="rounded border border-red-300 bg-red-50 p-4 text-red-800" role="alert">
          {loadError}
        </div>
        <div className="flex gap-3">
          <button
            className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            type="button"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
          >
            Try again
          </button>
          <button
            className="rounded border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-100"
            type="button"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-xl">
      <h1 className="text-3xl font-bold">{isEditMode ? 'Edit customer' : 'New customer'}</h1>
      <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
        {formError ? (
          <div className="rounded border border-red-300 bg-red-50 p-3 text-red-800" role="alert">
            {formError}
          </div>
        ) : null}

        <div>
          <label className="block font-semibold" htmlFor="name">
            Name
          </label>
          <input
            aria-describedby={fieldErrors.name ? fieldErrorId('name') : undefined}
            aria-invalid={fieldErrors.name ? 'true' : 'false'}
            className="mt-1 w-full rounded border border-gray-300 p-2"
            id="name"
            name="name"
            onChange={handleChange}
            type="text"
            value={values.name}
          />
          {fieldErrors.name ? (
            <p className="mt-1 text-sm text-red-700" id={fieldErrorId('name')}>
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label className="block font-semibold" htmlFor="email">
            Email
          </label>
          <input
            aria-describedby={fieldErrors.email ? fieldErrorId('email') : undefined}
            aria-invalid={fieldErrors.email ? 'true' : 'false'}
            className="mt-1 w-full rounded border border-gray-300 p-2"
            id="email"
            name="email"
            onChange={handleChange}
            type="email"
            value={values.email}
          />
          {fieldErrors.email ? (
            <p className="mt-1 text-sm text-red-700" id={fieldErrorId('email')}>
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label className="block font-semibold" htmlFor="company">
            Company
          </label>
          <input
            aria-describedby={fieldErrors.company ? fieldErrorId('company') : undefined}
            aria-invalid={fieldErrors.company ? 'true' : 'false'}
            className="mt-1 w-full rounded border border-gray-300 p-2"
            id="company"
            name="company"
            onChange={handleChange}
            type="text"
            value={values.company}
          />
          {fieldErrors.company ? (
            <p className="mt-1 text-sm text-red-700" id={fieldErrorId('company')}>
              {fieldErrors.company}
            </p>
          ) : null}
        </div>

        <div className="flex gap-3">
          <button
            className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button
            className="rounded border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-100"
            disabled={isSaving}
            type="button"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
