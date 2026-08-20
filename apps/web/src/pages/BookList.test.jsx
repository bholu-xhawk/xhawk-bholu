import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BookList from './BookList.jsx';

const populatedResponse = {
  items: [
    {
      id: 1,
      title: 'Beloved',
      author: 'Toni Morrison',
      publicationDate: '1987-09-02T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      title: 'Kindred',
      author: 'Octavia E. Butler',
      publicationDate: '1979-06-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  page: 1,
  pageSize: 10,
  totalItems: 2,
  totalPages: 1,
  sortBy: 'title',
  sortDirection: 'asc',
};

function mockFetchResponse(body, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  });
}

function expectLastFetchToInclude(params) {
  const [url] = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
  const parsed = new URL(url, 'http://localhost');
  for (const [key, value] of Object.entries(params)) {
    expect(parsed.searchParams.get(key)).toBe(value);
  }
}

describe('BookList', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders fetched books in the table', async () => {
    global.fetch.mockResolvedValueOnce(mockFetchResponse(populatedResponse));

    render(<BookList />);

    expect(await screen.findByText('Beloved')).toBeInTheDocument();
    expect(screen.getByText('Toni Morrison')).toBeInTheDocument();
    expect(screen.getByText('Kindred')).toBeInTheDocument();
    expect(screen.getByText(/Showing 1-2 of 2 books/)).toBeInTheDocument();
    expectLastFetchToInclude({ page: '1', pageSize: '10', sortBy: 'title', sortDirection: 'asc' });
  });

  it('requests a new sort when a sortable header is clicked', async () => {
    global.fetch
      .mockResolvedValueOnce(mockFetchResponse(populatedResponse))
      .mockResolvedValueOnce(mockFetchResponse({ ...populatedResponse, sortBy: 'author' }));

    render(<BookList />);

    await screen.findByText('Beloved');
    fireEvent.click(screen.getByRole('button', { name: /Author/ }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    expectLastFetchToInclude({ page: '1', pageSize: '10', sortBy: 'author', sortDirection: 'asc' });
  });

  it('requests the next page when pagination controls are used', async () => {
    global.fetch
      .mockResolvedValueOnce(mockFetchResponse({ ...populatedResponse, totalItems: 12, totalPages: 2 }))
      .mockResolvedValueOnce(mockFetchResponse({ ...populatedResponse, page: 2, totalItems: 12, totalPages: 2 }));

    render(<BookList />);

    await screen.findByText('Beloved');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    expectLastFetchToInclude({ page: '2', pageSize: '10', sortBy: 'title', sortDirection: 'asc' });
  });

  it('renders an empty state when the API returns no books', async () => {
    global.fetch.mockResolvedValueOnce(
      mockFetchResponse({
        items: [],
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
        sortBy: 'title',
        sortDirection: 'asc',
      })
    );

    render(<BookList />);

    expect(await screen.findByText('No books found.')).toBeInTheDocument();
    expect(screen.getByText(/Showing 0-0 of 0 books/)).toBeInTheDocument();
  });

  it('renders an error message when the request fails', async () => {
    global.fetch.mockResolvedValueOnce(mockFetchResponse({ error: 'Failed to load booklist' }, false));

    render(<BookList />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load booklist');
  });
});
