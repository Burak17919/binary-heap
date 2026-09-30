import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BinaryHeap } from '../src/index.js';

// Deterministic helpers. We never assert on wall-clock time; any time-
// dependent behaviour would take a clock function as a constructor argument.

/** Builds a heap populated with the given values, in insertion order. */
function fromValues(values, compare) {
  const h = new BinaryHeap(compare);
  for (const v of values) h.insert(v);
  return h;
}

/** Drains the heap into an array in ascending (extract-min) order. */
function drain(h) {
  const out = [];
  let v;
  while ((v = h.extractMin()) !== undefined) out.push(v);
  return out;
}

test('empty heap peeks and extracts undefined', () => {
  const h = new BinaryHeap();
  assert.equal(h.size, 0);
  assert.equal(h.peek(), undefined);
  assert.equal(h.extractMin(), undefined);
});

test('insert and peek single element', () => {
  const h = new BinaryHeap();
  h.insert(42);
  assert.equal(h.size, 1);
  assert.equal(h.peek(), 42);
});

test('extract on a single-element heap leaves it empty', () => {
  const h = new BinaryHeap();
  h.insert(7);
  assert.equal(h.extractMin(), 7);
  assert.equal(h.size, 0);
  assert.equal(h.peek(), undefined);
  assert.equal(h.extractMin(), undefined);
});

test('extracts integers in ascending order', () => {
  const h = fromValues([5, 3, 8, 1, 9, 2, 7, 4, 6, 0]);
  assert.deepEqual(drain(h), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('already-sorted input stays sorted', () => {
  const h = fromValues([1, 2, 3, 4, 5]);
  assert.deepEqual(drain(h), [1, 2, 3, 4, 5]);
});

test('reverse-sorted input still yields ascending order', () => {
  const h = fromValues([5, 4, 3, 2, 1]);
  assert.deepEqual(drain(h), [1, 2, 3, 4, 5]);
});

test('duplicate values are all preserved', () => {
  const h = fromValues([3, 1, 3, 1, 3]);
  assert.deepEqual(drain(h), [1, 1, 3, 3, 3]);
});

test('FIFO order among comparator-equal elements', () => {
  // Two distinct objects that the comparator considers equal (both score 0).
  // The heap must return them in insertion order, which is the documented
  // tie-break policy. We assert on a stable, counter-based identity rather
  // than object identity to keep the test fully deterministic.
  let counter = 0;
  const make = (score) => ({ score, id: counter++ });
  const a = make(0);
  const b = make(0);
  const c = make(0);
  const h = new BinaryHeap((x, y) => x.score - y.score);
  h.insert(a); h.insert(b); h.insert(c);
  assert.deepEqual(drain(h), [a, b, c]);
});

test('custom comparator: max-heap via negated comparison', () => {
  const h = new BinaryHeap((x, y) => y - x); // larger first
  for (const v of [3, 1, 4, 1, 5, 9, 2, 6]) h.insert(v);
  assert.deepEqual(drain(h), [9, 6, 5, 4, 3, 2, 1, 1]);
});

test('strings ordered by lexicographic default', () => {
  const h = fromValues(['banana', 'apple', 'cherry', 'date']);
  assert.deepEqual(drain(h), ['apple', 'banana', 'cherry', 'date']);
});

test('interleaved insert and extract keeps the min invariant', () => {
  const h = new BinaryHeap();
  h.insert(5);
  h.insert(2);
  assert.equal(h.extractMin(), 2);
  h.insert(8);
  h.insert(1);
  assert.equal(h.extractMin(), 1);
  h.insert(3);
  assert.deepEqual(drain(h), [3, 5, 8]);
});

test('repeated equal keys across many inserts remain FIFO', () => {
  // A stress check for the seq tie-break: among many equal-priority items,
  // extraction order must match insertion order. Larger N than the basic
  // duplicate test so any subtle tie-break bug surfaces.
  const N = 200;
  const items = [];
  for (let i = 0; i < N; i++) items.push({ priority: 5, tag: i });
  const h = new BinaryHeap((x, y) => x.priority - y.priority);
  for (const it of items) h.insert(it);
  assert.deepEqual(drain(h), items);
});
