import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Issues from '../pages/Issues.jsx';

function mockFetchOnce(data) {
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => data });
}

describe('Issues page', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('loads and renders default page with 10 items and paginates next/prev', async () => {
    // initial load
    mockFetchOnce({ items: Array.from({ length: 10 }, (_, i) => ({ id: i+1, number: i+1, title: `Issue ${i+1}`, state: 'open', created_at: new Date().toISOString() })), total: 25, offset: 0, limit: 10 });
    // after next
    mockFetchOnce({ items: Array.from({ length: 10 }, (_, i) => ({ id: i+11, number: i+11, title: `Issue ${i+11}`, state: 'open', created_at: new Date().toISOString() })), total: 25, offset: 10, limit: 10 });
    // after prev
    mockFetchOnce({ items: Array.from({ length: 10 }, (_, i) => ({ id: i+1, number: i+1, title: `Issue ${i+1}`, state: 'open', created_at: new Date().toISOString() })), total: 25, offset: 0, limit: 10 });

    render(<Issues />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/issues?offset=0&limit=10'));

    // should show 10 rows of data (we can check some rendered text)
    expect(await screen.findByText('Issue 1')).toBeInTheDocument();

    // click next
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/issues?offset=10&limit=10'));
    expect(await screen.findByText('Issue 11')).toBeInTheDocument();

    // click prev
    fireEvent.click(screen.getByText('Prev'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/issues?offset=0&limit=10'));
  });

  it('changing page size resets offset and disables next on last page', async () => {
    // initial load: total 15
    mockFetchOnce({ items: Array.from({ length: 10 }, (_, i) => ({ id: i+1, number: i+1, title: `Issue ${i+1}`, state: 'open', created_at: new Date().toISOString() })), total: 15, offset: 0, limit: 10 });
    // after changing limit to 5 reload with offset 0
    mockFetchOnce({ items: Array.from({ length: 5 }, (_, i) => ({ id: i+1, number: i+1, title: `Issue ${i+1}`, state: 'open', created_at: new Date().toISOString() })), total: 15, offset: 0, limit: 5 });
    // go next twice (offset 5 then 10)
    mockFetchOnce({ items: Array.from({ length: 5 }, (_, i) => ({ id: i+6, number: i+6, title: `Issue ${i+6}`, state: 'open', created_at: new Date().toISOString() })), total: 15, offset: 5, limit: 5 });
    mockFetchOnce({ items: Array.from({ length: 5 }, (_, i) => ({ id: i+11, number: i+11, title: `Issue ${i+11}`, state: 'open', created_at: new Date().toISOString() })), total: 15, offset: 10, limit: 5 });

    render(<Issues />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/issues?offset=0&limit=10'));

    // change limit select to 5
    const select = screen.getByDisplayValue('10');
    fireEvent.change(select, { target: { value: '5' } });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/issues?offset=0&limit=5'));

    // click next twice
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/issues?offset=5&limit=5'));
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/issues?offset=10&limit=5'));

    // Now next should be disabled (10+5 >= 15)
    const nextBtn = screen.getByText('Next');
    expect(nextBtn).toBeDisabled();
  });
});
