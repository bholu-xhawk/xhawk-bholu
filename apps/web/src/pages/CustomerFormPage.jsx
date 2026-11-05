import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createCustomer,
  getCustomer,
  updateCustomer,
} from '../api/customers.js';

const EMPTY_CUSTOMER = {
  name: '',
  email: '',
  company: '',
};

function trimValues(values) {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    company: values.company.trim(),
  };
}

function validateCustomer(values) {
  const trimmed = trimValues(values);
  const errors = {};

  if (!trimmed.name) {
    errors.name = 'Name is required.';
  }

  if (!trimmed.email) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!trimmed.company) {
    errors.company = 'Company is required.';
  }

  return { errors, values: trimmed };
}

export default function CustomerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [values, setValues] = useState(EMPTY_CUSTOMER);
  const [fieldErrors, setFieldErrors] = useState({});
  const [requestError, setRequestError] = useState('');
  const [isLoading, setIsLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const title = isEditing ? 'Edit customer' : 'New customer';
  const requestErrorId = useMemo(
    () => (requestError ? 'customer-request-error' : undefined),
    [requestError]
  );

  useEffect(() => {
    let isCurrent = true;

    setFieldErrors({});
    setRequestError('');
    setLoadError('');

    if (!isEditing) {
      setValues(EMPTY_CUSTOMER);
      setIsLoading(false);
      return () => {
        isCurrent = false;
      };
    }

    setIsLoading(true);
    getCustomer(id)
      .then((customer) => {
        if (!isCurrent) {
          return;
        }

        setValues({
          name: customer.name || '',
          email: customer.email || '',
          company: customer.company || '',
        });
      })
      .catch((error) => {
        if (isCurrent) {
          setLoadError(error.message || 'Unable to load customer.');
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [id, isEditing]);

  function fieldErrorId(fieldName) {
    return fieldErrors[fieldName] ? `${fieldName}-error` : undefined;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function handleCancel() {
    navigate('/customers');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validation = validateCustomer(values);

    setFieldErrors(validation.errors);
    setRequestError('');

    if (Object.keys(validation.errors).length > 0) {
      setRequestError('Please fix the highlighted fields.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await updateCustomer(id, validation.values);
      } else {
        await createCustomer(validation.values);
      }
      navigate('/customers');
    } catch (error) {
      setRequestError(error.message || 'Unable to save customer.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      className="customer-form-page"
      aria-labelledby="customer-form-title"
    >
      <div className="customer-form-card">
        <div className="customer-form-header">
          <div>
            <p className="customer-form-eyebrow">Customers</p>
            <h1 id="customer-form-title">{title}</h1>
          </div>
          <p className="customer-form-help">
            Required fields are marked with an asterisk.
          </p>
        </div>

        {isLoading ? <p role="status">Loading customer…</p> : null}

        {loadError ? (
          <div className="request-error" role="alert">
            {loadError}
          </div>
        ) : null}

        {!isLoading && !loadError ? (
          <form
            aria-describedby={requestErrorId}
            aria-label="Customer details"
            className="customer-form"
            noValidate
            onSubmit={handleSubmit}
            role="form"
          >
            {requestError ? (
              <div
                className="request-error"
                id="customer-request-error"
                role="alert"
              >
                {requestError}
              </div>
            ) : null}

            <div className="customer-field">
              <label htmlFor="name">Name *</label>
              <input
                aria-describedby={fieldErrorId('name')}
                aria-invalid={Boolean(fieldErrors.name)}
                disabled={isSaving}
                id="name"
                name="name"
                onChange={handleChange}
                type="text"
                value={values.name}
              />
              {fieldErrors.name ? (
                <p className="field-error" id="name-error">
                  {fieldErrors.name}
                </p>
              ) : null}
            </div>

            <div className="customer-field">
              <label htmlFor="email">Email *</label>
              <input
                aria-describedby={fieldErrorId('email')}
                aria-invalid={Boolean(fieldErrors.email)}
                disabled={isSaving}
                id="email"
                name="email"
                onChange={handleChange}
                type="email"
                value={values.email}
              />
              {fieldErrors.email ? (
                <p className="field-error" id="email-error">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div className="customer-field">
              <label htmlFor="company">Company *</label>
              <input
                aria-describedby={fieldErrorId('company')}
                aria-invalid={Boolean(fieldErrors.company)}
                disabled={isSaving}
                id="company"
                name="company"
                onChange={handleChange}
                type="text"
                value={values.company}
              />
              {fieldErrors.company ? (
                <p className="field-error" id="company-error">
                  {fieldErrors.company}
                </p>
              ) : null}
            </div>

            <div className="customer-form-actions">
              <button
                className="customer-button customer-button-primary"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? 'Saving…' : 'Save customer'}
              </button>
              <button
                className="customer-button customer-button-secondary"
                disabled={isSaving}
                onClick={handleCancel}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </section>
  );
}
