import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCustomer, getCustomer, updateCustomer } from '../api/customers.js';

const emptyFields = {
  name: '',
  email: '',
  company: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(fields) {
  const nextErrors = {};

  if (!fields.name) {
    nextErrors.name = 'Name is required.';
  }

  if (!fields.email) {
    nextErrors.email = 'Email is required.';
  } else if (!emailPattern.test(fields.email)) {
    nextErrors.email = 'Enter a valid email address.';
  }

  if (!fields.company) {
    nextErrors.company = 'Company is required.';
  }

  return nextErrors;
}

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [fields, setFields] = useState(emptyFields);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const loadSequence = useRef(0);
  const inputRefs = {
    name: useRef(null),
    email: useRef(null),
    company: useRef(null),
  };

  useEffect(() => {
    loadSequence.current += 1;
    const sequence = loadSequence.current;

    setErrors({});
    setSaveError('');

    if (!isEditMode) {
      setFields(emptyFields);
      setLoadError('');
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    setIsLoading(true);
    setLoadError('');

    getCustomer(id, { signal: controller.signal })
      .then((customer) => {
        if (sequence !== loadSequence.current || controller.signal.aborted) {
          return;
        }

        setFields({
          name: customer?.name ?? '',
          email: customer?.email ?? '',
          company: customer?.company ?? '',
        });
      })
      .catch((error) => {
        if (sequence !== loadSequence.current || controller.signal.aborted) {
          return;
        }

        setLoadError(error.message || 'Unable to load customer.');
      })
      .finally(() => {
        if (sequence !== loadSequence.current || controller.signal.aborted) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [id, isEditMode]);

  function updateField(event) {
    const { name, value } = event.target;
    setFields((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = { ...current };
      delete next[name];
      return next;
    });
    setSaveError('');
  }

  function cancel() {
    navigate('/customers');
  }

  async function submit(event) {
    event.preventDefault();

    const trimmed = {
      name: fields.name.trim(),
      email: fields.email.trim(),
      company: fields.company.trim(),
    };
    const nextErrors = validate(trimmed);

    setErrors(nextErrors);
    setSaveError('');

    const firstInvalidField = ['name', 'email', 'company'].find((field) => nextErrors[field]);
    if (firstInvalidField) {
      inputRefs[firstInvalidField].current?.focus();
      return;
    }

    setIsSaving(true);

    try {
      if (isEditMode) {
        await updateCustomer(id, trimmed);
      } else {
        await createCustomer(trimmed);
      }

      navigate('/customers');
    } catch (error) {
      setSaveError(error.message || 'Unable to save customer.');
    } finally {
      setIsSaving(false);
    }
  }

  const heading = isEditMode ? 'Edit customer' : 'Create customer';
  const saveLabel = isEditMode ? 'Save changes' : 'Create customer';

  return (
    <section className="mx-auto max-w-xl rounded bg-white p-6 shadow">
      <h1 className="text-3xl font-bold">{heading}</h1>

      {isLoading ? <p className="mt-4">Loading customer…</p> : null}
      {loadError ? (
        <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-800" role="alert">
          {loadError}
        </div>
      ) : null}
      {saveError ? (
        <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-800" role="alert">
          {saveError}
        </div>
      ) : null}

      <form className="mt-6 space-y-4" noValidate onSubmit={submit}>
        <div>
          <label className="block font-medium" htmlFor="customer-name">
            Name
          </label>
          <input
            aria-describedby={errors.name ? 'customer-name-error' : undefined}
            aria-invalid={Boolean(errors.name)}
            className="mt-1 w-full rounded border border-gray-300 p-2"
            disabled={isLoading || isSaving}
            id="customer-name"
            name="name"
            onChange={updateField}
            ref={inputRefs.name}
            type="text"
            value={fields.name}
          />
          {errors.name ? (
            <p className="mt-1 text-sm text-red-700" id="customer-name-error">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label className="block font-medium" htmlFor="customer-email">
            Email
          </label>
          <input
            aria-describedby={errors.email ? 'customer-email-error' : undefined}
            aria-invalid={Boolean(errors.email)}
            className="mt-1 w-full rounded border border-gray-300 p-2"
            disabled={isLoading || isSaving}
            id="customer-email"
            name="email"
            onChange={updateField}
            inputMode="email"
            autoComplete="email"
            ref={inputRefs.email}
            type="text"
            value={fields.email}
          />
          {errors.email ? (
            <p className="mt-1 text-sm text-red-700" id="customer-email-error">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label className="block font-medium" htmlFor="customer-company">
            Company
          </label>
          <input
            aria-describedby={errors.company ? 'customer-company-error' : undefined}
            aria-invalid={Boolean(errors.company)}
            className="mt-1 w-full rounded border border-gray-300 p-2"
            disabled={isLoading || isSaving}
            id="customer-company"
            name="company"
            onChange={updateField}
            ref={inputRefs.company}
            type="text"
            value={fields.company}
          />
          {errors.company ? (
            <p className="mt-1 text-sm text-red-700" id="customer-company-error">
              {errors.company}
            </p>
          ) : null}
        </div>

        <div className="flex gap-3">
          <button
            className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
            disabled={isLoading || isSaving}
            type="submit"
          >
            {isSaving ? 'Saving…' : saveLabel}
          </button>
          <button
            className="rounded border border-gray-300 px-4 py-2 font-semibold disabled:opacity-60"
            disabled={isSaving}
            onClick={cancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
