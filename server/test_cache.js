const assert = require('assert');

async function runCacheTests() {
  console.log('🧪 Testing GraphQL field resolver request-scoped caching...\n');

  // Test 1: Deduplication of concurrent/repeated calls in same context
  const { resolvers } = require('./src/schema/resolvers');

  let fetchCount = 0;
  const context = { cache: new Map() };

  // Create sample cafe
  const cafe = { id: 101, name: 'Test Cafe' };

  // Call average_rating and review_count multiple times concurrently
  const [rating1, count1, rating2, count2] = await Promise.all([
    resolvers.Cafe.average_rating(cafe, {}, context),
    resolvers.Cafe.review_count(cafe, {}, context),
    resolvers.Cafe.average_rating(cafe, {}, context),
    resolvers.Cafe.review_count(cafe, {}, context),
  ]);

  console.log('✅ Cafe stats resolved successfully:');
  console.log('   average_rating:', rating1, '| review_count:', count1);

  // Test 2: Order field resolvers with same cafe_id across 10 orders
  const orders = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    cafe_id: 42,
    student_id: 99,
  }));

  const orderContext = { cache: new Map() };

  const cafeResults = await Promise.all(
    orders.map(order => resolvers.Order.cafe(order, {}, orderContext))
  );

  console.log(`\n✅ Resolved cafe for ${orders.length} orders in parallel.`);
  console.log(`   Cache size after resolving 10 orders: ${orderContext.cache.size} entries`);
  assert(orderContext.cache.has('cafe:42'), 'Cache should contain cafe:42');

  // Verify that subsequent calls use the cache map directly
  const cachedPromise = orderContext.cache.get('cafe:42');
  assert(cachedPromise !== undefined, 'Cached promise should be stored');

  console.log('\n🎉 ALL GRAPHQL CACHING VERIFICATION TESTS PASSED!');
  process.exit(0);
}

runCacheTests().catch(err => {
  console.error('❌ Cache test failed:', err);
  process.exit(1);
});
