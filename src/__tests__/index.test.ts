import { greet } from '../index';

describe("greet", () => {
  it('returns a greeting with provided name', () => {
    expect(greet('Test')).toBe('Hello, Test!');
  });
  it('returns the default greeting when no name is provided', () => {
    expect(greet()).toBe('Hello, World!');
  });
});
