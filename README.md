# binary-heap

A small, dependency-free binary min-heap. Elements live in a flat array laid out as a complete binary tree; `peek` is O(1), `insert` and `extractMin` are O(log n). The default comparator orders numbers ascending; pass your own to heap objects, strings, or anything else.

```js
import { BinaryHeap } from 'binary-heap';

const h = new BinaryHeap();            // min-heap of numbers
h.insert(5);
h.insert(1);
h.insert(3);
h.peek();        // 1
h.extractMin();  // 1
h.size;          // 2
```

## Why this exists

Priority queues and Dijkstra-style algorithms need a min-heap that is cheap to peek, cheap to push, and cheap to pop. This library does exactly that and nothing else — no event emission, no iteration protocol, no bounded capacity. The trade-off is that it is deliberately narrow: if you need a general-purpose sorted collection (range queries, removal of arbitrary elements), this is not it.

The tree is stored 1-based in a JS array (index 0 unused). That makes the parent/child index math branch-free — `parent(i) = i >>> 1`, `left(i) = i << 1`, `right(i) = (i << 1) | 1` — at the cost of one wasted slot.

## Edge case to know about

Comparators that return `0` (equal keys) are supported, but the heap breaks ties by insertion order: among comparator-equal elements, the one inserted first comes out first. This is deliberate FIFO semantics. If your comparator already produces a total order and you never see ties, this never matters; if it does not, do not assume arbitrary tie order — it is stable and documented here.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

