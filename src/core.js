/**
 * BinaryHeap — a min-heap stored as a complete binary tree in a flat array.
 *
 * Design notes
 * ------------
 * We store the tree in a flat array with 1-based indexing encoded directly into
 * the JS array (index 0 is left unused as a sentinel). This makes the parent and
 * child index arithmetic branch-free and trivially correct:
 *   parent(i) = i >>> 1
 *   left(i)   = i << 1
 *   right(i)  = (i << 1) | 1
 * A 0-based scheme would need a conditional in parent() and a shift in the
 * child formulas; the one-element overhead is a fair price for simpler, faster
 * arithmetic.
 *
 * This is a MIN-heap: the smallest element per the comparator sits at the root.
 * Extracting the minimum is O(log n); inserting is O(log n); peeking is O(1).
 *
 * Duplicate elements are permitted; they are ordered by the comparator's
 * transitive relation, with ties broken by insertion order (FIFO among equal
 * keys). FIFO tie-breaking is the reason we carry a per-entry sequence counter.
 */

/** @template T */
export class BinaryHeap {
  /**
   * @param {(a: T, b: T) => number} [compare]
   *   A comparator returning a negative number when a should come before b,
   *   zero when they are considered equal, and a positive number otherwise.
   *   Defaults to ascending numeric order. The heap treats this as a strict
   *   weak ordering; treat its sign, not its magnitude.
   */
  constructor(compare) {
    // Index 0 is intentionally unused; see the file-level comment for why.
    /** @type {{value: T, seq: number}[]} */
    this._data = [null];
    this._size = 0;
    this._seq = 0;
    /** @type {(a: T, b: T) => number} */
    this._cmp = typeof compare === 'function'
      ? compare
      : (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  }

  /** Number of elements currently in the heap. */
  get size() {
    return this._size;
  }

  /**
   * Returns the minimum element without removing it, or `undefined` if the
   * heap is empty. We return `undefined` (not throw) because peeking an empty
   * heap is a normal, recoverable condition in most callers.
   *
   * @returns {T | undefined}
   */
  peek() {
    return this._size === 0 ? undefined : this._data[1].value;
  }

  /**
   * Inserts `value` into the heap.
   *
   * @param {T} value
   * @returns {void}
   */
  insert(value) {
    this._size += 1;
    this._data[this._size] = { value, seq: this._seq++ };
    this._siftUp(this._size);
  }

  /**
   * Removes and returns the minimum element. Returns `undefined` when the heap
   * is empty (same rationale as peek()).
   *
   * @returns {T | undefined}
   */
  extractMin() {
    if (this._size === 0) return undefined;
    const top = this._data[1].value;
    const last = this._data[this._size];
    // Drop the tail slot first so we never read stale data if anything throws.
    this._data[this._size] = undefined;
    this._size -= 1;
    if (this._size > 0) {
      this._data[1] = last;
      this._siftDown(1);
    }
    return top;
  }

  /**
   * Restores the heap property by walking the element at `i` up toward the
   * root as long as it is smaller than its parent. Ties are broken by `seq`
   * so that among comparator-equal elements, the earlier insertion stays
   * above (i.e. comes out before) a later one — a FIFO policy for equal keys.
   *
   * @param {number} i
   * @returns {void}
   */
  _siftUp(i) {
    const data = this._data;
    const cmp = this._cmp;
    const item = data[i];
    while (i > 1) {
      const parentIdx = i >>> 1;
      const parent = data[parentIdx];
      const c = cmp(item.value, parent.value);
      if (c < 0 || (c === 0 && item.seq < parent.seq)) {
        data[i] = parent;
        i = parentIdx;
      } else {
        break;
      }
    }
    data[i] = item;
  }

  /**
   * Restores the heap property by walking the element at `i` down toward the
   * leaves, swapping it with the smaller of its two children. Ties between the
   * two children are broken by `seq` (FIFO) for the same reason as in siftUp.
   *
   * @param {number} i
   * @returns {void}
   */
  _siftDown(i) {
    const data = this._data;
    const cmp = this._cmp;
    const size = this._size;
    const item = data[i];
    // Half-open: a node at index <= size/2 has at least a left child.
    while ((i << 1) <= size) {
      let childIdx = i << 1;
      const rightIdx = childIdx | 1;
      // Pick the smaller child; break ties by seq so earlier insertions win.
      if (rightIdx <= size) {
        const left = data[childIdx];
        const right = data[rightIdx];
        const c = cmp(left.value, right.value);
        if (c > 0 || (c === 0 && left.seq > right.seq)) {
          childIdx = rightIdx;
        }
      }
      const child = data[childIdx];
      const c = cmp(item.value, child.value);
      if (c > 0 || (c === 0 && item.seq > child.seq)) {
        data[i] = child;
        i = childIdx;
      } else {
        break;
      }
    }
    data[i] = item;
  }
}
