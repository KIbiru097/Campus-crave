const assert = require('assert');
const { createBatchLoader } = require('./loaders');

async function runTests() {
    console.log('🧪 Testing createBatchLoader...');

    // Test 1: Batching simultaneous load calls
    let batchFnCallCount = 0;
    let batchFnKeysCalled = [];

    const testLoader = createBatchLoader(async (keys) => {
        batchFnCallCount++;
        batchFnKeysCalled.push(...keys);
        const map = new Map();
        keys.forEach(k => map.set(k, `value-${k}`));
        return map;
    });

    const promise1 = testLoader.load(1);
    const promise2 = testLoader.load(2);
    const promise3 = testLoader.load(3);

    const [res1, res2, res3] = await Promise.all([promise1, promise2, promise3]);

    assert.strictEqual(res1, 'value-1', 'Key 1 should resolve to value-1');
    assert.strictEqual(res2, 'value-2', 'Key 2 should resolve to value-2');
    assert.strictEqual(res3, 'value-3', 'Key 3 should resolve to value-3');
    assert.strictEqual(batchFnCallCount, 1, 'batchFn should have been called exactly once for simultaneous load calls');
    assert.deepStrictEqual(batchFnKeysCalled, [1, 2, 3], 'batchFn should receive all keys in batch');

    console.log('✅ Test 1 passed: Simultaneous load calls were batched into 1 execution.');

    // Test 2: Handling null and undefined keys
    const nullRes = await testLoader.load(null);
    const undefRes = await testLoader.load(undefined);

    assert.strictEqual(nullRes, null, 'null key should resolve to null');
    assert.strictEqual(undefRes, null, 'undefined key should resolve to null');

    console.log('✅ Test 2 passed: null and undefined keys handled gracefully.');

    // Test 3: Missing keys in batch result default to null
    const missingLoader = createBatchLoader(async (keys) => {
        const map = new Map();
        map.set(10, 'found-10'); // key 20 omitted
        return map;
    });

    const [foundVal, missingVal] = await Promise.all([
        missingLoader.load(10),
        missingLoader.load(20)
    ]);

    assert.strictEqual(foundVal, 'found-10', 'Key 10 should resolve to found-10');
    assert.strictEqual(missingVal, null, 'Missing key 20 should resolve to null');

    console.log('✅ Test 3 passed: Missing keys default to null.');

    console.log('🎉 All batch loader tests passed successfully!');
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
