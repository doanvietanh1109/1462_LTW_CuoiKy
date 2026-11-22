import test from "node:test";
import assert from "node:assert/strict";
import { createAsyncActionLock } from "../src/utils/asyncActionLock.js";

test("completion of one row update does not unlock another pending row", () => {
  const lock = createAsyncActionLock();

  assert.equal(lock.acquire("row-a"), true);
  assert.equal(lock.acquire("row-b"), true);
  assert.equal(lock.acquire("row-a"), false);

  lock.release("row-a");

  assert.equal(lock.has("row-a"), false);
  assert.equal(lock.has("row-b"), true);
  assert.equal(lock.acquire("row-b"), false);
  lock.release("row-b");
  assert.equal(lock.has("row-b"), false);
});
