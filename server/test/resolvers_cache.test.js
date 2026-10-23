const test = require('node:test');
const assert = require('node:assert/strict');
const { getCached, resolvers } = require('../src/schema/resolvers');

test('getCached deduplicates concurrent calls using context.cache', async () => {
    const context = { cache: new Map() };
    let callCount = 0;

    const fetchFn = async () => {
        callCount++;
        return { avg_rating: 4.5, count: 12 };
    };

    // Make 5 concurrent requests for the same key
    const results = await Promise.all([
        getCached(context, 'cafe_stats_42', fetchFn),
        getCached(context, 'cafe_stats_42', fetchFn),
        getCached(context, 'cafe_stats_42', fetchFn),
        getCached(context, 'cafe_stats_42', fetchFn),
        getCached(context, 'cafe_stats_42', fetchFn)
    ]);

    assert.equal(callCount, 1, 'fetchFn should be called exactly once for 5 concurrent requests');
    assert.equal(results[0].avg_rating, 4.5);
    assert.equal(results[0].count, 12);
    assert.equal(results.length, 5);
    assert.ok(context.cache.has('cafe_stats_42'), 'context.cache should retain the cached promise');
});

test('getCached falls back safely when context or context.cache is missing', async () => {
    let callCount = 0;
    const fetchFn = async () => {
        callCount++;
        return 'fallback_result';
    };

    const res1 = await getCached(null, 'key_fallback', fetchFn);
    const res2 = await getCached({}, 'key_fallback', fetchFn);

    assert.equal(callCount, 2, 'fetchFn should be called twice when no context cache exists');
    assert.equal(res1, 'fallback_result');
    assert.equal(res2, 'fallback_result');
});
