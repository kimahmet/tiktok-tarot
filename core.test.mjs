import assert from 'node:assert/strict';
import { extractSignals, top, isEmpty, buildPrompt } from './core.js';

const sample = {
  Activity: {
    'Search History': { SearchList: [{ Date: 'x', SearchTerm: 'Latte Art' }, { SearchTerm: 'latte art' }, { SearchTerm: 'anime' }] },
    'Following List': { Following: [{ UserName: 'coffeeguy' }] },
    'Follower List': { FansList: [{ UserName: 'should_not_appear' }] },
    'Favorite Hashtags': { FavoriteHashtagList: [{ Link: 'https://www.tiktok.com/tag/fitness' }] },
  },
  Comment: { Comments: { CommentsList: [{ Comment: 'harika!' }] } },
  Profile: { 'Profile Information': { ProfileMap: { bioDescription: 'kahve bağımlısı' } } },
  'Direct Messages': { ChatHistory: { x: [{ Content: 'secret', UserName: 'friend' }] } },
};

const s = extractSignals(sample);
assert.deepEqual(s.searches, ['Latte Art', 'latte art', 'anime']);
assert.deepEqual(s.following, ['coffeeguy']);
assert.deepEqual(s.hashtags, ['fitness']);
assert.deepEqual(s.comments, ['harika!']);
assert.equal(s.bio, 'kahve bağımlısı');
assert.deepEqual(top(s.searches, 1), [['latte art', 2]]);
assert.ok(!JSON.stringify(s).includes('secret'), 'DMs must be skipped');
assert.ok(!isEmpty(s));
assert.ok(isEmpty(extractSignals({})));
// Several JSON files from a zip arrive as an array.
assert.deepEqual(extractSignals([{ SearchTerm: 'a' }, { SearchTerm: 'b' }]).searches, ['a', 'b']);
const p = buildPrompt(s);
assert.ok(p.includes('latte art (2)') && p.includes('coffeeguy') && p.includes('fitness'));
console.log('ok');
